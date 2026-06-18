# Caching inteligente — Diseño (2026-06-18)

## Contexto y síntoma

La app va lenta al volver a entrar (recarga / nueva pestaña / tras un rato) y "se
arregla" tras navegar. Causa raíz: **no hay caché de datos entre sesiones**. El
único caché es el de SWR, **solo en RAM**, que se vacía en cada recarga, así que
el cold start refetchea todo. Además el arranque está bloqueado por un spinner de
auth (2 queries en serie: `getUser()` → `profiles.select('*')`) hecho 100% en
cliente, aun teniendo toda la infra `@supabase/ssr` (server client + middleware).

## Alcance acordado

1. **Arranque instantáneo de datos** (instant-on).
2. **Quitar el spinner de auth.**
3. **Reducir llamadas a Supabase.**

Fuera de alcance ahora: **PWA + porte a móvil** (idea a futuro, anotada).

Frescura: **stale-while-revalidate persistido en todas las pantallas** (ver datos
de la última sesión al instante y refrescar por detrás ~1s). La navegación NO
cambia (siempre Inicio salvo URL en marcadores).

## Enfoque elegido: "Server-first auth + persistencia de datos en cliente", en 2 fases

### Fase 1 — Persistir el caché de SWR (instant-on) ✅ implementada (working tree, sin commitear)

- **`lib/swr/persistent-cache.ts`** (nuevo): `localStorageProvider()` (hidratación
  SÍNCRONA desde localStorage), `clearSwrCache()`, `setSwrCacheOwner()`.
  - Aislamiento por usuario: caché namespaceada por id del último usuario
    (`phsport-swr:{version}:{ownerId}`). Solo hidrata si existe el marcador
    `phsport-swr-owner` **y** hay cookie `-auth-token` presente. Logout/caducidad
    → cookie ausente → no hidrata → imposible ver datos de otro usuario.
  - Versionado (`CACHE_VERSION`) + TTL (24h). Modo de fallo seguro: cualquier
    error / localStorage no disponible → Map en memoria (comportamiento actual).
  - Persiste en `beforeunload` y en `visibilitychange→hidden` (fiabilidad móvil).
- **`components/providers/swr-provider.tsx`**: añade `provider: localStorageProvider`
  y `keepPreviousData: true` (evita parpadeo al navegar entre semanas).
- **`lib/auth/auth-context.tsx`**: `setSwrCacheOwner(user.id)` al autenticar;
  `clearSwrCache()` en logout.

Sin hydration mismatch: `AppLayout` ya bloquea con spinner hasta `AUTHENTICATED`,
así que los dashboards montan tras la hidratación y leen el caché en cliente.

Efecto: cold start pasa de `[auth → skeleton de datos → datos]` a `[auth → datos]`.
(El spinner de auth sigue ahí en Fase 1; lo elimina la Fase 2.)

### Fase 2 — Auth en servidor ✅ implementada y validada

- **`lib/auth/get-server-auth.ts`** (nuevo): `getServerAuth()` resuelve
  `user` + `profile` en el servidor con el server client SSR existente. Fallo
  seguro → `{ null, null }` (cae al flujo cliente previo).
- **`app/layout.tsx`**: root layout pasa a `async`, llama a `getServerAuth()` y
  pasa `initialUser`/`initialProfile` al `AuthProvider`.
- **`lib/auth/auth-context.tsx`**: `AuthProvider` acepta el estado inicial del
  servidor; si viene sesión+perfil, arranca `AUTHENTICATED` y NO repite el
  `getUser()`+profile bloqueante en cliente (solo marca el dueño de la caché y
  monta el listener). Logout/invitación/refresh sin cambios.
- Efecto: el HTML llega ya autenticado (sin spinner) y el cliente hace **0
  llamadas `getUser`** en arranque en frío.

**Mitigación de hydration mismatch (clave):** al pasar a SSR autenticado, el
servidor renderiza el dashboard con la caché SWR vacía (skeleton) mientras el
cliente hidrata con la caché llena (datos) → mismatch. Solución:

- **`lib/hooks/use-hydrated.ts`** (nuevo): `useHydrated()` (false en SSR y en el
  primer render de cliente, true tras montar; flip en layout effect isomórfico,
  sin parpadeo).
- **`components/layout/app-layout.tsx`**: el shell autenticado (sidebar/header)
  se renderiza en SSR, pero el contenido de datos (`children`) se difiere a la
  hidratación (`{hydrated ? children : null}`). Así el primer render de cliente
  coincide con el servidor y luego aparecen los datos cacheados.

## Validación (manual, DevTools) — TODO ✅ verificado con Playwright

Fase 1:
- Persistencia entre recargas (2 entradas reales guardadas).
- Instant-on probado con `/api/designs` bloqueado → datos sin skeleton.
- Logout borra todo `phsport-swr*` (preserva theme/accent).

Fase 2:
- SSR renderiza el shell autenticado sin spinner (`contieneSpinnerAuth: false`).
- Cliente: 0 llamadas `getUser` en arranque.
- 0 errores de hidratación tras el gate `useHydrated`.
- Instant-on intacto; cold start ~1s más rápido en dev.
- Regresión: logout limpia caché+cookie; ruta protegida sin sesión redirige a
  `/login` sin filtrar el shell.
