# Notificaciones Push + cimientos — Fase B

**Fecha:** 2026-07-11
**Rama:** `preview` (validación) → `main` (producción)
**Estado:** diseño aprobado por Mario. Alcance elegido: "Push + cimientos coherentes".

## Contexto

Tercer sub-proyecto del porteo a "app nativa" (tras A = PWA instalable, ya en
producción). La visión de Mario: avisos al móvil estilo WhatsApp + centro in-app,
manteniendo el email. Al explorar el terreno (Fase A) descubrimos que **la infra
de notificaciones ya existe y es sólida**:

- Tabla `notifications` + realtime + campana (`components/layout/notifications-dropdown.tsx`,
  `lib/hooks/use-notifications.ts`).
- Email vía edge function `send-notification-email` con **outbox** (reintentos
  1/5/15 min, idempotencia) — migraciones 009-020.
- **El email se dispara desde un trigger `AFTER INSERT on notifications`**
  (`notify_user_email`, migración 018): el punto único del que cuelga todo.
- Preferencias por evento×canal `Email | In-App` en `profiles.notification_preferences`
  (`lib/utils/notification-preferences.ts`); eventos: `assignment`, `statusChanges`
  (status_change), `upcomingDeadlines` (deadline).
- Apilado inteligente **en origen**: la creación en lote agrupa en una noti
  ("Se te han asignado N diseños") — migración 009 + `app/api/designs/bulk/route.ts`.

Auditoría de los cimientos (motivó el alcance ampliado):
- **Email**: motor sólido, pero **branding caducado** — dice "PH Sport" (asunto,
  cuerpo, pie, remitente) y usa el logo dorado. Hay que refrescar el nombre a PHSPORT.
- **Centro in-app**: MVP competente (no roto) pero no "grado app de referencia":
  le falta agrupación por día y filtro Todo/No leídas.

## Principio rector

El push **cuelga del mismo `AFTER INSERT on notifications`** que el email. Un
trigger nuevo dispara push en paralelo, cada canal respetando su preferencia. **No
se toca ningún punto de creación de notificaciones** — así push cubre asignaciones,
cambios de estado, deadlines y el futuro evento "listo para revisar" (Fase C) sin
tocar cada sitio.

## Decisiones tomadas

- **Push autohospedado con VAPID** (sin terceros tipo OneSignal/FCM), coherente con
  el resto del stack (Resend, Supabase). Funciona en iOS PWA (16.4+).
- **Dispatch fire-and-forget** (sin outbox): el push es best-effort; la fila in-app
  es el registro durable. Se puede añadir outbox después si hace falta.
- **Activación manual** desde Ajustes (permiso + suscripción son por-dispositivo).
- **Empujón contextual = enchufable, NO ahora**: el "mensajito que invita a activar"
  vivirá dentro del futuro sistema de tips/consejos ([[project_pending_help_system]]),
  con "No volver a mostrar". En esta fase solo montamos la activación manual y dejamos
  un punto de entrada reutilizable.
- **Rejilla de Ajustes**: se mantiene la estructura; se añade la 3ª columna "Push" y
  una sección "Activar en este dispositivo". Los 3 eventos actuales no cambian.
- **Cimientos**: refresco de nombre en el email (PH Sport → PHSPORT, logo se queda) +
  pulido del centro in-app (agrupar por día + filtro Todo/No leídas).

## Arquitectura y componentes

### 1. Modelo de datos — migración `040` (verificar estado vivo antes de aplicar)

- **Tabla `push_subscriptions`**: `id` uuid pk, `user_id` uuid fk `profiles(id)`
  on delete cascade, `endpoint` text unique, `p256dh` text, `auth` text,
  `user_agent` text, `created_at` timestamptz, `last_seen_at` timestamptz.
  Índice por `user_id`. RLS: el usuario gestiona (select/insert/delete) las suyas
  (`auth.uid() = user_id`); el service_role las lee todas (para la edge function).
