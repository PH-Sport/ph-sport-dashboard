# Refactor Plan — PH Sport Dashboard

> Plan de ejecución por fases del refactor estructural + lavado de cara UX/UI.
> **Si retomas la conversación tras `/compact` o sesión nueva, lee este fichero PRIMERO**.
> **Hallazgos completos**: ver [`audit-estructural.md`](./audit-estructural.md).
> Última actualización: 2026-04-29.

---

## Contexto

PH Sport Dashboard — herramienta interna (8 personas) para gestión de diseños deportivos.
Stack: Next.js 15, React 19, TypeScript, Tailwind, Shadcn UI, Geist + JetBrains Mono, Supabase.
Identidad: charcoal authority + dorado Champions, con dark/light mode.

### Origen del refactor

El user pidió un "lavado de cara" estético. Audit reveló que **el problema raíz es arquitectónico, no de criterio**: tokens "isla", componentes monolíticos, agujeros de seguridad en API, lógica duplicada. Cada cambio estético rompe otras cosas. **Cimientos primero, estética después**.

### Estilo de trabajo del usuario (regla de oro)

- **Despacito y con buena letra** — paso por paso, validación entre fases.
- **Exhaustividad sobre velocidad** — auditar antes de maquillar.
- Confía en decisiones técnicas si están justificadas.
- Quiere entender el **porqué** del orden antes de ejecutar.

---

## Decisiones arquitectónicas tomadas

| Decisión | Razón | Fecha |
|---|---|---|
| Tipografía: **Geist Sans + JetBrains Mono** | dotted zero, italic real, latín completo, OFL | 2026-04-28 |
| Sidebar: **migrar a shadcn `Sidebar`** | actual custom monolítico con tokens isla, fijo+ml, sin variants. shadcn aporta SidebarProvider/Inset, mobile drawer integrado, keyboard shortcut, variants | 2026-04-29 |
| Validación API: **zod** | sin validación actual, mass update vulnerability detectada | 2026-04-29 |
| Rutas en español | producto interno solo es-ES; rutas claras para users | 2026-04-28 |
| Eliminar `/communications` + comentarios | no se usaban | 2026-04-28 |
| Eliminar paleta `gold-*` Tailwind, unificar en `--primary` | doble sistema de paleta | 2026-04-29 |
| Exponer `--status-*` en Tailwind config | bracket syntax repetido 30 veces | 2026-04-29 |

---

## Plan de fases

> El orden está diseñado por **dependencias**: cada fase deja el terreno listo para la siguiente. **No saltarlas**.

### Fase 0 — Cimientos del design system ✅ HECHO (2026-04-29)

- [x] Eliminar paleta `gold-*` del `tailwind.config.ts`
- [x] Migrar usos de `bg-gold-*`/`text-gold-*` a `bg-primary/N`, `text-primary` (auth layout gradient + design-detail-sheet hovers)
- [x] Exponer `status-*` en Tailwind config (`status.success`, `status.warning`, `status.error`, `status.info`)
- [x] Migrar 30 ocurrencias de `bg-[hsl(var(--status-*))]` a `bg-status-X`/`text-status-X` en 13 archivos
- [x] Declarar `--font-mono` en `:root` con fallback (renombrada var de next/font a `--font-mono-base` para evitar recursión)
- [x] Tintar `--card` light hacia warm (`36 30% 99%` en lugar de blanco puro), `--popover` igual
- [x] Actualizar comentario header de `globals.css`
- [x] Verificar contraste `--primary`/`--primary-foreground` light: **7.67:1 (pasa WCAG AAA)**
- [x] Type-check + lint limpios

---

### Fase 0.5 — Seguridad API ✅ HECHO (2026-04-29)

