# Refactor Plan — PH Sport Dashboard

> Documento de continuidad para el refactor de cimientos + lavado de cara UX/UI.
> Si retomas la conversación tras un `/compact` o en sesión nueva, **lee este fichero primero**.
> Última actualización: 2026-04-27.

---

## Contexto y objetivo

PH Sport Dashboard es una herramienta interna para el equipo de diseño (Manager + Diseñador).
Stack: Next.js 15, Tailwind, Shadcn UI, Söhne (custom font), Supabase.
Identidad: negro de marca + acento dorado, con dark/light mode.

El usuario pidió un **"lavado de cara"** completo. Tras auditoría se decidió que el problema raíz no es estético sino arquitectónico: cada cambio rompe varias cosas porque hay mega-componentes y un sistema de diseño a medio construir. **Cimientos primero, estética después.**

### Estilo de trabajo del usuario (importante)
- **Despacito y con buena letra** — paso por paso, validación entre pasos.
- Le gusta entender el **porqué** del orden propuesto antes de ejecutar.
- Prefiere fases pequeñas con feedback visible a refactors big-bang.
- No quiere que se le pregunten cosas obvias en auto mode, pero sí que se le confirmen decisiones de scope/prioridad.

---

## Estado actual (qué ya se ha hecho)

### Olas 1-3 completadas (sin commit aún)

**Ola 1 — Bugs P0:**
- `dialog.tsx`: eliminado el wrapper que disparaba `KeyboardEvent('Escape')` global. Ahora usa wrapper `pointer-events-none` con flex-center y motion controla solo scale+opacity. Click-outside vía Radix nativo.
- `design-calendar.tsx`: clase fantasma `glass-effect` (no existía) → `bg-card border border-border shadow-md`. Eliminados hooks vacíos `fc-calendar-custom`/`fc-event-custom` y workaround `lightStatusColors`.
- `admin-dashboard.tsx`: KPI "Bloqueados" filtraba por estados inexistentes (siempre 0). Redefinida como "BACKLOG sin movimiento >48h".

**Ola 2 — Theming:**
- `lib/types/design.ts STATUS_COLORS`: RGB hard-coded → `hsl(var(--*))`.
- `badge.tsx`: añadidas variantes `warning` y `success`. DELIVERED tokenizado.
- Tokenizados: `error-state`, `empty-state`, `kpi-card`, `user-menu`, `notifications-dropdown`, `comments-section`, `settings/users page` (ROLE_COLORS), `confirm-dialog`, `admin-dashboard`, `designer-card`, `designer-detail-sheet`, `design-detail-sheet`, `player-status-tag`, `create-invitation-dialog`, `communications/[designId] page`, páginas auth (login/reset/invite).
- Sidebar activo: quitado `border-l-[3px]` (anti-patrón AI-slop) → `bg-primary/10`.
- `designs/page.tsx`: 4× `hover:text-gold-400` → `hover:text-primary`.

**Ola 3 — Polish:**
- `button.tsx`: eliminado `transition-all duration-200` duplicado en cada variant.
- `confirm-dialog.tsx`: loading text "Eliminando..." → "Procesando..." (era engañoso para variants info/warning).

**Bug post-Ola 1 corregido:** los Dialogs aparecían descentrados porque framer-motion `scale: 0.96` machacaba `translate-x-[-50%]`. Solucionado con wrapper flex.

### Lo que NO se tocó deliberadamente
- `(auth)` layout decorativo (cuadrados rotados, gold gradient, grid SVG) — pendiente para fase de estética.
- `defaultTheme="dark" enableSystem={false}` — decisión de marca.
- `--font-sans` = Helvetica (Söhne solo en headings) — pendiente para fase tipografía.
- Overlays `bg-black/50` en dialog/sheet — son backdrops, válidos.

---

## Diagnóstico arquitectónico