- **Trigger `notify_user_push()`** (security definer) en `notifications` AFTER
  INSERT → `net.http_post` a `<project_url>/functions/v1/send-push-notification`
  con `row_to_json(NEW)` y `Authorization: Bearer <service_role_key>`. Reutiliza
  los secretos de vault ya existentes del email (`notify_email_project_url`,
  `notify_email_service_role_key`). Fire-and-forget; los errores no rompen el INSERT.
- Las preferencias `push` NO necesitan DDL: la columna `notification_preferences`
  es JSONB; los defaults se manejan en código (como email/in_app).

### 2. Edge function `send-push-notification` (Deno + `web-push`)

Espeja `send-notification-email`. Recibe el payload de la notificación:
1. Lee `profiles.notification_preferences.push[type]` — si está off, responde
   `{ skipped: true }` 200.
2. Busca las `push_subscriptions` del `user_id`.
3. Envía web push a cada una con `web-push` (VAPID) y payload JSON
   `{ title, body, url, tag }` derivado de la notificación (mismo `buildCopy` que
   el email, simplificado).
4. **Poda**: si una suscripción responde 404/410 (Gone), la borra.
5. Siempre 200 (best-effort).

Variables de entorno de la función: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`,
`VAPID_SUBJECT` (mailto:), `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.

**Riesgo técnico acotado:** verificar que `npm:web-push` corre en el runtime edge
de Supabase (Deno). Plan B si no: firmar el JWT VAPID a mano con `jose` +
cifrado del payload, o una implementación web-push nativa de Deno.

### 3. Service worker — ampliar `public/sw.js` (el de la Fase A)

Añadir (sin tocar la lógica de fetch/offline existente):
- `push` → `event.waitUntil(self.registration.showNotification(title, { body,
  data: { url }, icon: '/icons/icon-192.png', badge: '/icons/icon-192.png', tag }))`.
- `notificationclick` → `notification.close()` + enfocar un cliente abierto de la
  app (si lo hay) navegándolo al `url`, o abrir una ventana nueva en `url`.

### 4. Suscripción en cliente

- `lib/push/use-push-subscription.ts` (hook): expone `permission`, `isSubscribed`,
  `isSupported`, `canPromptOnThisDevice` (iOS gate), `subscribe()`, `unsubscribe()`.
  - `subscribe()`: `Notification.requestPermission()` (con gesto) →
    `registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })`
    → upsert en `push_subscriptions` vía cliente Supabase del navegador (RLS lo
    permite; sin API route).
  - `unsubscribe()`: `subscription.unsubscribe()` + borrar la fila.
- `lib/push/vapid.ts`: helper `urlBase64ToUint8Array` + lectura de
  `NEXT_PUBLIC_VAPID_PUBLIC_KEY`.
- **iOS gate**: si iOS y no standalone → `canPromptOnThisDevice = false`; la UI
  muestra "instala la app primero" en vez del toggle.

### 5. Ajustes — pestaña Notificaciones

- Nueva sección **"Activar en este dispositivo"** (arriba): usa `usePushSubscription`.
  Toggle/botón que activa o desactiva el push en ESTE dispositivo; estados: no
  soportado / iOS sin instalar / permiso denegado (con ayuda para reactivar) /
  activo.
- **3ª columna "Push"** en la rejilla de eventos. Cambios:
  - `lib/utils/notification-preferences.ts`: añadir canal `push` a los tipos,
    `DEFAULT_NOTIFICATION_PREFERENCES`, `dbToUi`, `uiToDb` (default true).
  - `components/features/account/notifications-tab.tsx`: rejilla de 3→4 columnas
    (Evento · Email · In-App · Push), con icono de móvil para Push.
  - `lib/hooks/use-user-preferences.ts`: ya guarda todo el objeto `preferences`; el
    canal push viaja solo al ampliar el tipo.

