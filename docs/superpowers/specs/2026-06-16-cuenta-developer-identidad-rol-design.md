# Cuenta developer + identidad de rol — Diseño

**Fecha:** 2026-06-16
**Estado:** Aprobado en brainstorming, pendiente de plan de implementación.
**Contexto:** Fase 8 (porteo concepto D). Sigue al "pulido visual lote 1" (commit `8d7eb12`).

## Resumen

Tres bloques cohesionados, todos en el territorio de **rol/identidad/miembros**:

1. **Cuenta developer** — un conmutador que permite a la cuenta dev ver la app
   como **Mánager** o como **Diseñador** (impersonando a un diseñador concreto,
   con sus datos reales), sin cambiar de usuario. Solo cliente, **sin tocar
   permisos ni backend**.
2. **Identidad de rol** — renombrar la etiqueta "Admin"/"Administrador" a
   **"Mánager"**, dar **color por rol** (Mánager = amarillo/dorado, Diseñador =
   azul) y mostrar una **píldora de rol persistente** para todos los usuarios.
3. **Limpieza de Miembros/invitaciones** — quitar la lista "Invitaciones
   pendientes", caducar invitaciones en **24h**, y mover el "desde cuándo" del
   usuario al popup como **"Se unió el DD/MM/YYYY"**.

## Decisiones tomadas (con su porqué)

- **Enfoque del conmutador: preview visual (solo cliente).** El conmutador
  cambia la *experiencia visible* (sidebar, redirects, dashboards, menús), pero
  la cuenta dev sigue siendo **ADMIN de verdad** por debajo. *Por qué:* el
  gating real está en dos capas — cliente (fácil de conmutar) y **servidor
  (APIs + RLS, que leen el rol fresco de la BD en cada request y no se pueden
  engañar desde el cliente)**. Una simulación "fiel de permisos" exigiría tocar
  backend/RLS, justo lo que acabamos de auditar y endurecer. Para "ver cómo se
  ve cada experiencia" el preview visual es suficiente y mantiene el backend
  intacto.
- **Modo Diseñador = impersonar un diseñador concreto** (no la cuenta dev
  vacía). *Por qué:* las vistas de diseñador (`/mi-semana`, dashboard de Inicio
  del diseñador) muestran "mi semana / mis diseños" según `user.id`; la cuenta
  dev no tiene trabajo asignado, así que saldrían vacías. Elegir un diseñador
  real da un preview con datos reales.
- **Gate de dev = constante con un email.** Solo la usará el owner
  (`mariorodpz@gmail.com`). Una constante en `lib/auth/dev-accounts.ts` evita
  migración y variables de entorno. Si en el futuro hay más devs, pasa a lista.
- **Renombrado solo de etiqueta visible.** El enum interno `ADMIN`/`DESIGNER`
  **no se toca** (tocar el enum implicaría migración + RLS + APIs). Solo cambian
  los textos de cara al usuario. La forma elegida es **"Mánager"** (con tilde),
  para coincidir con lo que ya usa el resto de la app.
- **Píldora de rol persistente para todos.** No solo para el dev: cualquier
  usuario ve siempre su rol (con su color). Para el dev, esa misma píldora hace
  de indicador "estás viendo como…" cuando simula. Una pieza, doble función.

## Alcance

### 1. Cuenta developer (conmutador "Ver como")

**Gate de identidad**
- Nuevo `lib/auth/dev-accounts.ts`: `DEV_EMAILS = ['mariorodpz@gmail.com']` +
  helper `isDevAccount(email)`. Se lee en cliente solo para decidir si se
  muestra el conmutador. No tiene implicación de seguridad (el switch es
  cosmético; el backend sigue exigiendo ADMIN real).
- **Setup manual (lo hace el usuario):** crear la cuenta `mariorodpz@gmail.com`
  **como Mánager/ADMIN**. Debe ser ADMIN para que, con el enfoque visual, los
  permisos reales funcionen en ambas vistas. Mientras no exista esa cuenta, el
  conmutador simplemente no aparece.

**Motor "Ver como" (`ViewAsProvider`)**
- Nuevo contexto (p. ej. `lib/auth/view-as-context.tsx`) montado dentro del
  `AuthProvider`, en el layout del dashboard.