### Health scores
- **Audit técnico** (Olas 1-3 cerradas): a11y 3/4, perf 3/4, theming 1→3/4, responsive 3/4, anti-patterns 2→3/4 = ~13→16/20.
- **Critique UX (Nielsen 10)**: 23/40. Bajos: control/freedom (sin undo), consistency (3 patrones de panel), efficiency (sin atajos), aesthetic (saturación), help/docs.

### Mega-componentes (causa raíz de fragilidad)
| Fichero | Líneas | Problema |
|---|---|---|
| `components/features/designs/dialogs/create-design-dialog.tsx` | 825 | single + bulk + helpers + submit en un solo fichero |
| `app/(dashboard)/designs/page.tsx` | 650 | filtros + búsqueda + paginación + sort + tabla + sheet |
| `components/features/account/settings-dialog.tsx` | 524 | 3 tabs + lógica de preferencias + avatar upload |
| `app/(dashboard)/my-week/page.tsx` | 368 | listado + agrupación + cambio estado + sheet |
| `app/(dashboard)/communications/[designId]/page.tsx` | 365 | chat + edición + delete + auto-scroll |

### Sistema de diseño incompleto
- ✅ Tokens de color en `globals.css` (CSS vars).
- ❌ Tokens de espaciado, radius (solo `--radius` único), shadow, font-size.
- ❌ Primitivas de pattern (PageContainer, PageHeader, DashboardPage, etc.).
- ❌ 8 esqueletos sueltos en `components/skeletons/` que duplican el wrapper de cada page → drift inevitable.

---

## Fase 1 — Inventario ✅ (completada)

### Tabla 1 · Patrones repetidos inline

| # | Patrón | Apariciones | Primitiva propuesta |
|---|---|---|---|
| 1 | `flex flex-col gap-6 p-6 md:p-8 max-w-7xl mx-auto` | 7 + 8 esqueletos = **15** | `<PageContainer maxWidth="7xl">` |
| 2 | `flex flex-col md:flex-row md:items-center justify-between gap-4` (page header) | 6 + 6 esqueletos = **12** | `<PageHeader>` |
| 3 | `<h1 text-3xl font-bold text-foreground flex items-center gap-3><Icon h-8 w-8 text-primary />` | **5** | parte de `<PageHeader title icon>` |
| 4 | `<p text-muted-foreground>` subtitle | **3+** | parte de `<PageHeader subtitle>` |
| 5 | `<CardContent flex h-64 items-center justify-center>` | **4** | refactor `<EmptyState>` extendido |
| 6 | `flex h-10 w-10 items-center justify-center rounded-full bg-primary/10` | 2+ | `<RoundIcon>` o `<IconBadge>` |
| 7 | `grid gap-4 md:grid-cols-{3,4}` o variantes | 8+ | `<CardGrid columns={n}>` |
| 8 | `text-lg font-semibold ... flex items-center gap-2` con badge | 2+ | `<SectionHeader title count action>` |
| 9 | PageTransition + skeleton | 6 | ya existe; los 8 esqueletos son el problema |
| 10 | Macro: container + transition + header + skeleton | 6 | `<DashboardPage>` |

### Tabla 2 · Primitivas a crear (orden)

1. **`<PageContainer>`** — wrapper común
2. **`<PageHeader title icon subtitle actions>`**
3. **`<DashboardPage>`** (compone container + transition + header + skeleton wrapper)
4. **`<EmptyState>` ampliada** (variants: empty/error/loading, icon, doble acción)
5. **`<CardGrid columns>`**
6. **`<SectionHeader>`**
7. **`<RoundIcon>`**
8. **`<DataCardSkeleton>`** o `pageSkeleton(variant)` parametrizado

### Tabla 3 · Chunks a extraer de mega-componentes

**`create-design-dialog.tsx`** (825 → ~3 ficheros 200-300):
- Helpers (`generateId`, `createEmptyRow`, `isRowValid`, `isRowEmpty`, `isOutsideWeek`) → `lib/utils/design-form.ts`
- Modo individual (líneas 361-506) → `<DesignFormSingle>`
- Modo lote (líneas 507-680) → `<DesignFormBulk>`
- Lógica submit → hook `useDesignSubmit`
- Shell del dialog → ~120 líneas

