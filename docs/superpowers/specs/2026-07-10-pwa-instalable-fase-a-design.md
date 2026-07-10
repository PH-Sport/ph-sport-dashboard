# PWA instalable — Fase A (porteo a app instalable)

**Fecha:** 2026-07-10
**Rama:** `preview`
**Estado:** diseño aprobado por Mario, ejecución autónoma delegada.

## Contexto

El porteo a móvil ya está hecho (tab bar iOS26, taller fullscreen, tarjetas
comprimidas) y consolidado en `preview`. El `viewport` de `app/layout.tsx` ya
declara `viewport-fit=cover`, `themeColor` claro/oscuro y compensa safe-areas —
la base del porteo PWA ya estaba puesta.

Al explorar el terreno descubrimos que **la infraestructura de notificaciones ya
existe** y no forma parte de esta fase:

- Centro in-app completo: tabla `notifications` + realtime + campana
  (`components/layout/notifications-dropdown.tsx`, `lib/hooks/use-notifications.ts`).
- Email operativo (`supabase/functions/send-notification-email`).
- Preferencias por evento y canal en Ajustes: rejilla `Email | In-App` × 3 eventos
  (`assignment`, `statusChanges`, `upcomingDeadlines`), guardadas en
  `profiles.notification_preferences`.

El objetivo del usuario (PWA instalada que se siente nativa + push estilo WhatsApp
+ centro in-app, manteniendo email) se descompuso en **3 sub-proyectos
independientes**, cada uno con su propio spec:

- **A — PWA instalable** (este documento).
- **B — Canal Push** (web push: SW con handlers push + VAPID + `push_subscriptions`
  + 3ª columna "Push" en Ajustes + envío desde los puntos que ya crean notis).
  Depende de A (en iOS el push solo funciona con la app instalada).
- **C — Evento "listo para revisar"** (nuevo estado/flujo al entregar un diseño →
  avisa a quien revisa; un 4º tipo de evento nuevo). Independiente.

Se decidió (Mario) hacer **A primero, solo**.

## Objetivo de la Fase A

Convertir la app en una **PWA instalable** que se sienta nativa: instalable en
Chrome/Android/escritorio y en iOS (vía "Añadir a inicio"), con arranque en modo
standalone, iconos de marca y una pantalla offline de cortesía. Sin tocar backend
ni notificaciones. Deja el service worker preparado para que la Fase B le añada
los handlers de push.

## Decisiones tomadas

- **Offline:** service worker **mínimo propio** (sin librerías tipo next-pwa/
  serwist). Garantiza instalabilidad, cachea shell/estáticos y sirve una página
  offline con marca. NO se intenta offline real con datos (frágil con RSC +
  Supabase realtime, y SWR ya da contenido reciente cacheado).
- **UX de instalación:** banner contextual descartable en Chrome (vía
  `beforeinstallprompt`) + cartelito con el gesto en iOS Safari. Nada si ya está
  instalada.
- **Nombre de marca:** cambia de "PH Sport" a **PHSPORT** (una palabra). Aplica a
  las superficies que toca esta fase (manifest, `appleWebApp`, `<title>`). El
  rebautizado global del resto de la app queda fuera de alcance.
