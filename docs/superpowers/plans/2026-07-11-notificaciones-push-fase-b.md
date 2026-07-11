# Notificaciones Push + cimientos (Fase B) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline, elegido por Mario) o subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Añadir un canal de notificaciones push (web push autohospedado con VAPID) que cuelga del mismo trigger `AFTER INSERT on notifications` del email, más un pulido de los cimientos (centro in-app + branding del email).

**Architecture:** Cuando nace una fila en `notifications`, un trigger nuevo (`notify_user_push`) hace `net.http_post` a una edge function `send-push-notification` (Deno + web-push) que respeta `preferences.push[type]`, envía a las `push_subscriptions` del usuario y poda las muertas. El SW (ya existente de la Fase A) gana handlers `push`/`notificationclick`. El cliente se suscribe desde Ajustes (por-dispositivo). Cimientos: agrupación por día + filtro en la campana, y renombrado PHSPORT en el email.

**Tech Stack:** Next 15 (App Router), Supabase (Postgres + pg_net + Edge Functions Deno), web-push (VAPID), framer-motion, Vitest.

## Global Constraints

- Marca visible: **PHSPORT** (una palabra). Nada de "PH Sport" en texto nuevo.
- Numeración de migración nueva: **040** (techo local = 039; hay duplicados 036/037). **Inspeccionar estado vivo de la BD antes de aplicar DDL** (la memoria avisa de divergencia de tracking).
- **La BD de `preview` es la de PRODUCCIÓN** (no hay staging). Toda migración/edge function afecta a prod. Aplicar solo cosas aditivas y de bajo riesgo; NO merge a `main` sin OK explícito de Mario.
- Push = **best-effort**: dispatch fire-and-forget, edge function siempre responde 200, suscripciones muertas (404/410) se podan.
- Rendimiento: medir siempre en `next build && next start`, nunca `dev`.
- Stagear por rutas explícitas (`git add <ruta>`), nunca `git add -A` (riesgo de commits concurrentes).
- Idioma de código/copys: español, tono de la app.

---

### Task 1: Canal `push` en las preferencias (funciones puras, TDD)

**Files:**
- Modify: `lib/utils/notification-preferences.ts`
- Test: `lib/utils/notification-preferences.test.ts` (nuevo)

**Interfaces:**
- Produces: `NotificationChannel = 'email' | 'in_app' | 'push'`; `NotificationPreferences` gana `push: NotificationChannelPrefs`; `DEFAULT_NOTIFICATION_PREFERENCES.push` (todo true); `dbToUi`/`uiToDb` mapean `push` con las mismas claves snake_case (`assignment`/`status_change`/`deadline`).

- [ ] **Step 1: Test que fija el nuevo contrato**

```ts
// lib/utils/notification-preferences.test.ts
import { describe, it, expect } from 'vitest';
import { dbToUi, uiToDb, DEFAULT_NOTIFICATION_PREFERENCES } from './notification-preferences';

describe('notification-preferences push channel', () => {
  it('defaults push a true en los 3 eventos', () => {
    expect(DEFAULT_NOTIFICATION_PREFERENCES.push).toEqual({
      assignment: true, statusChanges: true, upcomingDeadlines: true,
    });
  });
  it('dbToUi rellena push ausente a true (retrocompatible)', () => {
    const ui = dbToUi({ email: {}, in_app: {} });
    expect(ui.push).toEqual({ assignment: true, statusChanges: true, upcomingDeadlines: true });
  });
  it('dbToUi lee push desde snake_case', () => {
    const ui = dbToUi({ push: { assignment: false, status_change: true, deadline: false } });
    expect(ui.push).toEqual({ assignment: false, statusChanges: true, upcomingDeadlines: false });
  });
  it('uiToDb serializa push a snake_case', () => {
    const db = uiToDb(DEFAULT_NOTIFICATION_PREFERENCES);
    expect(db.push).toEqual({ assignment: true, status_change: true, deadline: true });
  });
  it('round-trip preserva push', () => {
    const start = { ...DEFAULT_NOTIFICATION_PREFERENCES, push: { assignment: false, statusChanges: false, upcomingDeadlines: true } };
    expect(dbToUi(uiToDb(start))).toEqual(start);
  });
});
```

