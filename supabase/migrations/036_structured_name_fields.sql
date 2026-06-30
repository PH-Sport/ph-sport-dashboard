-- Campos de nombre estructurados en profiles.
--
-- Fuente de verdad: given_name (Nombre, obligatorio), family_name (Primer
-- apellido, nullable), alias (nombre para mostrar, opcional).
-- Derivaciones GENERADAS por Postgres (no se mantienen a mano → no pueden
-- desincronizarse):
--   * full_name    = Nombre + Primer apellido  (conserva el nombre de columna
--                    de siempre; sus lectores —edge function de email— siguen
--                    funcionando sin re-derivar).
--   * display_name = alias || given_name        (regla de display centralizada).
--
-- Migración additive + backfill; el único objeto de BD que referenciaba
-- full_name aparte del trigger es use_invitation (lo usa solo para la tabla de
-- auditoría invitation_uses, no para profiles → no se toca).

-- 1) Columnas fuente de verdad (nullable de momento, para el backfill)
ALTER TABLE public.profiles
  ADD COLUMN given_name  text,
  ADD COLUMN family_name text,
  ADD COLUMN alias       text;

-- 2) Backfill: primer token = Nombre, segundo token = Primer apellido (resto se ignora)
UPDATE public.profiles SET
  given_name  = NULLIF(btrim(split_part(COALESCE(full_name, ''), ' ', 1)), ''),
  family_name = NULLIF(btrim(split_part(COALESCE(full_name, ''), ' ', 2)), '');

-- 2b) Overrides manuales (nombre compuesto / apellido a completar)
UPDATE public.profiles SET given_name = 'José Joaquín', family_name = 'Blandino'
  WHERE id = '6c47fb85-9508-4e53-9c10-0a7473a4d922';  -- José Joaquín (se descarta "Rizo")
UPDATE public.profiles SET family_name = 'Rodríguez'
  WHERE id = '07ac09f2-9daf-4734-9d59-06731195dc11';  -- Mario

-- 2c) Salvaguarda: ninguna fila puede quedar sin Nombre
UPDATE public.profiles SET given_name = 'Usuario'
  WHERE given_name IS NULL OR btrim(given_name) = '';

-- 3) Nombre obligatorio
ALTER TABLE public.profiles ALTER COLUMN given_name SET NOT NULL;

-- 4) Reemplazar full_name (plano) por GENERADA + añadir display_name GENERADA
ALTER TABLE public.profiles DROP COLUMN full_name;
ALTER TABLE public.profiles
  ADD COLUMN full_name text GENERATED ALWAYS AS
    (btrim(given_name || ' ' || COALESCE(family_name, ''))) STORED,
  ADD COLUMN display_name text GENERATED ALWAYS AS
    (COALESCE(NULLIF(btrim(alias), ''), given_name)) STORED;

-- 5) Trigger de alta: escribe los campos estructurados desde la metadata de
--    signUp. Tolerante con clientes que aún manden full_name (lo parte).
--    Mantiene role='DESIGNER' por defecto (fix de seguridad de 027 intacto).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public, pg_temp'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, given_name, family_name, alias, role)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(btrim(NEW.raw_user_meta_data->>'given_name'), ''),
      NULLIF(btrim(split_part(NEW.raw_user_meta_data->>'full_name', ' ', 1)), ''),
      'Usuario'
    ),
    COALESCE(
      NULLIF(btrim(NEW.raw_user_meta_data->>'family_name'), ''),
      NULLIF(btrim(split_part(NEW.raw_user_meta_data->>'full_name', ' ', 2)), '')
    ),
    NULLIF(btrim(NEW.raw_user_meta_data->>'alias'), ''),
    'DESIGNER'::public.role_enum
  );
  RETURN NEW;
END;
$function$;