- Estado: `{ mode: 'real' | 'designer', designerId: string | null }`,
  persistido en `localStorage` (clave `phsport:view-as`). Por defecto `real`.
- Solo está activo si la cuenta real es dev (`isDevAccount`) **y** su rol real
  es ADMIN. En cualquier otro caso el modo es siempre `real`.
- **Identidad efectiva:** cuando `mode === 'designer'`, la identidad que ve la
  UI se sustituye por la del diseñador elegido: `effectiveProfile` = perfil del
  diseñador (id, nombre, avatar, `role: 'DESIGNER'`) y `effectiveUserId` = id
  del diseñador. El perfil del diseñador se obtiene de la lista de diseñadores
  ya disponible (`useDesigners`/`useUsersData`).

**Punto de intercepción (decisión explícita)**
- `useAuth()` devuelve la **identidad efectiva** (perfil/usuario), de modo que
  **todo el gating actual funciona sin reescribir consumidores**: redirects
  (`/equipo` ↔ `/mi-semana`), `buildNavItems` de la sidebar, `AdminDashboard`
  vs `DesignerDashboard` en `/inicio`, y todos los `profile?.role === 'ADMIN'` /
  `isAdmin`.
- La **identidad real** (para el propio conmutador, el logout y la píldora) se
  expone aparte vía `useViewAs()` (real profile/email + controles + estado de
  simulación). El `user-menu`/header consumen la identidad real para esto.
- Consumidores que deben usar identidad **efectiva** (se verifican en el plan):
  `/mi-semana` y `DesignerDashboard` leen `user.id` para filtrar "sus" diseños
  → con la identidad efectiva mostrarán los del diseñador impersonado. **A
  verificar:** que ese filtrado sea client-side sobre `effectiveUserId`; si
  alguna consulta filtra por el usuario de sesión en servidor, habrá que pasarle
  el id efectivo explícitamente.

**UI del conmutador**
- En el **menú de cuenta** (`user-menu.tsx`): sección "Ver como" con
  Mánager / Diseñador. Al elegir Diseñador, un desplegable para escoger qué
  diseñador. "Volver a Mánager" sale del modo simulación.
- Visible **solo** para cuentas dev.

### 2. Identidad de rol

**Renombrado (solo etiqueta)**
- `components/features/users/invitations-card.tsx:15` `ADMIN: 'Admin'` →
  `'Mánager'`.
- `components/invitations/create-invitation-dialog.tsx:175` `'Administrador'` →
  `'Mánager'`.
- (El resto de la app ya muestra "Mánager".)

**Colores de rol**
- Nuevo token dedicado `--role-designer` (**azul**, derivado del azul de
  `--status-info`), definido en `globals.css` para light y dark — independiente
  de la semántica de estado. El rol Mánager mantiene el **dorado** (`--primary`).
- Se aplica donde hoy todo va en dorado/gris según rol: píldora de rol
  persistente, avatares e iconos de diseñador (tarjetas y popup de Miembros,
  avatar de diseñador en la tabla de Diseños, dashboards), pills de rol en
  Miembros, y el indicador del conmutador. Patrón: Mánager → tono dorado,
  Diseñador → tono azul (sustituye el `bg-muted`/gris actual del no-admin).

**Píldora de rol persistente (todos los usuarios)**
- Píldora siempre visible en el **header** (junto al avatar), con el rol actual
  y su color. Informativa para usuarios normales.
- Para el dev en modo simulación, la píldora muestra el rol simulado + el
  diseñador (p. ej. `Viendo como Diseñador · Lluís`, en azul) y permite volver a
  Mánager. Sigue mostrándose también el rol en el menú de cuenta, como ahora.

### 3. Limpieza de Miembros / invitaciones

- **Quitar "Invitaciones pendientes":** eliminar el `InvitationsCard` de
  `members-panel.tsx:194-196` y el componente
  `components/features/users/invitations-card.tsx`. El **invitar** (botón +
  `CreateInvitationDialog`) **se mantiene**. *Consecuencia aceptada:* tras
  generar un link ya no hay lista para re-copiarlo/borrarlo; el flujo queda
  "genero → envío → listo". Las filas de invitación dejan de listarse en la UI
  (siguen validándose en `/invite/[token]`); su caducidad corta (24h) evita que
  se acumulen "flotando".