- [ ] **Step 2: Ejecutar y ver fallar** — `npx vitest run lib/utils/notification-preferences.test.ts` → FAIL (push undefined).

- [ ] **Step 3: Implementar** en `lib/utils/notification-preferences.ts`:
  - `NotificationChannel`: añadir `| 'push'`.
  - `NotificationPreferences`: añadir `push: NotificationChannelPrefs;`.
  - `NotificationPreferencesDb`: añadir bloque `push?` con `assignment?/status_change?/deadline?`.
  - `DEFAULT_NOTIFICATION_PREFERENCES`: añadir `push: { assignment: true, statusChanges: true, upcomingDeadlines: true }`.
  - `dbToUi`: añadir bloque `push: { assignment: db.push?.assignment ?? true, statusChanges: db.push?.status_change ?? true, upcomingDeadlines: db.push?.deadline ?? true }`.
  - `uiToDb`: añadir `push: { assignment: ui.push.assignment, status_change: ui.push.statusChanges, deadline: ui.push.upcomingDeadlines }`.

- [ ] **Step 4: Ejecutar y ver pasar** — mismo comando → PASS (5 tests).

- [ ] **Step 5: Commit** — `git add lib/utils/notification-preferences.ts lib/utils/notification-preferences.test.ts` + `feat(notifs): canal push en preferencias`.

---

### Task 2: Script de claves VAPID + helper de cliente

**Files:**
- Create: `scripts/generate-vapid-keys.mjs`
- Create: `lib/push/vapid.ts`

**Interfaces:**
- Produces: `lib/push/vapid.ts` exporta `VAPID_PUBLIC_KEY: string` (de `process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY`) y `urlBase64ToUint8Array(base64: string): Uint8Array`.

- [ ] **Step 1: Script generador** (usa `web-push`, que instalaremos en Task 4; si aún no está, `npx web-push generate-vapid-keys`). Contenido:

```js
// scripts/generate-vapid-keys.mjs  ·  node scripts/generate-vapid-keys.mjs
import webpush from 'web-push';
const keys = webpush.generateVAPIDKeys();
console.log('VAPID_PUBLIC_KEY  =', keys.publicKey);
console.log('VAPID_PRIVATE_KEY =', keys.privateKey);
console.log('\nPega la pública en Vercel como NEXT_PUBLIC_VAPID_PUBLIC_KEY (Production+Preview).');
console.log('Pega ambas + VAPID_SUBJECT (mailto:...) como secretos de la edge function en Supabase.');
```

- [ ] **Step 2: Helper de cliente** `lib/push/vapid.ts`:

```ts
export const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';

/** Convierte la clave pública VAPID (base64url) al Uint8Array que espera pushManager.subscribe. */
export function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}
```

- [ ] **Step 3: Commit** — `git add scripts/generate-vapid-keys.mjs lib/push/vapid.ts` + `feat(push): script VAPID + helper de cliente`.

*(La generación real de claves y su pegado en Vercel/Supabase es un paso manual de Mario — Task 10.)*

---

### Task 3: Migración 040 — `push_subscriptions` + trigger

**Files:**
- Create: `supabase/migrations/040_push_subscriptions_and_trigger.sql`

**Interfaces:**
- Produces: tabla `public.push_subscriptions`; trigger `trigger_notify_on_push` sobre `notifications` que dispara `public.notify_user_push()`.

- [ ] **Step 1: Escribir la migración** (mirroring del patrón email de la 018; usa vault secrets del email para url/key):