**`designs/page.tsx`** (650 → ~250 + 2 sub-componentes):
- Filtros (statusFilter, designerFilter, week, search + debounce) → hook `useDesignsFilters()`
- Paginación + sort → hook `useTablePagination<T>()` reutilizable
- JSX "Filtros Avanzados" Card (288-350) → `<DesignsFilters>`
- JSX tabla (404-580) → `<DesignsTable>`
- JSX paginación (582-612) → `<TablePagination>` reutilizable

**`settings-dialog.tsx`** (524 → ~150 + 3 tabs):
- Tab Cuenta (269-342) → `<AccountTab>`
- Tab Notificaciones (343-456) → `<NotificationsTab>`
- Tab Apariencia (457-end) → `<AppearanceTab>`
- Lógica preferencias dispersa → hook `useUserPreferences()`

---

## Fase 2 — Primitivas estructurales ✅ (completada)

**Creadas:**
- `components/ui/page-container.tsx` — wrapper con prop `maxWidth` (default `7xl`).
- `components/ui/page-header.tsx` — props `title`, `icon`, `subtitle`, `actions` (slot).
- `components/ui/dashboard-page.tsx` — compone PageContainer + PageTransition + PageHeader + skeleton.

**Migradas (6 pages):** `/dashboard`, `/designs`, `/my-week`, `/team`, `/communications` (lista), `/settings/users` (`maxWidth="4xl"`).

**No migrada:** `/communications/[designId]` — layout especial chat full-screen (`h-[calc(100vh-4rem)]`), no encaja en `<DashboardPage>`. Se queda con su wrapper propio.

**Skeletons migrados a `<PageContainer>` (6/8):** dashboard, designs, my-week, team, communications, users (con `maxWidth="4xl"`).

**Skeletons NO migrados (2/8):** `design-detail-skeleton` (panel interno de Sheet, no es page-level) y `sidebar-skeleton` (es la sidebar fija, no es page-level).

**Validación:** type-check, lint y build limpios después de migrar todo.

**Criterio cumplido:** cada page.tsx redujo el wrapper de cabecera a una llamada de ~10 líneas; todas comparten la misma fuente.

---

## Fase 3 — Tokens completos (después de Fase 2)

**Objetivo**: añadir solo los tokens que las primitivas hayan revelado como necesarios.

Probables tokens a añadir (no decidido aún, depende de Fase 2):
- Escalas de espaciado semánticas (si las primitivas piden algo más allá de Tailwind directo).
- Sistema de radius (hoy solo hay `--radius`; faltaría `--radius-sm/md/lg/xl`).
- Sistema de shadows tokenizado.
- Escala de font-size si decidimos algo más allá de las clases Tailwind.

**Regla**: ningún token sin uso real. Si una primitiva usa `rounded-2xl` en 1 sitio, no se tokeniza.

---

## Fase 4 — Descomponer mega-componentes

**Estado:** parcialmente completada (1/3).

### `create-design-dialog.tsx` ✅ (825 → 281 líneas)

Descompuesto en:
- `lib/utils/design-form.ts` (71 L) — tipos `BulkDesignRow`, `SingleDesignFormData`, `PlayerStatus` + helpers `generateId`, `createEmptyRow`, `isRowValid`, `isRowEmpty`, `isOutsideWeek`.
- `components/features/designs/dialogs/design-form-single.tsx` (187 L) — JSX modo edit, controlado.
- `components/features/designs/dialogs/design-form-bulk.tsx` (329 L) — JSX modo bulk, gestiona internamente `expandedRowIds` + `outsideWeekCount`.
- `lib/hooks/use-design-submit.ts` (115 L) — encapsula `handleSubmit` (PUT vs POST bulk), maneja loading + toasts.
- Shell dialog (281 L) — solo orquesta state, dialog wrapper y footer.