- **Icono:** **logo blanco sobre fondo negro (#000000)**. Se regeneran los iconos
  PWA y el `apple-touch-icon` (antes era el logo dorado sobre blanco). El favicon
  de pestaña (SVG dorado) se deja como está — fuera de alcance.

## Arquitectura y componentes

### 1. Manifest — `app/manifest.ts` (API nativa de Next 15)

```
name: 'PHSPORT Dashboard'
short_name: 'PHSPORT'
description: 'Plataforma de gestión para el equipo de diseño de PHSPORT'
start_url: '/inicio'
scope: '/'
display: 'standalone'
orientation: 'any'
background_color: '#121317'   // charcoal: superficie real de la app (anti-flash)
theme_color: '#121317'
lang: 'es'
categories: ['productivity']
icons: [icon-192, icon-512, maskable-192, maskable-512]
```

Nota: `background_color`/`theme_color` = charcoal `#121317` (superficie real de la
app, minimiza el flash splash→app). El **icono** sí va sobre negro puro `#000000`
por petición explícita; la diferencia es imperceptible (los iconos se ven contra
el fondo del launcher, no contra el splash).

### 2. Iconos — generados desde `logo-ph-sport.svg`

Script `scripts/generate-pwa-icons.mjs` (usando `sharp`, ya presente vía Next).
Recolorea las polilíneas del logo a blanco sobre un `<rect>` negro y rasteriza:

- `public/icons/icon-192.png` (logo ~66% del ancho, `purpose: any`)
- `public/icons/icon-512.png` (idem)
- `public/icons/icon-maskable-192.png` (logo ~52%, fondo a sangre, `purpose: maskable`)
- `public/icons/icon-maskable-512.png` (idem)
- `public/images/apple-touch-icon.png` (180×180, logo ~60%, sobrescribe el dorado)

El script queda en el repo por si hay que regenerar (cambio de logo/color).

### 3. Service worker — `public/sw.js` (mínimo, propio)

- **Registro:** client component `components/pwa/service-worker-register.tsx`
  montado en `layout.tsx`; llama `navigator.serviceWorker.register('/sw.js')` tras
  `load`. No-op en SSR y si el navegador no lo soporta.
- **Estrategia (conservadora, evita HTML rancio):**
  - Navegación (documentos) → **network-first**; sin red → `/offline`.
  - Estáticos inmutables (`/_next/static/…`, fuentes, `/icons/…`) → **cache-first**.
  - Resto (APIs, Supabase, RSC de datos) → **passthrough** a red; nunca se cachea.
- **Versionado:** `const CACHE = 'phsport-v1'`; en `activate` purga versiones viejas
  y hace `clients.claim()`. En `install`, `skipWaiting()` + precache de `/offline`
  y los iconos.
- Este fichero es el que la **Fase B** ampliará con `push` y `notificationclick`.

### 4. Página offline — `app/offline/page.tsx`

Server component estático (sin datos): logo, "Sin conexión", copy breve y botón
*Reintentar* (`window.location.reload()` en un pequeño client component). Se
precachea en el `install` del SW. Ruta pública (no requiere auth).

### 5. UX de instalación — `components/pwa/install-prompt.tsx` (client)

- **Chrome/Android/escritorio:** escucha `beforeinstallprompt`, hace
  `preventDefault()`, guarda el evento y muestra un banner discreto "Instalar
  PHSPORT". Al pulsar → `prompt()` nativo. Descartable; el descarte se recuerda en
  `localStorage` (no reaparece).
- **iOS Safari (no instalado):** detecta iOS + `!navigator.standalone` +
  `!matchMedia('(display-mode: standalone)')`; muestra cartelito con el gesto
  ("Toca Compartir → Añadir a inicio"). Descartable.
- **Ya instalada:** no muestra nada (`display-mode: standalone`).
- Montado una vez en `layout.tsx`. Estilo coherente con el design system (charcoal,
  tokens existentes, safe-areas).

### 6. Metadata iOS — `app/layout.tsx`

- `metadata.appleWebApp = { capable: true, title: 'PHSPORT', statusBarStyle: 'default' }`.
- `metadata.title` → `'PHSPORT Dashboard'`; `description` → PHSPORT.
- `apple-touch-icon` bump de versión (`?v=4`) por el nuevo arte.
- Montaje de `<ServiceWorkerRegister/>` y `<InstallPrompt/>`.
- `viewport` (safe-areas, themeColor) ya está listo — no se toca.

## Flujo de datos

Ninguno nuevo. La Fase A es estática/cliente: manifest servido por Next, SW
registrado en el cliente, iconos estáticos. No hay cambios de esquema, API ni
edge functions. El SW deja pasar todas las peticiones de datos a la red tal cual.

## Manejo de errores

- Registro de SW envuelto en try/catch con `logger`; un fallo no rompe la app
  (degrada a web normal, sin instalación).
- `beforeinstallprompt` puede no dispararse (ya instalada, navegador sin soporte,
  criterios no cumplidos): el banner simplemente no aparece.
- iOS nunca dispara `beforeinstallprompt`: por eso el camino iOS es independiente
  (hint por detección de plataforma), no depende de ese evento.

## Verificación

- `next build && next start` (nunca dev, por la nota de rendimiento del proyecto).
- Lighthouse categoría PWA / "Installable" → verde (manifest válido + iconos
  192/512 + SW registrado + servido en HTTPS).
- Manual: instalar en Chrome escritorio; en móvil Chrome Android (banner) y Safari
  iOS (hint + "Añadir a inicio"). Comprobar arranque standalone y el icono de marca.
- Modo avión / offline → aparece `/offline`.
- `next build` pasa sin errores de tipos/lint; suite de tests existente sigue en verde.

## Fuera de alcance (explícito)

- Web push / notificaciones (Fase B).
- Evento "listo para revisar" (Fase C).
- Offline real con datos.
- Rebautizado global "PH Sport" → "PHSPORT" fuera de las superficies PWA.
- Cambiar el favicon de pestaña (SVG dorado).

## Archivos

**Nuevos:**
- `app/manifest.ts`
- `public/sw.js`
- `app/offline/page.tsx`
- `components/pwa/service-worker-register.tsx`
- `components/pwa/install-prompt.tsx`
- `scripts/generate-pwa-icons.mjs`
- `public/icons/icon-192.png`, `icon-512.png`, `icon-maskable-192.png`, `icon-maskable-512.png`

**Editados:**
- `app/layout.tsx` (appleWebApp, title/description PHSPORT, montaje de SW + prompt)
- `public/images/apple-touch-icon.png` (regenerado white-on-black)
