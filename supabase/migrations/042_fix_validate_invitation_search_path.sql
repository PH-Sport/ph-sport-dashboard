-- 042: validate_invitation vuelve a encontrar sus tablas.
--
-- La migración 025 escribió SET search_path = 'public, pg_temp' entrecomillado.
-- Postgres no lo lee como dos esquemas: lo lee como UNO solo llamado
-- literalmente «public, pg_temp», coma incluida. Comprobable:
--   set search_path to 'public, pg_temp';
--   select to_regclass('invitations');        -- null
--   select to_regclass('public.invitations'); -- public.invitations
--
-- validate_invitation era la única del flujo de alta que nombraba sus tablas
-- sin cualificar, así que era la única que se rompía: lanzaba
-- 42P01 relation "invitations" does not exist, que PostgREST traduce a un 404.
-- El alta por invitación moría ahí. Roto entre el 20 de abril (último alta que
-- funcionó) y el 17 de junio (una invitación que caducó con 0 usos).
--
-- Se adopta el patrón de get_invitation_by_token, que ya estaba bien:
-- search_path vacío y todas las referencias cualificadas. Así la función no
-- depende del search_path para nada.
--
-- OJO: otras 14 funciones arrastran el mismo search_path mal escrito. Hoy
-- sobreviven porque cualifican sus tablas con public., pero están a un
-- CREATE OR REPLACE descuidado de romperse igual. Pendiente de su propia tanda.

CREATE OR REPLACE FUNCTION public.validate_invitation(p_invitation_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_invitation RECORD;
  v_current_uses INT;
BEGIN
  SELECT * INTO v_invitation
  FROM public.invitations
  WHERE id = p_invitation_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  IF v_invitation.expires_at IS NOT NULL AND v_invitation.expires_at < NOW() THEN
    RETURN FALSE;
  END IF;

  SELECT COUNT(*) INTO v_current_uses
  FROM public.invitation_uses
  WHERE invitation_id = p_invitation_id;

  IF v_current_uses >= v_invitation.max_uses THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$function$;