- **Caducidad 24h:** en `create-invitation-dialog.tsx`, cambiar el cálculo de
  `expires_at` de +7 días (`:62-63`) a **+24 horas**, y el texto de la
  descripción (`:139`) "expira en 7 días" → "expira en 24 horas".
- **"Desde hace X meses" fuera de la tarjeta:** quitar la línea `Desde
  {formatDistanceToNow(created_at)}` de la tarjeta de miembro
  (`members-panel.tsx:170`).
- **"Se unió el DD/MM/YYYY" en el popup:** en el popup de miembro
  (`members-panel.tsx:264`), sustituir el `formatDistanceToNow` por la fecha de
  alta formateada como `Se unió el DD/MM/YYYY` (usando `created_at` que ya da
  Supabase). El "desde cuándo" deja de estar a simple vista y solo aparece al
  abrir el usuario.

## Arquitectura / componentes nuevos y tocados

**Nuevos**
- `lib/auth/dev-accounts.ts` — allowlist de emails dev + `isDevAccount()`.
- `lib/auth/view-as-context.tsx` — `ViewAsProvider` + `useViewAs()` (estado de
  simulación, identidad real vs efectiva, controles, persistencia).
- Componente de **píldora de rol** (header) y la **sección "Ver como"** del menú
  de cuenta (pueden vivir en `components/layout/`).

**Tocados**
- `lib/auth/auth-context.tsx` — el `ViewAsProvider` envuelve y re-provee el
  valor del contexto de auth con la identidad efectiva, de modo que `useAuth()`
  devuelve perfil/usuario efectivos cuando hay simulación (un único punto de
  intercepción).
- `components/layout/user-menu.tsx` y `header.tsx` — identidad real para el
  conmutador/píldora; renderizar la píldora y la sección "Ver como".
- `app/globals.css` — token de color rol Diseñador (azul).
- `components/features/account/members-panel.tsx` — quitar `InvitationsCard`,
  quitar "Desde…" de la tarjeta, "Se unió el…" en el popup, colores de rol.
- `components/invitations/create-invitation-dialog.tsx` — 24h, texto, "Mánager".
- `components/features/users/invitations-card.tsx` — **eliminar**.
- Aplicación de colores de rol en avatares de diseñador donde corresponda
  (tabla de Diseños, dashboards).

## Fuera de alcance (YAGNI)

- **Simulación fiel de permisos** (que el modo Diseñador respete restricciones a
  nivel de API/RLS). Explícitamente descartado: requeriría tocar backend.
- **Renombrar el enum de rol** en BD/código. Solo etiqueta visible.
- **Columna `is_dev`** en `profiles`. Se usa constante de email.
- **Conmutador para usuarios no-dev.**
- Desplegar `admin-delete-user`, cuenta dev como dato real, push a origin
  (siguen como pendientes aparte del roadmap).

## Criterios de aceptación

1. Con la cuenta dev (email en `DEV_EMAILS`, rol ADMIN), aparece "Ver como" en
   el menú de cuenta. Para cualquier otra cuenta, no aparece nada nuevo más allá
   de la píldora de rol.
2. "Ver como → Diseñador → [X]" hace que sidebar, `/inicio`, `/mi-semana` y los
   gating de UI se comporten como diseñador, mostrando los datos de X. La
   píldora del header indica el modo simulado en azul con opción de volver.
3. "Volver a Mánager" restaura la vista real. El estado sobrevive a recargas
   (localStorage).
4. Ningún cambio en permisos reales: el backend sigue tratando a la cuenta dev
   como ADMIN; no se relaja ninguna RLS ni endpoint.
5. La etiqueta "Admin"/"Administrador" ya no aparece en ningún sitio de cara al
   usuario; en su lugar, "Mánager".
6. Mánager se ve en dorado y Diseñador en azul de forma consistente (píldoras,
   avatares, indicadores).
7. En Miembros ya no existe la lista "Invitaciones pendientes"; sigue pudiendo
   invitarse. Las invitaciones nuevas caducan a las 24h (texto y `expires_at`).
8. La tarjeta de miembro no muestra "Desde hace X"; al abrir el usuario, se ve
   "Se unió el DD/MM/YYYY".
9. `type-check` + `lint` + `build` en verde.
