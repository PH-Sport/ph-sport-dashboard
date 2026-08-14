-- ========================================
-- MIGRATION 041: el aviso de asignación lleva al diseño, no a una ruta muerta
-- ========================================
-- notify_on_assignment escribía el link '/communications/<id>'. Esa ruta se
-- retiró hace tiempo y next.config.js la redirige a '/inicio' DESCARTANDO el id,
-- así que quien recibía "Te han asignado el diseño X" y pulsaba el aviso
-- aterrizaba en Inicio sin rastro del diseño. Y si la entrega caía fuera de la
-- semana en curso, Inicio tampoco lo mostraba: el trabajo quedaba invisible.
--
-- Alcance del fallo en producción: 90 notificaciones emitidas así entre
-- 2026-01-28 y 2026-08-13, todas sin leer. notify_on_assignment era la única
-- función que generaba ese enlace.
--
-- Destino correcto: '/disenos?open=<id>'. La página de diseños ya interpreta ese
-- parámetro (app/(dashboard)/disenos/page.tsx) y abre la hoja de detalle
-- cargando el diseño por id vía /api/designs/[id] — funciona aunque el diseño
-- quede fuera del filtro de semana activo, que es justo el caso que lo destapó.
--
-- Se preserva el resto de la función tal cual está viva en producción: flag de
-- supresión para los altas en lote, meta con assignment_count/design_title y el
-- search_path fijado por la migración 025.

CREATE OR REPLACE FUNCTION public.notify_on_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public, pg_temp'
AS $function$
BEGIN
  -- Si el flag de supresión está activo, saltar notificación
  -- (usado en batch inserts donde se genera notificación agregada manual)
  IF NEW.suppress_assignment_notification = true THEN
    NEW.suppress_assignment_notification := false;
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.designer_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, title, message, link, meta)
      VALUES (
        NEW.designer_id,
        'assignment',
        'Nueva asignación',
        'Te han asignado el diseño "' || COALESCE(NEW.title, 'Sin título') || '"',
        '/disenos?open=' || NEW.id,
        jsonb_build_object(
          'assignment_count', 1,
          'design_title', COALESCE(NEW.title, 'Sin título')
        )
      );
    END IF;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.designer_id IS NOT NULL AND
       (OLD.designer_id IS NULL OR OLD.designer_id != NEW.designer_id) THEN
      INSERT INTO public.notifications (user_id, type, title, message, link, meta)
      VALUES (
        NEW.designer_id,
        'assignment',
        'Nueva asignación',
        'Te han asignado el diseño "' || COALESCE(NEW.title, 'Sin título') || '"',
        '/disenos?open=' || NEW.id,
        jsonb_build_object(
          'assignment_count', 1,
          'design_title', COALESCE(NEW.title, 'Sin título')
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- Rescata los avisos ya emitidos: siguen en la campana de cada diseñador, sin
-- leer, apuntando a la ruta muerta. Los tres triggers de la tabla notifications
-- (email, push, cleanup) son AFTER INSERT, así que este UPDATE no reenvía nada.
UPDATE public.notifications
SET link = '/disenos?open=' || substring(link from '^/communications/(.*)$')
WHERE link LIKE '/communications/%';