Eliminado dead code en el camino: `if (!isEditMode && deadline < oneHourAgo)` dentro del bloque `if (isEditMode)` (siempre falso).

### `designs/page.tsx` ✅ (644 → 275 líneas)

Descompuesto en:
- `lib/hooks/use-designs-filters.ts` (48 L) — encapsula `statusFilter`, `designerFilter`, `weekStart/End`, `searchQuery` + `useDebounce`.
- `lib/hooks/use-designs-table.ts` (88 L) — sort + paginación + `handleSort`. Tipos `DesignSortColumn`, `SortDirection` exportados.
- `components/features/designs/designs-filters.tsx` (128 L) — search input + Card de filtros avanzados.
- `components/features/designs/designs-table.tsx` (322 L) — Card con tabla, columnas con sort, badges de urgencia, acciones (Drive/Edit/Delete) y controles de paginación.
- Shell page.tsx (275 L) — orquesta auth, SWR, dialogos y conecta filters→items→table.

Refactor incidental: `filteredItems` ahora es un `useMemo` (antes era `localItems.filter(...)` ejecutándose en cada render).

### `settings-dialog.tsx` ✅ (524 → 156 líneas)

Descompuesto en:
- `lib/utils/notification-preferences.ts` (80 L) — tipos `NotificationPreferences`, `NotificationPreferencesDb` + `dbToUi`/`uiToDb` + `DEFAULT_NOTIFICATION_PREFERENCES`.
- `lib/hooks/use-user-preferences.ts` (168 L) — load/save/togglePreference/uploadAvatar; orquesta supabase + localStorage.
- `components/features/account/account-tab.tsx` (106 L) — avatar uploader + name + email + role.
- `components/features/account/notifications-tab.tsx` (92 L) — grid 3 cols × 4 filas, refactorizado a `EVENT_ROWS.map(...)` (antes 4 bloques duplicados).
- `components/features/account/appearance-tab.tsx` (43 L) — selector de defaultView.
- Shell `settings-dialog.tsx` (156 L) — solo Dialog + Tabs + AnimatePresence + footer.

Refactor incidental: las 4 filas de notificaciones eran 4 bloques copy-paste; ahora viven en una constante `EVENT_ROWS` y el JSX las mapea (~30 líneas → ~17).

**Criterios de éxito**:
- Ningún fichero >300 líneas. ✅ Cumplido en create-design-dialog (max 329 en bulk, justificado por complejidad de tabla bulk-edit).
- Ningún componente con >5 useState.
- Lógica de paginación/filtrado en hooks, no en pages.

---

## Plan post-cimientos (estética / lavado de cara real)

### Pendiente de decidir con el usuario
1. **Tipografía**: ¿Söhne también en body o pareja Söhne+otra? Actualmente `--font-sans` es Helvetica.
2. **Modelo de estados**: ¿añadir IN_PROGRESS y/o REVIEW al workflow de diseños? Implica migración SQL + UI nueva. Decisión abierta.
3. **Scope visual**: ¿solo dashboard+designs+my-week, o todo el shell, o solo identidad?

### Frentes posibles (orden por impacto)
1. **Auth layout** (la peor pantalla anti-patterns): rediseñar el panel derecho con identidad PH Sport real (foto/textura deportiva, logo, microcopy de marca).
2. **Dashboard rework**: bajar densidad. Una pregunta principal por rol ("¿qué necesito hacer hoy?") en vez de 4 KPIs + alertas + carga apilados.
3. **Designs table**: reducir columnas, dar más jerarquía. Considerar vista "tarjetas" como alternativa.
4. **My-week**: agrupación visual por urgencia (hoy / esta semana / siguiente) en vez de lista plana.
5. **Componentes con identidad** (no shadcn-genérico): KpiCard editorial, Card con textura, Badge con peso visual.
6. **Eficiencia**: cmd+K palette, atajos de status, soft-delete con undo en toast.