- [x] `npm install zod`
- [x] `lib/api/schemas.ts` con schemas: `weekFiltersSchema`, `bulkCreateDesignsSchema`, `updateDesignSchema` (whitelist `.strict()`), `updateStatusSchema`, `updateAssigneeSchema`
- [x] `lib/api/errors.ts` con helpers `validationErrorResponse`, `internalErrorResponse`, `unauthorizedResponse`, `forbiddenResponse`, `notFoundResponse`. En prod oculta detalles, en dev los expone.
- [x] Reescritos 5 routes: `route.ts`, `[id]/route.ts`, `[id]/status/route.ts`, `[id]/assignee/route.ts`, `bulk/route.ts`
- [x] Whitelist explícita en PUT `[id]/route.ts` — eliminado spread `{ ...body }`. Loop sobre campos parseados.
- [x] `[id]/assignee/route.ts` valida que el destino tenga rol DESIGNER (cuando designer_id es UUID).
- [x] Eliminado branch deprecated `status` de PUT genérico (ahora solo `/status` lo maneja).
- [x] `auth-context.tsx` logout: borra solo claves `sb-*` de localStorage + sessionStorage.
- [x] Type-check + lint limpios.

---

### Fase 0.5b — Algoritmo asignación unificado ✅ HECHO (2026-04-29)

- [x] `lib/services/designs/select-designer.ts` con `selectDesignerByLoad(designerIds, loads, startIndex?)` puro, devuelve `{ id, nextIndex }`.
- [x] `lib/services/designs/assignment.ts` (`assignDesignerAutomatically`) ahora delega en la función pura.
- [x] `app/api/designs/bulk/route.ts` usa `selectDesignerByLoad` con cursor in-line — código más corto y sin lógica duplicada.
- [x] `app/api/designs/assign/route.ts`: 1 fetch de cargas + distribución in-memory + **batch update por diseñador** (en vez de N round-trips secuenciales). Para 30 unassigned con 5 designers pasa de 30 round-trips a 5.
- [x] Type-check + lint limpios.

---

### Fase 1 — Sidebar a shadcn ✅ HECHO (2026-04-29)

- [x] Instalado `@radix-ui/react-tooltip` (dep nueva).
- [x] Creadas primitivas: `lib/hooks/use-mobile.ts`, `components/ui/tooltip.tsx`, `components/ui/sidebar.tsx` (~470L con `SidebarProvider`, `Sidebar`, `SidebarHeader/Content/Footer/Group/Menu/MenuItem/MenuButton/Inset`, `useSidebar`, `SidebarTrigger`, `SidebarRail`).
- [x] Tokens migrados a naming shadcn estándar: `--sidebar-background`, `--sidebar-foreground`, `--sidebar-primary` (active), `--sidebar-primary-foreground`, `--sidebar-accent` (hover), `--sidebar-accent-foreground`, `--sidebar-border`, `--sidebar-ring`.
- [x] Tailwind config con estructura `sidebar.{primary,accent}.foreground`.
- [x] Reescrito `components/layout/sidebar.tsx` como `<AppSidebar>` componiendo primitivas (50L vs 127L original).
- [x] Reescrito `components/layout/app-layout.tsx` con `<SidebarProvider>` + `<SidebarInset>`. Eliminada lógica `fixed`+`ml-64`/`ml-20` manual.
- [x] Eliminado render duplicado mobile — shadcn lo gestiona internamente con Sheet drawer.
- [x] Cada NavItem permite `matcher` custom (default = exact + startsWith), elimina hardcode `/inicio`.
- [x] Sidebar collapsible="icon" (mantiene icons en collapsed, no offcanvas).
- [x] Keyboard shortcut Cmd/Ctrl+B integrado vía `SidebarProvider`.
- [x] `SidebarLogo` adaptado a `useSidebar()` en lugar de props.
- [x] `sidebar-skeleton.tsx` actualizado a token nuevo (`bg-sidebar-accent`).
- [x] Type-check + lint limpios. Pages /inicio y /login devuelven 200 OK.

---

### Fase 2 — Tokens hardcoded en feature components ✅ HECHO (2026-04-30)