```sql
-- 040: push_subscriptions + dispatch a la edge function send-push-notification
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
create index if not exists push_subscriptions_user_idx on public.push_subscriptions(user_id);

alter table public.push_subscriptions enable row level security;
create policy "Users manage own push subscriptions"
  on public.push_subscriptions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Dispatch fire-and-forget (best-effort). Reutiliza los secretos vault del email.
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
  select decrypted_secret into project_url from vault.decrypted_secrets
    where name = 'notify_email_project_url' limit 1;
  select decrypted_secret into auth_key from vault.decrypted_secrets
    where name = 'notify_email_service_role_key' limit 1;
  if project_url is null or auth_key is null then
    return NEW; -- sin secretos configurados: no-op
  end if;

  perform net.http_post(
    url := project_url || '/functions/v1/send-push-notification',
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || auth_key),
    body := row_to_json(NEW)::jsonb,
    timeout_milliseconds := 10000
  );
  return NEW;
exception when others then
  return NEW; -- best-effort: nunca romper el INSERT ni el email
end;
$$;

drop trigger if exists trigger_notify_on_push on public.notifications;
create trigger trigger_notify_on_push
  after insert on public.notifications
  for each row execute function public.notify_user_push();

revoke execute on function public.notify_user_push() from anon, authenticated;
```

- [ ] **Step 2: Verificar sintaxis local** (revisión visual; se aplica a la BD viva en Task 10 tras inspección).

- [ ] **Step 3: Commit** — `git add supabase/migrations/040_push_subscriptions_and_trigger.sql` + `feat(push): migración 040 push_subscriptions + trigger`.

---

### Task 4: Edge function `send-push-notification`

**Files:**
- Create: `supabase/functions/send-push-notification/index.ts`
- Create: `supabase/functions/send-push-notification/deno.json`

**Interfaces:**
- Consumes: payload = fila de `notifications` (`{ id, user_id, type, title, message, link, ... }`).
- Produces: envía web push; responde 200 siempre.

- [ ] **Step 1: `deno.json`** (imports):

```json
{ "imports": { "web-push": "npm:web-push@3.6.7", "@supabase/supabase-js": "jsr:@supabase/supabase-js@2" } }
```

- [ ] **Step 2: `index.ts`**:

```ts
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:soporte@phsport.app";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

// type de notificación → clave de preferencia snake_case
const PREF_KEY: Record<string, string> = {
  assignment: "assignment", status_change: "status_change", deadline: "deadline",
};

Deno.serve(async (req) => {
  try {
    const n = await req.json(); // fila de notifications
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    // 1. Preferencia push del usuario para este tipo (default true)
    const { data: profile } = await supabase
      .from("profiles").select("notification_preferences").eq("id", n.user_id).single();
    const prefKey = PREF_KEY[n.type] ?? n.type;
    const enabled = profile?.notification_preferences?.push?.[prefKey] ?? true;
    if (!enabled) return new Response(JSON.stringify({ skipped: "pref" }), { status: 200 });

    // 2. Suscripciones del usuario
    const { data: subs } = await supabase
      .from("push_subscriptions").select("*").eq("user_id", n.user_id);
    if (!subs?.length) return new Response(JSON.stringify({ skipped: "no_subs" }), { status: 200 });

    // 3. Payload
    const payload = JSON.stringify({
      title: n.title ?? "PHSPORT",
      body: n.message ?? "",
      url: n.link ?? "/inicio",
      tag: n.type ?? "system",
    });

    // 4. Enviar + podar muertas
    await Promise.all(subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload
        );
      } catch (err) {
        const code = (err as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) {
          await supabase.from("push_subscriptions").delete().eq("id", s.id);
        }
      }
    }));

    return new Response(JSON.stringify({ ok: true, sent: subs.length }), { status: 200 });
  } catch (err) {
    console.error("send-push-notification:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 200 }); // best-effort
  }
});
```

- [ ] **Step 3: Riesgo web-push** — si `npm:web-push` no corre en el runtime edge (fallo al desplegar/ejecutar en Task 10), plan B: firmar VAPID a mano con `jsr:@ts-rex/webpush` o `jose` + `aes128gcm`. Documentar el resultado.

