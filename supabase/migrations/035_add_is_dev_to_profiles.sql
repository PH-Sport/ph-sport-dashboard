-- 035_add_is_dev_to_profiles.sql
-- Flag de cuenta developer: habilita el conmutador "Ver como" (preview de vistas)
-- y oculta la cuenta de la lista de Miembros. Se gestiona manualmente desde
-- Supabase (poner is_dev = true en la cuenta dev). Migración aditiva, sin impacto
-- en RLS ni seguridad (el backend sigue exigiendo rol ADMIN real).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_dev boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.is_dev IS 'Cuenta developer: habilita el conmutador "Ver como" y se oculta de la lista de Miembros. Gestionada manualmente desde Supabase.';
