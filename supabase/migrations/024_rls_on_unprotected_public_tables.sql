-- Closes the "RLS disabled on public tables" advisors.
-- settings: dead table (0 rows, 0 references in app/db), dropped outright.
-- The others are either empty or only accessed by service_role (Edge Functions
-- / triggers). Enabling RLS without policies = deny-all for authenticated/anon
-- roles; service_role bypasses RLS so the email outbox keeps working.

DROP TABLE IF EXISTS public.settings;

ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_email_deliveries ENABLE ROW LEVEL SECURITY;
