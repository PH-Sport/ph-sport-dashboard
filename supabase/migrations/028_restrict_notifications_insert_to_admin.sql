-- Replace the permissive "always true" INSERT policy on public.notifications
-- with an admin-only one. Closes the "rls_policy_always_true" advisor.
--
-- Why this is safe:
--  * All SECURITY DEFINER triggers that create notifications
--    (notify_on_assignment, notify_on_comment, notify_user_email) are owned
--    by `postgres`, which has BYPASSRLS, so they continue to insert.
--  * The /api/designs/bulk route inserts notifications while authenticated as
--    ADMIN, so is_admin(auth.uid()) returns true and the insert is allowed.
--  * A DESIGNER client can no longer call supabase.from('notifications').insert
--    to spam other users, which was possible before.

DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

CREATE POLICY notifications_insert_admin
ON public.notifications
FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));
