-- 032: Endurecer la subida de avatares.
--
-- Antes: cualquier usuario autenticado podía subir CUALQUIER fichero al bucket
-- público `avatars` (la policy solo comprobaba bucket_id + auth.role()='authenticated',
-- esto último además deprecado). Riesgo: hosting de contenido arbitrario (phishing,
-- ficheros grandes) bajo el dominio del proyecto.
--
-- Ahora:
--   - Límite de tamaño (2 MB) y tipos MIME (solo imágenes) a nivel de bucket.
--   - INSERT restringido a `authenticated` y atado al uid del autor: el nombre del
--     objeto debe empezar por `<auth.uid()>-`. El cliente ya sube como
--     `${user.id}-${random}.${ext}` (lib/hooks/use-user-preferences.ts), así que el
--     patrón existente sigue siendo válido — no rompe subidas previas ni el cliente.

update storage.buckets
set file_size_limit = 2097152,  -- 2 MB
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
where id = 'avatars';

drop policy if exists "Anyone can upload an avatar" on storage.objects;

create policy "avatars_insert_own"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and name like (auth.uid()::text || '-%'));
