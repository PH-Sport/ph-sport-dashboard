-- 037_add_accent_color_to_profiles.sql
-- Color de acento personalizable por cuenta. Guarda la CLAVE del acento
-- (gold|red|orange|green|blue|purple|pink|teal), no el HSL, para poder reafinar
-- los tonos sin migrar datos. NULL = dorado por defecto. Migración aditiva: la
-- actualización la cubre la RLS existente de "actualizar mi propio perfil".

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS accent_color text;

COMMENT ON COLUMN public.profiles.accent_color IS 'Clave del color de acento elegido por el usuario (gold|red|orange|green|blue|purple|pink|teal). NULL = dorado por defecto.';