- [ ] **Step 4: Commit** — `git add supabase/functions/send-push-notification/` + `feat(push): edge function send-push-notification`.

---

### Task 5: Handlers `push` + `notificationclick` en el SW

**Files:**
- Modify: `public/sw.js`

- [ ] **Step 1: Añadir al final de `public/sw.js`**:

```js
// --- Push (Fase B) ---
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = {}; }
  const title = data.title || 'PHSPORT';
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: data.tag || 'phsport',
      data: { url: data.url || '/inicio' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/inicio';
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of all) {
        if ('focus' in client) { client.navigate(url); return client.focus(); }
      }
      return self.clients.openWindow(url);
    })()
  );
});
```

- [ ] **Step 2: Subir versión de caché** — en `public/sw.js` cambiar `const CACHE = 'phsport-v1'` → `'phsport-v2'` (fuerza actualización del SW en los dispositivos ya instalados).

- [ ] **Step 3: Commit** — `git add public/sw.js` + `feat(push): handlers push y notificationclick en el SW`.

---

### Task 6: Hook `usePushSubscription`

**Files:**
- Create: `lib/push/use-push-subscription.ts`

**Interfaces:**
- Consumes: `VAPID_PUBLIC_KEY`, `urlBase64ToUint8Array` (Task 2); `createClient` de `@/lib/supabase/client`; `useAuth`.
- Produces: hook que devuelve `{ isSupported, permission, isSubscribed, canPromptOnThisDevice, loading, subscribe, unsubscribe }`.

- [ ] **Step 1: Implementar**:

```ts
'use client';
import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/auth-context';
import { logger } from '@/lib/utils/logger';
import { VAPID_PUBLIC_KEY, urlBase64ToUint8Array } from './vapid';

function isIOS() {
  const ua = navigator.userAgent;
  return /iphone|ipad|ipod/i.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1);
}
function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function usePushSubscription() {
  const { user } = useAuth();
  const supabase = createClient();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [canPromptOnThisDevice, setCanPrompt] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supported = typeof window !== 'undefined' && 'serviceWorker' in navigator &&
      'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);
    if (!supported) { setLoading(false); return; }
    setPermission(Notification.permission);
    setCanPrompt(!(isIOS() && !isStandalone())); // iOS: solo con la app instalada
    (async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        setIsSubscribed(!!sub);
      } finally { setLoading(false); }
    })();
  }, []);

  const subscribe = useCallback(async () => {
    if (!user || !VAPID_PUBLIC_KEY) return false;
    const perm = await Notification.requestPermission();
    setPermission(perm);
    if (perm !== 'granted') return false;
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
    const json = sub.toJSON();
    const { error } = await supabase.from('push_subscriptions').upsert({
      user_id: user.id,
      endpoint: sub.endpoint,
      p256dh: json.keys?.p256dh,
      auth: json.keys?.auth,
      user_agent: navigator.userAgent,
      last_seen_at: new Date().toISOString(),
    }, { onConflict: 'endpoint' });
    if (error) { logger.error('push subscribe upsert', error); return false; }
    setIsSubscribed(true);
    return true;
  }, [user, supabase]);

  const unsubscribe = useCallback(async () => {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
      await sub.unsubscribe();
    }
    setIsSubscribed(false);
  }, [supabase]);

  return { isSupported, permission, isSubscribed, canPromptOnThisDevice, loading, subscribe, unsubscribe };
}
```

- [ ] **Step 2: type-check** — `npm run type-check` → sin errores.
- [ ] **Step 3: Commit** — `git add lib/push/use-push-subscription.ts` + `feat(push): hook usePushSubscription`.

---

### Task 7: Ajustes — sección "Activar en este dispositivo" + columna Push

**Files:**
- Modify: `components/features/account/notifications-tab.tsx`
- Create: `components/features/account/push-device-toggle.tsx`

