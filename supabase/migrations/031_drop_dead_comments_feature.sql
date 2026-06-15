-- 031: Eliminar el feature de comentarios (muerto).
--
-- Las tablas `comments` y `message_read_status` se quitaron del frontend hace tiempo
-- (0 importadores en el código, 0 filas en producción) pero seguían vivas en la BD:
--   - legibles e insertables por cualquier autenticado (superficie muerta),
--   - `comments` seguía en la publicación `supabase_realtime`,
--   - su trigger `notify_on_comment` (SECURITY DEFINER) generaba notificaciones a
--     todos los admin + encolaba emails → vía de spam que esquivaba el hardening de 028.
--
-- message_read_status tiene FK a comments → se elimina primero.

drop table if exists public.message_read_status cascade;
drop table if exists public.comments cascade;

-- La función-trigger queda huérfana al desaparecer la tabla.
drop function if exists public.notify_on_comment() cascade;
