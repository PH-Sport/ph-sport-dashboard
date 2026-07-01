-- 037: Traza histórica del diseñador eliminado ("Exmiembro")
-- Al borrar un perfil, estampar id + nombre del diseñador en sus diseños antes
-- de que la FK designs.designer_id (ON DELETE SET NULL) borre el vínculo.

-- Prerrequisito (fix del borrado): audit_log.actor_id era NOT NULL pese a tener
-- FK ON DELETE SET NULL. Al borrar un diseñador, la cascada hace UPDATE de
-- designs (SET NULL en designer_id) → dispara trg_designs_audit → INSERT en
-- audit_log con actor_id = auth.uid(), que en contexto de borrado (service-role/
-- cascada) es NULL → violaba el NOT NULL y abortaba TODO el borrado. Además, las
-- filas de audit_log del propio actor se pondrían a NULL por la FK. Hacerlo
-- nullable es correcto: actor_id NULL = acción de sistema/automática.
ALTER TABLE public.audit_log ALTER COLUMN actor_id DROP NOT NULL;

ALTER TABLE public.designs
  ADD COLUMN IF NOT EXISTS former_designer_id   uuid,
  ADD COLUMN IF NOT EXISTS former_designer_name text;

COMMENT ON COLUMN public.designs.former_designer_id IS
  'Id (profiles.id) del diseñador cuya cuenta se eliminó. Sin FK: registro histórico. Clave estable para filtrar por exmiembro.';
COMMENT ON COLUMN public.designs.former_designer_name IS
  'display_name congelado del diseñador eliminado, para mostrar "Nombre · exmiembro".';

CREATE OR REPLACE FUNCTION public.snapshot_designer_on_profile_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  UPDATE public.designs
     SET former_designer_id   = OLD.id,
         former_designer_name = OLD.display_name
   WHERE designer_id = OLD.id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_snapshot_designer_before_profile_delete ON public.profiles;
CREATE TRIGGER trg_snapshot_designer_before_profile_delete
  BEFORE DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.snapshot_designer_on_profile_delete();