- [x] `components/ui/table.tsx` — `text-gray-*` → `text-muted-foreground`/`text-foreground`, `border-gray-*` → `border-border`, hover/selected → `bg-muted`
- [x] `components/features/designs/design-detail-sheet.tsx` — todos los `text-gray-500/900/100`, `dark:text-gray-*`, `border-gray-100/dark:border-white/10` migrados a `text-foreground`/`text-muted-foreground`/`border-border`
- [x] `components/features/designs/dialogs/design-form-bulk.tsx` — bordes y hovers migrados a tokens
- [x] `components/skeletons/design-detail-skeleton.tsx` — borders migrados a `border-border`
- [x] `components/features/account/account-tab.tsx` — `bg-black/40` y `text-white` **mantenidos** (overlay de avatar editable, contextualmente correcto)
- [x] `app/(auth)/layout.tsx` — `text-white`/`bg-white/10` **mantenidos** (texto sobre panel branding dorado, semánticamente OK)
- [x] `components/ui/sheet.tsx`/`dialog.tsx` — `bg-black/50` overlay backdrops **mantenidos** (estándar shadcn, veil oscuro sobre cualquier color)
- [x] Type-check + lint limpios.

---

### Fase 3 — Logger consistente ✅ HECHO (2026-04-30)

- [x] `lib/auth/auth-context.tsx` — 10 `console.*` migrados a `logger.log`/`logger.error`/`logger.warn`
- [x] `lib/supabase/middleware.ts` — `console.error` → `logger.serverError` (server-side, debe llegar a logs prod)
- [x] `lib/hooks/use-user-preferences.ts` — 2 `console.error` → `logger.error`
- [x] `lib/hooks/use-notifications.ts` — 5 `console.error` → `logger.error`
- [x] `app/(auth)/invite/[token]/page.tsx` — 1 `console.error` → `logger.error`
- [x] `components/invitations/create-invitation-dialog.tsx` — 1 `console.error` → `logger.error`
- [x] `lib/config.ts` — 1 `console.error` → `logger.error`
- [x] Type-check + lint limpios. 0 `console.*` directos en código frontend (`logger.ts` y `scripts/` son intencionales).
- [ ] (opcional, no bloqueante) ESLint rule `no-console` con allowlist — backlog

---

### Fase 4 — Páginas pendientes de descomponer ✅ HECHO (2026-04-30)

- [x] **`app/(auth)/*`** — 5 primitivas extraídas en `components/features/auth/*`: `AuthHeading`, `AuthError`, `AuthSuccess`, `AuthSubmitButton`, `PasswordInput`. Pages reducidas: login 278L→198L, reset 168L→121L, invite 277L→235L.
- [x] **`mi-semana/page.tsx`** 362L → 145L (-60%). Extraídas: `<UrgencyBadge>`, `<DesignCard>`, `<DeliveredSection>`, hook `useMyWeekData`.
- [x] **`ajustes/usuarios/page.tsx`** 272L → 56L (-80%). Extraídas: `<UsersList>`, `<InvitationsCard>` con `getInvitationStatus` interno.
- [x] **`<DetailSheet>` primitiva común** — **decisión informada: NO extraer**. Tras releer ambos sheets, son estructuralmente distintos (uno fetcha async + estados loading/error/content; otro recibe prop + lista hijos + sub-sheet anidado). Lo único común es shadcn `<Sheet>` shell que ya es primitiva. DRY mal aplicado.
- [x] Type-check + lint limpios.

---

### Fase 5 — Resto API hardening + SWR config ✅ HECHO (2026-04-30)