### Issues de UX detectados (referencia)
- 2 estados (BACKLOG/DELIVERED) → demasiado pocos para flujo real.
- Sin undo en delete/status change.
- Tres patrones distintos para "panel lateral" (Sheet, Dialog, inline).
- Cero atajos de teclado.
- Alta densidad en `/dashboard` (4 KPI cards + alertas + tabla).
- "BACKLOG" expuesto al usuario es jerga.
- Empty states sin onboarding.

---

## Decisiones tomadas

| Fecha | Decisión | Razón |
|---|---|---|
| 2026-04-26 | Ola 1: usar click-outside nativo de Radix en Dialog | El hack de Escape global cerraba todos los popovers |
| 2026-04-26 | Ola 1: redefinir "Bloqueados" como BACKLOG sin mov >48h | Los estados antiguos no existen |
| 2026-04-26 | Ola 2.5: quitar border-l-[3px] del sidebar activo | Anti-patrón AI-slop |
| 2026-04-26 | Olas 2-3: tokenizar todo, no solo light mode | Cohesión + futura facilidad para temas |
| 2026-04-27 | Cimientos antes que estética | Sin base sólida, cada cambio rompe N cosas |
| 2026-04-27 | No definir tokens en abstracto | Las primitivas destilan los tokens necesarios |
| 2026-04-27 | Empezar Fase 2 por PageContainer/Header/DashboardPage | Más usado, riesgo bajo, valida el approach |
| 2026-04-27 | Fase 2 cerrada: 6 pages + 6 skeletons migrados | type-check/lint/build limpios; `/communications/[designId]` y 2 skeletons no-page-level se quedan fuera |
| 2026-04-27 | Fase 4 paso 1 cerrado: create-design-dialog 825 → 281 L | 5 pasos por subextracción (helpers → single → bulk → hook submit → cleanup); type-check/lint limpios entre cada paso |
| 2026-04-27 | Fase 4 paso 2 cerrado: designs/page.tsx 644 → 275 L | Hooks `useDesignsFilters` + `useDesignsTable`, componentes `DesignsFilters` + `DesignsTable`. `filteredItems` ahora memoizado |
| 2026-04-27 | Fase 4 paso 3 cerrado: settings-dialog 524 → 156 L | Util `notification-preferences` + hook `useUserPreferences` + 3 tabs (Account/Notifications/Appearance). Notifications refactorizado de 4 bloques copy-paste a `EVENT_ROWS.map` |
| 2026-04-27 | Fase 4 completa: 3/3 mega-componentes descompuestos | Ningún fichero >329 L; los hooks/utils ahora son reutilizables para futuras tablas/dialogs |

---

## Siguiente paso concreto al retomar

**Cimientos terminados.** Fases 1+2+4 cerradas; Fase 3 (tokens) la dejamos para cuando una primitiva real los pida.

Validar visualmente las descomposiciones de hoy antes de pasar a estética:
- `/designs`: filtrar, ordenar, paginar, buscar, abrir detalle, editar, eliminar.
- `Settings dialog` (avatar arriba a la derecha → Configuración): los 3 tabs (Cuenta, Notificaciones, Apariencia), subir avatar, cambiar nombre, togglear switches, cambiar vista predeterminada, guardar.
- `Crear/Editar diseño` (modo single + bulk).

Una vez validado, opciones:

**A.** Comenzar fase estética. Frentes propuestos por orden de impacto (ver más arriba):
1. Auth layout (peor pantalla anti-patterns).
2. Dashboard rework (bajar densidad).
3. Designs table simplificación.
4. My-week con agrupación por urgencia.

**B.** Fase 3 (tokens) en abstracto — recomendado solo si A va a destilar tokens necesarios; si no, saltar a A.

**C.** Empezar a hablar de decisiones abiertas: tipografía body, modelo de estados (IN_PROGRESS/REVIEW), workflow.