### 6. Pulido del centro in-app

- `lib/hooks/use-notifications.ts`: subir `limit` de 20 a 30; exponer helper de
  agrupación o dejar el group en el componente.
- `components/layout/notifications-dropdown.tsx`:
  - **Agrupación por día** con cabeceras "Hoy / Ayer / Antes" (via date-fns).
  - **Filtro Todo / No leídas** (toggle pequeño en la cabecera del dropdown).
  - Mantener todo lo actual (marcar leído, borrar, realtime, accesibilidad).

### 7. Refresco de marca del email

`supabase/functions/send-notification-email/index.tsx`: reemplazar "PH Sport" por
"PHSPORT" en asuntos, cabeceras, pie y el remitente (`from` label). El logo dorado
y el dominio `phsport.app` se quedan. Redesplegar la función.

### 8. Claves y configuración (pasos manuales de Mario)

Generar par VAPID (script `scripts/generate-vapid-keys.mjs` con `web-push`):
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` → Vercel (Production + Preview).
- `VAPID_PRIVATE_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_SUBJECT` → secretos de la edge
  function en Supabase.
Se le entregarán los valores exactos y dónde pegarlos.

## Flujo de datos (resumen)

1. Algo crea una fila en `notifications` (asignación, etc.) — sin cambios.
2. Trigger email (existente) → outbox → edge email. **En paralelo**, trigger push
   (nuevo) → edge push.
3. Edge push mira `preferences.push[type]`, envía a las suscripciones del usuario,
   poda las muertas.
4. El SW recibe el push y muestra la notificación del SO; el clic abre el `link`.

## Manejo de errores

- Trigger push fire-and-forget: cualquier fallo de `net.http_post` se ignora (no
  rompe el INSERT ni el email).
- Edge push siempre 200; suscripciones muertas se podan solas (404/410).
- Cliente: permiso denegado → mensaje claro con cómo reactivar; navegador sin
  soporte / iOS sin instalar → estados propios, nunca un toggle que no hace nada.

## Verificación

- `type-check`, `lint`, `next build`, tests (56/56 + nuevos si aplica).
- **Chrome escritorio** (localhost es contexto seguro para SW/push): activar en
  Ajustes → conceder permiso → asignar un diseño → llega la notificación del SO →
  clic abre el `link`. Apagar `push[assignment]` → no llega.
- Preferencia por canal respetada de forma independiente (email on / push off, etc.).
- **iOS**: sobre la PWA instalada en producción (requiere HTTPS + instalada).
- Suscripción muerta se poda (revocar permiso → siguiente envío la borra).
- Email: previsualizar que dice PHSPORT.

## Fuera de alcance (explícito)

- El empujón contextual / tip de activación (irá con el sistema de tips, futuro).
- Evento "listo para revisar" (Fase C).
- Outbox/reintentos para push (fire-and-forget de momento).
- Página completa "Ver todas las notificaciones" (el dropdown basta por ahora).
- Rediseño del email más allá del nombre.

## Archivos

**Nuevos:**
- `supabase/migrations/040_push_subscriptions_and_trigger.sql`
- `supabase/functions/send-push-notification/index.ts` (+ `deno.json`)
- `lib/push/use-push-subscription.ts`, `lib/push/vapid.ts`
- `scripts/generate-vapid-keys.mjs`
- Componente(s) de la sección "Activar en este dispositivo" (en la pestaña de
  notificaciones de Ajustes).

**Editados:**
- `public/sw.js` (handlers push + notificationclick)
- `lib/utils/notification-preferences.ts` (canal push)
- `components/features/account/notifications-tab.tsx` (columna Push + sección activar)
- `lib/hooks/use-notifications.ts` + `components/layout/notifications-dropdown.tsx`
  (agrupación por día + filtro)
- `supabase/functions/send-notification-email/index.tsx` (PH Sport → PHSPORT)