- [x] `lib/utils/api-fetcher.ts` con `apiFetcher<T>(url)` y variante `designsFetcher<T>(url)` que parsea `{ items: T[] }` directamente. Clase `ApiError` con `status`.
- [x] `SWRProvider` configurado con `fetcher: apiFetcher` global. Defaults SWR mantenidos (revalidateOnFocus, errorRetryCount=2, dedupingInterval=5s).
- [x] 3 hooks migrados a `designsFetcher`: `use-dashboard.ts`, `use-designs.ts`, `use-my-week.ts`. Eliminado el `const fetcher = async (url) => {...}` duplicado en cada uno.
- [x] `use-team-data.ts` y `use-users-data.ts` mantienen sus fetchers propios (acceden directo a Supabase con keys complejas, no /api/*).
- [x] Errores propagados desde server con mensaje (ya hecho en Fase 0.5 con `mapError`); ahora también desde fetcher de cliente con `ApiError.status`.
- [x] Type-check + lint limpios.

---

### Fase 6 — A11y pass ✅ HECHO (2026-04-30)

- [x] **Skip link** al `#main-content` añadido en AppLayout, visible al focus, sr-only por defecto.
- [x] **`aria-current="page"`** en items activos de la sidebar.
- [x] **`aria-label` dinámico** en triggers icon-only:
  - ThemeToggle: "Cambiar a modo claro/oscuro" (según estado)
  - NotificationsDropdown: "Notificaciones (N sin leer)" (con conteo)
  - UserMenu: "Menú de usuario — {nombre}"
  - Equipo prev/next week buttons
  - InvitationsCard copy/delete
  - DesignerDetailSheet edit/Drive
  - CreateInvitationDialog copy
- [x] **WCAG AA contrastes verificados** (cálculo HSL → RGB → luminancia → ratio):
  - Ajustado `--status-warning` light: `38 92% 50%` → `38 92% 32%` (2.01 → 4.56)
  - Ajustado `--status-success` light: `142 64% 38%` → `142 64% 28%` (3.22 → 5.42)
  - Ajustado `--status-info` light: `217 80% 52%` → `217 80% 42%` (para coherencia)
  - Ajustado `--destructive` dark: `0 65% 52%` → `0 75% 62%` (4.32 → 5.15)
  - Verificados sidebar foreground/active: 15+ (AAA)
  - Verificado primary/primary-foreground light: 7.67 (AAA, ya en Fase 0)
- [x] Type-check + lint limpios.
- [ ] (opcional, no bloqueante) Audit runtime con axe-core en Playwright — backlog (browser MCP bloqueado en sesión actual)

---

### Fase 7 — Estética final (2-3 días)

Solo después de cimientos sólidos. Iteración rápida, retoques no estructurales.

- [ ] Pulido visual sidebar shadcn
- [ ] Dashboard charcoal authority pulido (admin + designer)
- [ ] `/disenos` con vista Lista + Calendario (tabs)
- [ ] Replicar lenguaje en `/mi-semana`, `/equipo`, `/ajustes`
- [ ] Mobile pass (drawer, listas card vs tablas, bulk-create desktop-only)
- [ ] Empty states + error states pulidos
- [ ] Saludos rotativos de auth context (ya hecho en `lib/utils/greeting.ts`)

---

### Fuera de alcance (de momento)

- DB migrations / RLS policies (patrimonio histórico)
- Edge functions (`supabase/functions/*`) — patches mínimos solo si rompe algo
- Tests E2E o unit — no hay infra; fase aparte cuando se decida
- Performance profiling — solo si surge queja
- I18n — proyecto mono-idioma (es-ES)
- Feature dev account oculto — backlog separado (1-2h cuando se llegue)

---

## Estado de ejecución

### Hecho (no commiteado todavía)

- Limpieza `/communications` + sistema de comentarios (Fase A previa)
- Rutas español (`/inicio`, `/disenos`, `/mi-semana`, `/equipo`, `/ajustes`) + redirects 308 desde URLs antiguas en `next.config.js`
- Tipografía Geist + JetBrains Mono (`app/layout.tsx`, `globals.css`, `tailwind.config.ts`)
- KPI/eyebrows con clase `mono` para dotted zero
- Iteraciones varias de tokens sidebar (todas insatisfactorias — definitivo es shadcn migration)
- Dashboards admin + designer reescritos con bloques nuevos (Próximas entregas, Compañeros, Próximos vencimientos)
- Audit estructural completo (`docs/audit-estructural.md`)
- Mini-audit complementario (auth, API, hooks, services)

### Próximo paso al retomar

**Arrancar Fase 0** — Cimientos design system. Es la base sin la cual todo lo demás chirría.

---

## Cómo continuar (instrucciones para futuras sesiones)

1. Lee este `refactor-plan.md`.
2. Lee `audit-estructural.md` para los hallazgos completos.
3. Identifica la fase pendiente más antigua (`[ ]` sin marcar).
4. Antes de ejecutar, recuerda al user qué fase toca y por qué.
5. Después de cada fase: type-check + lint, marcar `[x]`, actualizar este doc.
6. Estética solo en Fase 7. Cualquier "esto se ve mal" antes de Fase 7 → diagnóstico estructural primero.
