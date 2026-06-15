-- 030: Revocar EXECUTE de funciones SECURITY DEFINER no destinadas a llamada por API.
--
-- Contexto: Postgres concede EXECUTE a PUBLIC por defecto en cada función nueva,
-- y los roles `anon` / `authenticated` heredan de PUBLIC. Eso convertía a estas
-- funciones SECURITY DEFINER en endpoints RPC públicos (/rest/v1/rpc/...), con
-- riesgo de spam de emails/notificaciones por cualquiera (incluido anónimo).
-- Detectado por los advisors de Supabase (0028/0029).
--
-- Estas funciones se ejecutan vía TRIGGER (handle_new_user, notify_on_assignment,
-- notify_user_email, prevent_non_admin_designer_reassignment, cleanup_old_notifications)
-- o vía CRON (check_upcoming_deadlines, retry_notification_email_deliveries), siempre
-- como el owner `postgres`, así que revocar EXECUTE a los roles de cliente NO les afecta.
--
-- NO se tocan use_invitation() ni validate_invitation(): el alta por invitación las
-- llama con rol `anon` antes de tener sesión completa.

revoke execute on function public.check_upcoming_deadlines() from public, anon, authenticated;
revoke execute on function public.cleanup_old_notifications() from public, anon, authenticated;
revoke execute on function public.dispatch_notification_email(uuid, integer) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.notify_on_assignment() from public, anon, authenticated;
revoke execute on function public.notify_user_email() from public, anon, authenticated;
revoke execute on function public.prevent_non_admin_designer_reassignment() from public, anon, authenticated;
revoke execute on function public.retry_notification_email_deliveries(integer) from public, anon, authenticated;

-- Preservar el backend: service_role nunca se expone al cliente.
grant execute on function public.dispatch_notification_email(uuid, integer) to service_role;
grant execute on function public.retry_notification_email_deliveries(integer) to service_role;
grant execute on function public.check_upcoming_deadlines() to service_role;
grant execute on function public.cleanup_old_notifications() to service_role;
