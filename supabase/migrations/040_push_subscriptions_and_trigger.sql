-- ========================================
-- MIGRATION 040: Web Push — subscriptions + dispatch trigger (Fase B)
-- ========================================
-- Guarda las suscripciones push por dispositivo y engancha el envío al mismo
-- punto que el email: un trigger AFTER INSERT on notifications que hace
-- net.http_post a la edge function send-push-notification (fire-and-forget).

-- ----------------------------------------
-- Tabla: push_subscriptions (una fila por dispositivo/navegador)
-- ----------------------------------------
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_idx
  on public.push_subscriptions(user_id);

alter table public.push_subscriptions enable row level security;

-- Cada usuario gestiona (select/insert/update/delete) solo las suyas.
-- La edge function accede con service_role (bypassa RLS).
drop policy if exists "Users manage own push subscriptions" on public.push_subscriptions;
create policy "Users manage own push subscriptions"
  on public.push_subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ----------------------------------------
-- Dispatch: trigger fire-and-forget hacia la edge function
-- ----------------------------------------
create or replace function public.notify_user_push()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  project_url text;
  auth_key text;
begin
  -- Reutiliza los secretos de vault ya configurados para el email. El proyecto
  -- guarda anon_key (no service_role_key), así que replicamos el fallback del
  -- dispatcher de email (migración 018): service_role si existe, si no anon.
  select decrypted_secret into project_url
    from vault.decrypted_secrets where name = 'notify_email_project_url' limit 1;
  select decrypted_secret into auth_key
    from vault.decrypted_secrets where name = 'notify_email_service_role_key' limit 1;
  if auth_key is null then
    select decrypted_secret into auth_key
      from vault.decrypted_secrets where name = 'notify_email_anon_key' limit 1;
  end if;

  if project_url is null or auth_key is null then
    return NEW; -- sin secretos: no-op silencioso
  end if;

  perform net.http_post(
    url := project_url || '/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || auth_key
    ),
    body := row_to_json(NEW)::jsonb,
    timeout_milliseconds := 10000
  );

  return NEW;
exception
  when others then
    -- Best-effort: un fallo de push nunca debe romper el INSERT ni el email.
    return NEW;
end;
$$;

drop trigger if exists trigger_notify_on_push on public.notifications;
create trigger trigger_notify_on_push
  after insert on public.notifications
  for each row execute function public.notify_user_push();

revoke execute on function public.notify_user_push() from anon, authenticated;

-- ========================================
-- ✅ MIGRACIÓN 040 COMPLETADA
-- ========================================
