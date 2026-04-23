-- Closes the "policy_exists_rls_disabled" / "bucket_public_listable" advisor on
-- the `avatars` storage bucket.
--
-- Before:
--   The "Avatar images are publicly accessible" SELECT policy let *anyone*
--   (including anon) read rows from storage.objects where bucket_id='avatars'.
--   That means any client could call supabase.storage.from('avatars').list()
--   and enumerate every uploaded avatar file.
--
-- After:
--   Only the owner (the user who uploaded the file) can SELECT the row in
--   storage.objects. Public URL access to the file itself is unaffected
--   because the bucket has `public = true`; Supabase serves files in public
--   buckets directly without consulting storage.objects RLS.
--
-- Why this is safe for the app:
--   * The only client code that touches this bucket is settings-dialog.tsx,
--     which uploads (INSERT) and then calls getPublicUrl() (no SELECT needed).
--   * Avatar URLs are stored in profiles.avatar_url and rendered from there;
--     no part of the app calls .list() on this bucket.

DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;

CREATE POLICY "Avatar owners can read their own object row"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars' AND auth.uid() = owner);