**Interfaces:**
- Consumes: `usePushSubscription` (Task 6); `NotificationChannel`/`NotificationEvent` con `push` (Task 1).

- [ ] **Step 1: Componente `push-device-toggle.tsx`** — sección con `usePushSubscription`; estados: no soportado ("Tu navegador no admite notificaciones push"), iOS sin instalar ("Instala la app en tu pantalla de inicio para activar los avisos"), permiso denegado ("Has bloqueado las notificaciones; actívalas en los ajustes del navegador"), y el toggle activo/inactivo (llama `subscribe`/`unsubscribe`, con `toast`). Estilo con tokens (`bg-muted/30`, `Switch`, `Smartphone` de lucide).

- [ ] **Step 2: `notifications-tab.tsx`** — (a) renderizar `<PushDeviceToggle />` arriba; (b) rejilla de 3→4 columnas: cabecera `Evento · Email · In-App · Push` (icono `BellRing`/`Smartphone` para Push) y en cada fila un 3er `<Switch>` con `checked={preferences.push[row.type]}` y `onCheckedChange={() => onToggle('push', row.type)}`. Ajustar `grid-cols-3` → `grid-cols-4`.

- [ ] **Step 3: Verificar** que `use-user-preferences.ts` propaga `push` sin cambios (guarda el objeto entero; el tipo ya lo incluye por Task 1). type-check + build.

- [ ] **Step 4: Commit** — `git add components/features/account/notifications-tab.tsx components/features/account/push-device-toggle.tsx` + `feat(push): activar por dispositivo + columna Push en Ajustes`.

---

### Task 8: Pulido del centro in-app (agrupación por día + filtro)

**Files:**
- Create: `lib/utils/group-notifications.ts` + `lib/utils/group-notifications.test.ts`
- Modify: `lib/hooks/use-notifications.ts` (limit 20→30)
- Modify: `components/layout/notifications-dropdown.tsx`

**Interfaces:**
- Produces: `groupNotificationsByDay(items, now?): { label: 'Hoy'|'Ayer'|'Antes'; items: Notification[] }[]`.

- [ ] **Step 1: Test del agrupador**:

```ts
// lib/utils/group-notifications.test.ts
import { describe, it, expect } from 'vitest';
import { groupNotificationsByDay } from './group-notifications';
const mk = (id: string, iso: string) => ({ id, type: 'system', title: id, message: '', read: false, created_at: iso } as any);
describe('groupNotificationsByDay', () => {
  const now = new Date('2026-07-11T12:00:00Z');
  it('separa Hoy / Ayer / Antes y conserva orden', () => {
    const groups = groupNotificationsByDay([
      mk('a', '2026-07-11T09:00:00Z'), mk('b', '2026-07-10T20:00:00Z'), mk('c', '2026-07-01T10:00:00Z'),
    ], now);
    expect(groups.map(g => g.label)).toEqual(['Hoy', 'Ayer', 'Antes']);
    expect(groups[0].items.map((i: any) => i.id)).toEqual(['a']);
  });
  it('omite grupos vacíos', () => {
    const groups = groupNotificationsByDay([mk('a', '2026-07-11T09:00:00Z')], now);
    expect(groups.map(g => g.label)).toEqual(['Hoy']);
  });
});
```

- [ ] **Step 2: Ver fallar** — `npx vitest run lib/utils/group-notifications.test.ts` → FAIL.

- [ ] **Step 3: Implementar** `lib/utils/group-notifications.ts` con `date-fns` (`isToday`, `isYesterday`) usando `now` inyectable para el test (comparar por fecha local). Mantener el orden de entrada dentro de cada grupo; devolver solo grupos no vacíos en orden Hoy→Ayer→Antes.

- [ ] **Step 4: Ver pasar** — mismo comando → PASS.

