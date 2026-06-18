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

### Fase 2 — Auth en servidor (pendiente)

- Resolver `user` + `profile` en el servidor (layout, con el server client SSR
  existente) y pasarlos al `AuthProvider` como estado inicial → arranca ya
  `AUTHENTICATED` sin spinner ni optimismo, con datos verificados.
- Elimina el `getUser()`/`profile` duplicado del cliente → menos llamadas.
- Con `initialUser` disponible de forma síncrona, el aislamiento de caché queda
  blindado (sin depender del gate por cookie de la Fase 1).
- Validar con cuidado: login, logout, invitación, refresh de token, cambio de rol.

## Validación (manual, DevTools)

- Recargar Inicio → datos al instante sin skeleton; en Network se ve la
  revalidación de fondo.
- Throttle de red → se aprecia instant-on vs refresco.
- Logout → caché borrada; login con otro usuario en el mismo navegador → sin fuga.
- Sin errores de hidratación en consola.
