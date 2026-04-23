-- Closes the "function_search_path_mutable" advisor for all public-schema functions.
-- A mutable search_path can be exploited if a malicious user creates objects in a
-- temporary schema that earlier path entries reference. Pinning it removes that
-- vector without changing function bodies.
-- 'public, pg_temp' preserves current behavior (all referenced tables live in public).
-- log_design_audit was already pinned in 023_add_delete_to_design_audit.sql.

ALTER FUNCTION public.check_upcoming_deadlines() SET search_path = 'public, pg_temp';
ALTER FUNCTION public.cleanup_old_notifications() SET search_path = 'public, pg_temp';
ALTER FUNCTION public.dispatch_notification_email(p_delivery_id uuid, p_timeout_milliseconds integer) SET search_path = 'public, pg_temp';
ALTER FUNCTION public.handle_new_user() SET search_path = 'public, pg_temp';
ALTER FUNCTION public.is_admin(uid uuid) SET search_path = 'public, pg_temp';
ALTER FUNCTION public.notification_email_retry_delay(p_attempt_count integer) SET search_path = 'public, pg_temp';
ALTER FUNCTION public.notify_on_assignment() SET search_path = 'public, pg_temp';
ALTER FUNCTION public.notify_on_comment() SET search_path = 'public, pg_temp';
ALTER FUNCTION public.notify_user_email() SET search_path = 'public, pg_temp';
ALTER FUNCTION public.reset_deadline_notified() SET search_path = 'public, pg_temp';
ALTER FUNCTION public.retry_notification_email_deliveries(p_limit integer) SET search_path = 'public, pg_temp';
ALTER FUNCTION public.set_updated_at() SET search_path = 'public, pg_temp';
ALTER FUNCTION public.update_comments_updated_at() SET search_path = 'public, pg_temp';
ALTER FUNCTION public.update_updated_at_column() SET search_path = 'public, pg_temp';
ALTER FUNCTION public.use_invitation(p_invitation_id uuid, p_user_id uuid, p_email text, p_full_name text) SET search_path = 'public, pg_temp';
ALTER FUNCTION public.validate_invitation(p_invitation_id uuid) SET search_path = 'public, pg_temp';