- [ ] **Step 5: Dropdown** — en `notifications-dropdown.tsx`: (a) subir a 30 el limit en `use-notifications.ts`; (b) estado `filter: 'all' | 'unread'` con un toggle pequeño en la cabecera; (c) aplicar filtro y luego `groupNotificationsByDay`, renderizando cabeceras de sección "Hoy/Ayer/Antes" entre los items. Conservar todo lo actual (marcar leído, borrar, realtime, accesibilidad, animación de la campana).

- [ ] **Step 6: build + tests** — `npm run build` y `npm test` verdes.

- [ ] **Step 7: Commit** — `git add lib/utils/group-notifications.ts lib/utils/group-notifications.test.ts lib/hooks/use-notifications.ts components/layout/notifications-dropdown.tsx` + `feat(notifs): agrupación por día y filtro en la campana`.

---

### Task 9: Refresco de marca del email (PH Sport → PHSPORT)

**Files:**
- Modify: `supabase/functions/send-notification-email/index.tsx`

- [ ] **Step 1: Reemplazar** todas las apariciones de "PH Sport" por "PHSPORT" (asuntos en `buildEmailCopy`, `alt="PH Sport"` del logo, pie "…tu cuenta de PH Sport", `from: 'PH Sport <...>'`). Mantener logo dorado, dominio `phsport.app`, y toda la maquinaria.

- [ ] **Step 2: Verificar** que no queda ningún "PH Sport" — `grep -n "PH Sport" supabase/functions/send-notification-email/index.tsx` → sin resultados.

- [ ] **Step 3: Commit** — `git add supabase/functions/send-notification-email/index.tsx` + `refactor(email): renombrar PH Sport → PHSPORT`.

---

### Task 10: Despliegue, claves y verificación end-to-end

**Files:** (ninguno de código; acciones de infraestructura + verificación)

- [ ] **Step 1: Inspeccionar estado vivo de la BD** (MCP Supabase, project `zhuluiqpakuwehibjyva`): confirmar que NO existe ya `push_subscriptions` ni el trigger, y ver el nº real de migraciones aplicadas.
- [ ] **Step 2: Generar claves VAPID** — `node scripts/generate-vapid-keys.mjs` (tras instalar web-push o vía `npx web-push`). Guardar los valores.
- [ ] **Step 3: Aplicar migración 040** a la BD viva (MCP `apply_migration`). Verificar que un INSERT de prueba en `notifications` para el usuario dev no rompe (el trigger es fire-and-forget).
- [ ] **Step 4: Desplegar** `send-push-notification` (MCP `deploy_edge_function`) y redeploy de `send-notification-email` (con el rename PHSPORT).
- [ ] **Step 5 (MANUAL de Mario):** pegar `NEXT_PUBLIC_VAPID_PUBLIC_KEY` en Vercel (Production+Preview) y `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY`/`VAPID_SUBJECT` como secretos de la edge function en Supabase. Entregar valores exactos + dónde.
- [ ] **Step 6: Verificación E2E** (Chrome escritorio, localhost o preview): activar en Ajustes → conceder permiso → fila en `push_subscriptions` → asignar un diseño → llega la notificación del SO → clic abre el `link`. Apagar `push[assignment]` → no llega. Email dice PHSPORT.
- [ ] **Step 7:** avisar a Mario para revisión (sin merge a `main`).

---

## Self-Review

**Cobertura del spec:** ✅ push_subscriptions (T3) · edge function (T4) · SW handlers (T5) · cliente/hook (T6) · Ajustes columna+activación (T7) · in-app pulido (T8) · email PHSPORT (T9) · VAPID/config (T2,T10) · preferencias push (T1) · verificación (T10). Fuera de alcance (tip, Fase C, outbox push) correctamente omitido.

**Placeholders:** sin TBD/TODO; código real en cada step de código.

**Consistencia de tipos:** `NotificationChannel` con `push` (T1) usado en T7; `groupNotificationsByDay` firma coherente T8; payload de notificación coherente edge(T4)↔SW(T5) (`{title,body,url,tag}`); claves de preferencia snake_case coherentes T1/T3/T4.
