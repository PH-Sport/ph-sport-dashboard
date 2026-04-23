-- Adds DELETE branch to log_design_audit so hard deletes leave a forensic snapshot.
-- Also pins search_path='' per Supabase advisor recommendation for SECURITY INVOKER triggers.

CREATE OR REPLACE FUNCTION public.log_design_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
DECLARE
  old_row JSONB;
  new_row JSONB;
  diff JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log(actor_id, entity, entity_id, action, payload)
    VALUES (auth.uid(), 'designs', NEW.id, 'CREATE', to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    old_row := to_jsonb(OLD);
    new_row := to_jsonb(NEW);
    diff := jsonb_strip_nulls(
      jsonb_build_object(
        'status_old', old_row->'status', 'status_new', new_row->'status',
        'designer_old', old_row->'designer_id', 'designer_new', new_row->'designer_id'
      )
    );
    INSERT INTO public.audit_log(actor_id, entity, entity_id, action, payload)
    VALUES (auth.uid(), 'designs', NEW.id, 'UPDATE', diff);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_log(actor_id, entity, entity_id, action, payload)
    VALUES (auth.uid(), 'designs', OLD.id, 'DELETE', to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

DROP TRIGGER IF EXISTS trg_designs_audit ON public.designs;
CREATE TRIGGER trg_designs_audit
AFTER INSERT OR UPDATE OR DELETE ON public.designs
FOR EACH ROW EXECUTE FUNCTION public.log_design_audit();
