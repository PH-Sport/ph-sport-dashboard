# Audit Estructural — PH Sport Dashboard

**Fecha**: 2026-04-28
**Contexto**: tras descubrir que la sidebar tiene problemas estructurales (tokens isla, monolito, fixed+ml-compensation, lógica hardcoded), revisar el resto del repo en busca del mismo patrón. La hipótesis es que la deuda de iteraciones previas con varios modelos IA dejó componentes "que funcionan pero no permiten iterar limpiamente".

**Severidades**:
- **P0** — bloquea progreso, rompe o introduce inconsistencias visibles. Arreglar antes de seguir.
- **P1** — deuda mayor que limita futuras iteraciones. Arreglar en fase próxima.
- **P2** — deuda menor, no urgente pero útil.
- **P3** — polish, nice-to-have.

**Patrón vs caso**: cuando un problema aparece en >1 lugar lo marco como **PATRÓN**. Esos son los que más rendimiento dan al arreglar.

---

## Top archivos por tamaño (línea base de monolitos)

| Archivo | Bytes | Estado |
|---|---|---|
| `components/features/designs/dialogs/design-form-bulk.tsx` | 13998 | Extraído de 825L original, sigue grande |
| `components/features/dashboard/admin-dashboard.tsx` | 13863 | Reescrito recientemente |
| `app/(dashboard)/mi-semana/page.tsx` | 13418 | Sin tocar |
| `components/features/designs/designs-table.tsx` | 12041 | Extraído ya |
| `components/features/dashboard/designer-dashboard.tsx` | 11870 | Reescrito recientemente |
| `components/features/designs/design-detail-sheet.tsx` | 11316 | Limpiado de comments |
| `app/(dashboard)/ajustes/usuarios/page.tsx` | 9790 | Sin tocar |
| `app/(dashboard)/disenos/page.tsx` | 9648 | Refactor parcial |
| `components/features/designs/dialogs/create-design-dialog.tsx` | 9305 | Refactor parcial |
| `app/api/designs/bulk/route.ts` | 8879 | Sin tocar |
| `app/(auth)/login/page.tsx` | 8475 | Sin tocar |
| `app/(auth)/invite/[token]/page.tsx` | 8093 | Sin tocar |
| `lib/auth/auth-context.tsx` | 7362 | Sin tocar |
| `components/features/team/designer-detail-sheet.tsx` | 7366 | Sin tocar |

Total LOC TS/TSX: 11.295 (~11k líneas).

---

## Capas a auditar

1. [x] Design system (tokens, paletas, tipografía, espaciado)
2. [ ] Primitivas UI (`components/ui/*`)
3. [ ] Layout components (`components/layout/*`)
4. [ ] Componentes feature (`components/features/*`)
5. [ ] Skeletons (`components/skeletons/*`)
6. [ ] Hooks (`lib/hooks/*`)
7. [ ] Utils & types (`lib/utils/*`, `lib/types/*`)
8. [ ] Services (`lib/services/*`)
9. [ ] Auth (`lib/auth/*`)
10. [ ] API routes (`app/api/**`)
11. [ ] Middleware
12. [ ] Pages (`app/(*)/**/page.tsx`)
13. [ ] Forms (cross-cutting)
14. [ ] TypeScript (any, as, implicit)
15. [ ] Accesibilidad
16. [ ] Convenciones (naming, file structure)
17. [ ] Dead code

---

# Capa 1 — Design system

**Archivos**: `app/globals.css`, `tailwind.config.ts`.

## Hallazgos

### 1.1 — Tokens "isla" del sidebar (PATRÓN, P0)

`--sidebar`, `--sidebar-foreground`, `--sidebar-muted`, `--sidebar-border`, `--sidebar-active`, `--sidebar-active-foreground` duplican concepto de paleta general (`--card`, `--foreground`, `--muted-foreground`, `--border`, `--accent`).

**Consecuencia**: el sidebar es la única zona del app con su propia paleta. Cuando ajusto sus tokens no coopera con el resto del sistema. Visualmente "isla" por defecto. Origen del chirrido recurrente.

**Fix**: eliminar los 6 tokens `--sidebar-*`. La sidebar usa `bg-card`/`bg-muted`/`bg-background` + `border-border` directamente, como cualquier otro contenedor del sistema. Esto se resolverá al adoptar shadcn `Sidebar` (que también introduce su propio set, pero estandarizado, no ad-hoc nuestro).

---

### 1.2 — `--font-mono` declarado por className pero no en `:root` (P1)

La variable `--font-mono` la define el className aplicado por `next/font/google` al `<html>`. Funciona por cascada, pero NO está en `:root` ni en `.dark`. Quien busque dónde se define la fuente mono no la encuentra.

**Fix**: declarar `--font-mono: var(...), ui-monospace, ...` explícito en `:root` y `.dark` con fallback, igual que `--font-sans`.

---

### 1.3 — Paleta `gold` (Tailwind-scale) coexiste con `--primary` (HSL) (P1)

Tailwind config tiene `gold: { 50: '#faf7f0', ..., 950: '#2d2412' }` (11 tonos hex). Y aparte, `--primary: 41 70% 52%` (HSL CSS var).

**Encontrado en código** (busqué después): mezcla `bg-gold-50`, `text-gold-400`, `hover:bg-gold-500/10` con `bg-primary`, `text-primary`. **Doble sistema de paleta dorada**.

**Consecuencia**: cambios al color de marca obligan a tocar dos sitios. Inconsistencia entre componentes.

**Fix**: eliminar `gold` del Tailwind config. Todo dorado va por `--primary` y sus variantes con opacity (`bg-primary/10`, etc.).

---

### 1.4 — Tokens `--status-*` sin Tailwind config (P1)

`--status-success`, `--status-warning`, `--status-error`, `--status-info` definidos en CSS pero NO expuestos en Tailwind config.

**Consecuencia**: para usarlos, los componentes hacen `bg-[hsl(var(--status-warning))]` (bracket syntax ruidoso) o `text-[hsl(var(--status-success))]`. Visto en KpiCard, dashboards, design-detail-sheet. **Patrón repetido**.

**Fix**: añadir al Tailwind config:
```ts
status: {
  success: 'hsl(var(--status-success))',
  warning: 'hsl(var(--status-warning))',
  error: 'hsl(var(--status-error))',
  info: 'hsl(var(--status-info))',
}
```
Permite `text-status-warning`, `bg-status-success/10` limpio.

---

### 1.5 — Redundancia `--destructive` ≡ `--status-error` (P2)

Ambos son `0 72% 50%` (light) y `0 65% 52%` (dark). Dos nombres para el mismo valor.

**Fix**: mantener `--destructive` (es estándar shadcn). Eliminar `--status-error` o hacer que sea alias.

---

### 1.6 — Tokens `--secondary` / `--muted` / `--accent` casi idénticos (P2)

Light:
- `--secondary: 220 14% 95%`
- `--muted: 220 14% 96%`
- `--accent: 220 14% 94%`

Diferencia 1-2% de luminosidad. Tres tokens para variaciones imperceptibles.

**Consecuencia**: los componentes mezclan `bg-secondary`/`bg-muted`/`bg-accent` sin criterio claro porque visualmente son lo mismo.

**Fix**: colapsar a uno (`--muted` que es el más usado). Documentar cuándo usar cada uno o eliminar los redundantes.

---

### 1.7 — `--ring` ≡ `--primary` (P2)

Light: ambos `41 70% 52%`. Dark: ambos `41 70% 56%`. Dos tokens, mismo valor.

**Fix**: mantener separados (semánticamente diferentes — uno es brand color, otro es focus indicator) pero documentar que cuando se cambie `--primary` revisar si `--ring` debe seguirle.

---

### 1.8 — Comentario header desactualizado (P0)

Líneas 6-11 de globals.css dicen:
```
Sidebar siempre oscura (territorio "túnel antes del partido").
```

Pero hoy la sidebar light es `36 16% 95%` (cream casi blanco). El comentario miente. Quien lea el archivo se confunde.

**Fix**: actualizar comentario a la realidad actual o, mejor, reescribirlo cuando hagamos el refactor del sidebar a shadcn.

---

### 1.9 — `--card` blanco puro `0 0% 100%` sobre body cream (P3)

Light: `--background: 36 24% 97%` (cream tinted), `--card: 0 0% 100%` (blanco puro sin tint).

Las cards "saltan" del fondo porque pierden el tinte warm de la paleta. Skill `impeccable` recomienda **tintar todos los neutros hacia el brand hue** para coherencia inconsciente.

**Fix**: `--card: 36 30% 99%` o similar (mantener blancura pero con el tinte cream). Verificar contraste de texto.

---

### 1.10 — Animaciones definidas posiblemente dead (P3)

Tailwind config tiene 8 keyframes/animations: `accordion-down/up`, `fade-in/out`, `slide-up`, `page-enter`, `blink`, `pulse-slow`. ¿Cuáles se usan?

**A verificar después**: grep cada nombre en components/. Si no se usa, eliminar.

---

### 1.11 — Falta sistema de espaciado semántico (P3)

No hay tokens `--space-xs`/`--space-sm`/etc. Se usa Tailwind scale ad-hoc (`p-3`, `gap-4`, `mt-6`).

**Fix**: definir scale semántica solo si hace falta. Por ahora Tailwind alcanza, pero documentar la convención (p.ej. "padding interno cards = `p-5`, gap entre secciones = `gap-6`").

---

### 1.12 — Tipografía sin tokens (P3)

Sin `--text-xs`/`--text-sm`/etc. Se usan Tailwind classes directos. KPI grande hardcoded `text-[2.75rem]`.

**Fix**: cuando aparezcan más patrones repetidos, extraer a tokens. No urgente.

---

### 1.13 — Tinte primary-foreground (P2)

Light: `--primary-foreground: 220 14% 11%` (charcoal — para que botones primary sean dorado con texto charcoal). 
Dark: `--primary-foreground: 220 14% 8%`.

Casi idéntico. Pero el dorado `41 70% 52%` light tiene contraste bajo con charcoal `220 14% 11%`. Verificar WCAG AA cuando hagamos a11y.

---

### 1.14 — `[* { @apply border-border }]` aplica a TODO elemento (P2)

```css
* {
  @apply border-border;
}
```

Patrón shadcn estándar, pero significa que cualquier elemento con `border` clase hereda color del token. Útil — pero requiere disciplina: nunca usar `border-{color}` y borderless con `border-0` cuando no quieras border, no con border:none implícito.

**A verificar**: que no haya borders accidentales en el código.

---

## Conclusión Capa 1

**Patrones detectados**:
- Doble sistema (gold + primary, sidebar tokens vs generales) → fragmentación que dificulta iterar.
- Tokens duplicados o casi-idénticos (secondary/muted/accent, destructive/error, ring/primary) → ruido.
- Falta de exposure en Tailwind de tokens existentes (`--status-*`) → bracket syntax ruidoso.

**Plan de fix Capa 1** (en orden):
1. Eliminar `gold-*` del Tailwind config. Migrar usos a `bg-primary/N`.
2. Exponer `status-*` en Tailwind. Migrar bracket syntax a `bg-status-success/N`, `text-status-warning`.
3. Colapsar `secondary` o documentar diferencia clara con `muted`.
4. Declarar `--font-mono` en `:root` + `.dark`.
5. Tintar `--card` hacia warm.
6. Actualizar comentario header de globals.css.
7. Eliminar tokens `--sidebar-*` cuando hagamos el refactor a shadcn Sidebar (Capa 3).
8. Verificar contraste light primary/primary-foreground (en Capa 15 a11y).

**No tocar todavía**: animaciones dead, scale semántica de espacios. Después.

---

---

# Capa 2 — Primitivas UI (`components/ui/*`)

**Archivos**: 32 (button, badge, card, dialog, sheet, dropdown-menu, table, input, label, tabs, switch, popover, scroll-area, select, textarea, calendar, date-picker, date-time-picker, page-transition, animations, page-container, page-header, dashboard-page, kpi-card, empty-state, error-state, confirm-dialog, skeleton, theme-toggle, loader, logout-overlay, progress, avatar).

## Hallazgos

### 2.1 — Bracket syntax `[hsl(var(--status-*))]` repartido en 16 archivos (PATRÓN, P1)

**Búsqueda**: 30 ocurrencias en código (excluyendo docs).
**Archivos**: kpi-card, badge, confirm-dialog, error-state, empty-state (hereda destructive), designs/*, dashboards, login, invite, reset-password, ajustes/usuarios, designer-card, designer-detail-sheet, notifications-dropdown, etc.

**Origen**: ya identificado en Capa 1 (1.4) — los tokens `--status-*` no están expuestos en Tailwind config.

**Fix**: añadir `status` a `tailwind.config.ts` colors. Migrar las 30 ocurrencias con búsqueda+reemplazo. **Elimina 30 puntos de fricción de un golpe**.

---

### 2.2 — `KpiCard.variant` y `Badge.variant` duplican concepto (P2)

`KpiCard` define `variant: 'default'|'primary'|'success'|'warning'|'danger'` con su propio mapping a colores.
`Badge` define `variant: 'default'|'secondary'|'destructive'|'warning'|'success'|'outline'` + `status: 'BACKLOG'|'DELIVERED'`.

Mismo concepto pero con APIs distintos. Cualquier "tono" debería resolverse con un único set de variants compartidas (o con Tailwind classes directas si los `status-*` están expuestos).

**Fix** (después del fix de tokens): unificar el contrato de variants. Probablemente quitar `variant` de KpiCard a favor de pasar `valueClassName`/`tone` directo.

---

### 2.3 — `PageHeader` + `PageContainer` + `DashboardPage` (composición correcta, P3 polish)

Las 3 primitivas son nuevas (Fase 2 refactor) y bien hechas: API clara, separación, tests no necesarios todavía.

**Mejora**: el slot `icon?: LucideIcon` en `PageHeader` ya no se usa en ningún sitio (se quitó cuando dejamos saludo dinámico sin icon). Si confirmamos que no lo queremos, simplificar.

---

### 2.4 — `EmptyState` con duplicación de `actionLabel`/`onAction` vs `actionHref` (P3)

API actual:
```ts
{ actionLabel, onAction, actionHref, actionDisabled, actionDisabledReason }
```

Dos modos: callback o link. Lógica branch dentro. Mejor: un slot `action?: ReactNode` y que el llamador pase `<Button onClick={...}>` o `<Button asChild><Link>...</Link></Button>`. Más simple, más flexible.

---

### 2.5 — `ConfirmDialog` mezcla bracket syntax con tokens (P2)

```ts
warning: { iconClassName: 'text-[hsl(var(--status-warning))]' ... }
```

Mismo problema 2.1. Se arregla automáticamente al exponer `status-*`.

---

### 2.6 — `PageTransition` exporta de nuevo `animations` y `TRANSITIONS` (P3)

```ts
export { animations, TRANSITIONS };
```
Re-export de barrel. No es problema, pero "innecesario" ya que importarlos directo desde `./animations` es trivial. Posible cleanup.

---

### 2.7 — Primitivas shadcn intactas y correctas (P3 polish)

Button, Card, Dialog, Sheet, Tabs, Switch, Popover, Scroll-area, Select, Textarea, Input, Label — todo OK, no se han trastocado. Bien.

---

### 2.8 — Calendar / DatePicker / DateTimePicker componente potencialmente innecesario (P2)

3 componentes para selección de fecha (calendar primitiva + 2 wrappers). Probable que solo se use uno. **A verificar grep usos**.

---

### 2.9 — `LogoutOverlay` archivo aislado (P3)

Componente standalone que se renderiza al hacer logout. Pequeño y aislado. OK.

---

## Conclusión Capa 2

**Patrón principal**: bracket syntax `[hsl(var(--status-*))]` se ha replicado por todo el código porque los tokens de status no están en Tailwind config. **Arreglar el token en Capa 1 limpia 30 ocurrencias en cascada**.

**Otros**: API duplicadas entre primitives (KpiCard variant vs Badge variant), slots no usados (`PageHeader.icon`), API verbosa (EmptyState).

---

# Capa 3 — Layout components (`components/layout/*`)

**Archivos**: `sidebar.tsx`, `sidebar-logo.tsx`, `header.tsx`, `app-layout.tsx`, `notifications-dropdown.tsx`, `user-menu.tsx`, `ph-sport-mark.tsx`.

## Hallazgos

### 3.1 — Sidebar custom monolítico (PATRÓN, P0)

Ya documentado al detalle en respuesta al user. Resumen:
- Tokens isla
- `fixed` + `ml-*` compensation duplicada
- Componente monolítico (logo + nav + state mezclados)
- Lógica `isActive` hardcoded con excepción `/inicio`
- Animaciones en cascada
- Mobile drawer = duplicación del componente
- Sin variants ni primitivas

**Fix**: migrar a shadcn `Sidebar` oficial. Trae sub-componentes, variants (sidebar/floating/inset), collapsible (icon/offcanvas), mobile drawer integrado, keyboard shortcut Ctrl+B, y tokens estandarizados.

---

### 3.2 — `AppLayout` mezcla dos responsabilidades (P1)

Hace:
- Auth guard (redirect a /login si UNAUTHENTICATED)
- Layout structure (sidebar + main)
- Sidebar state (collapsed + persistencia localStorage)
- Mobile drawer state

**Fix**: separar `<AuthGuard>` + `<Shell>`. Shell solo maneja layout. Auth en su propio componente. Más limpio, testeable.

---

### 3.3 — `Header` repite dividers y patterns (P3)

`Header` tiene su propio `<div className="mx-4 border-b border-border" />` al final, similar al que tenía sidebar (que ya quitamos). Coherencia OK pero podría parametrizarse.

---

### 3.4 — `NotificationsDropdown` con render lógico denso (P2)

Componente de ~140L con todos los estados (loading, empty, list) y handlers (mark read, delete, navigate). No es enorme pero tiene 3 responsabilidades. Posible split en sub-comp `NotificationItem`.

---

### 3.5 — `SidebarLogo` con animación propia (P2)

Tiene su propio state `collapseLayoutSettled` con `setTimeout`/`useEffect` para coordinar con la sidebar. Esta coordinación se simplifica al adoptar shadcn Sidebar.

---

## Conclusión Capa 3

Casi toda la deuda gravita alrededor del sidebar custom. **Migrar a shadcn Sidebar resuelve 80% de los problemas de Layout en una pasada**. Después: separar Auth de Shell.

---

# Capa 4 — Componentes feature (`components/features/*`)

**Archivos top por tamaño** (ya extraídos pero siguen grandes):
- `designs/dialogs/design-form-bulk.tsx` — 13998b
- `dashboard/admin-dashboard.tsx` — 13863b (recién reescrito)
- `designs/designs-table.tsx` — 12041b
- `dashboard/designer-dashboard.tsx` — 11870b (recién reescrito)
- `designs/design-detail-sheet.tsx` — 11316b (limpiado de comments)
- `designs/dialogs/create-design-dialog.tsx` — 9305b
- `team/designer-detail-sheet.tsx` — 7366b
- `designs/dialogs/design-form-single.tsx` — 6943b

## Hallazgos

### 4.1 — Tailwind classes directas (gray-, white, black) en lugar de tokens (PATRÓN, P1)

5 archivos:
- `components/features/designs/design-detail-sheet.tsx` — `text-gray-*`, `text-white`
- `components/features/designs/dialogs/design-form-bulk.tsx` — `text-gray-*`
- `components/ui/table.tsx` — `text-gray-*`
- `components/skeletons/design-detail-skeleton.tsx` — `text-gray-*`
- `components/features/account/account-tab.tsx` — `text-white`/`bg-white`

**Consecuencia**: ignoran el sistema de tokens. En dark mode aparecen valores que no se adaptan. Diferentes archivos muestran tonalidades distintas para el mismo concepto.

**Fix**: reemplazar por `text-muted-foreground`, `bg-card`, `text-foreground`, según el caso.

---

### 4.2 — `design-detail-sheet.tsx` con doble lógica de error retry (P1)

Tiene un retry en línea 138-149 que duplica lógica del fetch principal (líneas 56-65). Inline retry handler con todo el flow re-implementado.

**Fix**: extraer hook `useDesignDetail(designId)` que devuelva `{ design, loading, error, retry }`. Ya tenemos otros hooks similares.

---

### 4.3 — `dashboards` con cálculos masivos en render (P2)

`admin-dashboard.tsx` calcula 6+ derived values (atRisk, stuckDesigns, unassignedCount, designerLoads, criticalCount, upcoming, etc.) en cada render. Algunos en `useMemo`, otros no. **No es bug** porque items raramente cambia, pero inconsistente.

**Fix**: todos los cálculos derivados en `useMemo` con deps explícitas.

---

### 4.4 — `designs-table.tsx` con 322L (P2)

Después de la extracción sigue siendo grande. Mezcla render de tabla + handlers + state. Posible split en sub-comps `<DesignsTableRow>`, `<DesignsTableHeader>`.

---

### 4.5 — `create-design-dialog.tsx` mantiene 281L (P3)

Después de extraer single/bulk/submit hook, sigue grande pero acotado. Acceptable.

---

### 4.6 — Pattern: detail-sheet duplicado entre `designs` y `team` (P2)

`designs/design-detail-sheet.tsx` y `team/designer-detail-sheet.tsx` siguen patrón muy similar (Sheet + fetch + estado + edit). Posible primitiva compartida `<DetailSheet>` con slots.

---

### 4.7 — `account/settings-dialog.tsx` con 156L (P3 OK)

Reciente refactor lo dejó limpio. OK.

---

## Conclusión Capa 4

Mezcla de tokens hardcoded + cálculos sin memoize + monolitos parcialmente extraídos. **Mitad del trabajo está hecha** (los componentes más grandes ya se extrajeron). Falta segunda pasada para tokens hardcoded y memoize.

---

# Capa 5-13 — Hallazgos cross-cutting (vía grep masivo)

## Hallazgos

### 5.1 — `console.log/error/warn` directo en lugar de `logger` (P1, PATRÓN)

`lib/utils/logger.ts` existe pero NO se usa en:
- `lib/auth/auth-context.tsx` (~12 console.* directos)
- `lib/supabase/middleware.ts` (1)
- `lib/hooks/use-user-preferences.ts` (2)
- `app/(auth)/invite/[token]/page.tsx` (1)

**Consecuencia**: producción tiene console.log que filtran info. Logger custom debería tener stripping en prod.

**Fix**: forzar `logger.*` en todos los entrypoints frontend. Lint rule opcional.

---

### 5.2 — Hooks con duplicación potencial (P2)

`lib/hooks/`:
- `use-dashboard.ts` + `use-dashboard-kpis.ts` — ¿uno calls al otro? ¿Misma data fetched dos veces?
- `use-designs.ts` + `use-designs-filters.ts` + `use-designs-table.ts` + `use-my-week.ts` — todos consumen designs API. ¿Deduplicación SWR adecuada?

**A verificar**: trazar qué endpoint hitean, si SWR hace dedup, si hay race conditions.

---

### 5.3 — API routes sin validación de input explícita (P1, PATRÓN)

`app/api/designs/*` rutas:
- `bulk/route.ts` (8879b) — recibe payload de creación masiva, ¿valida?
- `[id]/status/route.ts` — cambio de status
- `[id]/assignee/route.ts` — cambio de asignado
- `assign/route.ts` — auto-assign
- `route.ts` — list/create
- `[id]/route.ts` — get/update/delete

**A verificar**: si usan zod / yup / valibot. Si no, la API es vulnerable a payloads malformed.

---

### 5.4 — `auth-context.tsx` (7362b) con lógica densa (P1)

Auth context maneja: refresh session, fetch profile, listeners, retry, persistence. Mucho en un archivo. **A verificar**: si el manejo de errores es completo, si hay race conditions, si los listeners se limpian bien.

---

### 5.5 — `mi-semana/page.tsx` (13418b) sin tocar (P0 después de sidebar)

Es la página principal del diseñador y es un monolito grande. Potencial mezcla de fetching + filtering + render como las otras pages que ya rompimos.

**Fix**: extraer hooks de filtering / sorting, sub-componentes para secciones (hoy / semana / siguientes).

---

### 5.6 — `ajustes/usuarios/page.tsx` (9790b) sin tocar (P1)

Lista de usuarios + invitaciones. Probable monolito similar.

---

### 5.7 — `disenos/page.tsx` (9648b) refactor parcial (P1)

Aunque ya extrajimos `useDesignsFilters`, `useDesignsTable`, `DesignsFilters`, `DesignsTable`, la página principal sigue grande. **A verificar**: qué queda de UI inline.

---

### 5.8 — Login/invite/reset-password pages no tocadas (P2)

`app/(auth)/login/page.tsx` (8475b), `invite/[token]/page.tsx` (8093b), `reset-password/page.tsx` — UI auth con formularios extensos. Pueden compartir primitivas (`<AuthForm>`).

---

### 5.9 — `Skeletons` posiblemente desincronizados con sus pages (P2)

8 skeletons (`components/skeletons/*`). **A verificar**: si reproducen estructura real o mienten (causando "layout shift" cuando carga el contenido).

Ya identificado: `design-detail-skeleton.tsx` tenía la sección de Comments (la quité), pero el design real ya no tiene comments.

---

### 5.10 — TypeScript: estricto sin `any` ni `as any` aparentes (P3)

Búsqueda 0 resultados de `as any`, `: any`, `<any>`. Buena señal.

**A verificar mejor**: `tsconfig.json` tiene `strict: true` y `noUncheckedIndexedAccess: true`?

---

### 5.11 — Accesibilidad — sin audit profundo aún (P? por verificar)

Por verificar:
- Contraste WCAG AA: paleta `--primary` (dorado) sobre `--primary-foreground` (charcoal) en light mode tiene contraste **bajo**. Probable fail AA.
- Focus visible: button.tsx tiene `focus-visible:ring-2 focus-visible:ring-primary` — bien.
- Labels en forms — sin verificar.
- ARIA en sidebar collapsed/expanded — sin verificar.
- Keyboard nav en tablas, dialogs — sin verificar.

**A hacer**: pasada de a11y específica con axe o herramienta similar.

---

### 5.12 — Convenciones — file structure consistente (P3)

`components/{ui,layout,features,skeletons}` consistent. `lib/{hooks,utils,services,supabase,auth,types}` consistent. `app/{(auth),(dashboard),api}` consistent.

**Excepción**: `components/invitations/` aislado del resto. Probable mover a `components/features/invitations/` o `components/features/team/invitations/`.

---

## Conclusión cross-cutting

**Patrones principales** (en orden de impacto):
1. **Bracket syntax `[hsl(var(--status-*))]`** — 30 ocurrencias, fix en Capa 1 limpia todo
2. **Tailwind colors directas (gray, white, black)** — 5 archivos, manual swap
3. **console.* directo en lugar de logger** — 4 archivos críticos (auth, middleware, hooks)
4. **Sidebar tokens isla** — fix en Capa 3 (shadcn migration) limpia todo
5. **Páginas grandes sin extraer** (mi-semana, usuarios, login, invite) — extracción manual

---

# Plan de remediación priorizado

## Fase 0 — Cimientos del design system (días 1-2)

1. **Eliminar `gold-*` palette** del Tailwind config; migrar usos a `primary/N`. (~30 min)
2. **Exponer `status-*` en Tailwind config**; migrar 30 ocurrencias bracket syntax. (~1h grep+replace)
3. **Declarar `--font-mono` en `:root` + `.dark`** explícito. (~5 min)
4. **Tintar `--card` hacia warm**. (~5 min visual check)
5. **Actualizar comentario header** de globals.css. (~5 min)
6. **Verificar contraste light primary/primary-foreground** (axe / WCAG AA). Ajustar si fail.
7. **Type-check + lint + visual smoke test**.

## Fase 1 — Migrar Sidebar a shadcn (día 3)

1. Instalar shadcn sidebar deps (`@radix-ui/react-tooltip`, hooks de shadcn).
2. Generar componente Sidebar de shadcn (`npx shadcn add sidebar`).
3. Eliminar tokens `--sidebar-*` ad-hoc. Usar los `--sidebar-*` que aporta shadcn (con sus convenciones).
4. Reemplazar `components/layout/sidebar.tsx` por composición de primitivas shadcn (`SidebarProvider`, `Sidebar`, `SidebarMenu`, etc.).
5. Migrar `app-layout.tsx` para usar `<SidebarProvider>` y `<SidebarInset>` en lugar de `fixed`+`ml-*`.
6. Validar visualmente (light/dark, expanded/collapsed, mobile drawer).

## Fase 2 — Tokens hardcoded en feature components (día 4)

1. Reemplazar `text-gray-*`, `bg-white`, `text-white` en los 5 archivos identificados.
2. Verificar dark mode en cada uno.

## Fase 3 — Logger consistente (día 4)

1. Migrar console.log/error/warn de auth-context, middleware, use-user-preferences a `logger.*`.

## Fase 4 — Páginas pendientes de descomponer (días 5-6)

1. `mi-semana/page.tsx` — extraer hooks + sub-componentes.
2. `ajustes/usuarios/page.tsx` — extraer.
3. `(auth)/*` — primitiva `<AuthForm>` compartida.

## Fase 5 — API routes con validación (días 7-8)

1. Añadir `zod` (o similar).
2. Validar payloads en cada `app/api/designs/*/route.ts`.
3. Tipar errores consistentes.

## Fase 6 — A11y pass (día 9)

1. Audit con `@axe-core/react` o similar.
2. Fix WCAG AA fallos.
3. Keyboard nav verificación.

## Fase 7 — Estética final (días 10-12)

Solo después de los cimientos:
- Sidebar bonita
- Dashboard charcoal authority pulido
- /disenos vista calendario
- Mobile pass
- Replicar lenguaje en resto de pantallas

---

## Lo que NO hago en este audit

- Migrations DB y supabase functions: anotadas pero patrimonio histórico, no re-arquitecturo.
- Tests: no hay infra de tests aún. Si quieres añadir, fase aparte.
- Performance profiling: solo si hay queja. Por ahora 8 personas en interno, no urge.
- Bundle analysis: igual.

---

## Próximas decisiones para ti

1. **¿Plan de remediación validado?** ¿Te encaja el orden Fase 0 → Fase 7?
2. **¿Algo OFF-LIMITS?** (no tocar `auth-context.tsx`, no tocar API routes, etc.)
3. **¿Empezamos por Fase 0 (cimientos)?** — el fix de gold + status + tokens limpia muchos puntos a la vez y deja base sólida.
4. **¿Migración shadcn Sidebar como Fase 1?** — confirmas que vamos por shadcn (vs refactor manual).

---

# Mini-audit complementario (zonas críticas)

## A. `lib/auth/auth-context.tsx` (218 líneas)

### A.1 — `console.*` directo, no `logger` (P1, ya identificado en 5.1)
~10 ocurrencias. En producción, esos logs filtran info al usuario. `lib/utils/logger.ts` existe; usarlo.

### A.2 — `localStorage.clear()` + `sessionStorage.clear()` en logout (P0)
Línea 185-186: `localStorage.clear()` y `sessionStorage.clear()` borran **toda** la storage, no solo auth tokens. Esto destruye:
- `theme` (next-themes) → user pierde su preferencia light/dark
- `sidebar-collapsed` → estado del sidebar
- Cualquier cache SWR persistente
- Cualquier preferencia que añadamos en el futuro

**Fix**: borrar solo claves auth (`sb-*`) o usar Supabase signOut sin clear manual.

### A.3 — Comparación de profile manual (P2)
Líneas 109-114: comparación campo a campo (`isSameProfile`). Si añadimos un campo a `Profile`, hay que tocar esta comparación. Frágil.

**Fix**: usar deep-equal o JSON.stringify (suficiente con 4 fields).

### A.4 — `supabase = createClient()` dentro del componente (P2)
Línea 54: cada render llama `createClient()`. Si retorna singleton no hay problema, si retorna nueva instancia, `useEffect` con dep `[supabase.auth]` y `useCallback` con dep `[supabase]` re-corren cada render.

**A verificar**: que `createClient` cachee internamente. En `lib/supabase/client.ts`.

### A.5 — Sin manejo de race conditions en logout vs in-flight requests (P2)
Si user clickea logout mientras hay fetches pendientes, esos fetches resuelven después del `setState({ status: UNAUTHENTICATED })`. Componentes pueden ver estado zombi.

**Fix mínimo**: AbortController o flag `isMounted`. No urgente — pasa raramente y no rompe nada visible.

---

## B. API routes (`app/api/designs/*`)

### B.1 — **NINGUNA validación con zod o similar** (P0, PATRÓN)

Validación manual en cada route:
- `bulk/route.ts`: chequeo de campos requeridos, **NO** valida tipos (ej. `deadline_at` puede ser cualquier string).
- `[id]/route.ts` PUT: spread `{ ...body }` directo al `update`. **Cliente puede modificar campos arbitrarios** (`created_by`, `id`, lo que sea).
- `[id]/status/route.ts`: valida que `status` esté presente, **NO** valida que sea `BACKLOG`|`DELIVERED`. Cliente puede mandar `status: "ANYTHING"`.
- `[id]/assignee/route.ts`: NO valida que `designer_id` corresponda a un usuario con rol DESIGNER.

**Severidad**: P0 porque es un agujero de seguridad. Aunque RLS de Supabase puede restringir parte, los API routes operan con el cliente del usuario y no garantizan validación.

**Fix**: añadir `zod` y schemas por endpoint. Inferir tipos de los schemas.

### B.2 — Mass update vulnerability en `PUT /api/designs/:id` (P0)

Línea 77 en `[id]/route.ts`: `const updateData = { ...body };`. Cliente envía cualquier campo y se pasa directo a Supabase update. **Permite modificar `created_by`, `id`, etc.** que probablemente RLS no protege.

**Fix urgente**: whitelist explícita de campos modificables (`title`, `player`, `match_home`, `match_away`, `deadline_at`, `folder_url`, `player_status`).

### B.3 — Branch deprecated dentro de PUT (P1)

Línea 81: `console.warn('[DEPRECATED] PUT /api/designs/:id status update...')`. Está documentando que está deprecated, pero el código sigue ahí. **Decisión pendiente**: borrarlo o mantener compatibilidad.

**Fix**: si nadie lo usa hoy, eliminar el branch de status del PUT genérico. Solo `/status` lo maneja.

### B.4 — Inconsistencia en algoritmo de asignación (P1)

Existen **dos** implementaciones de "calcular diseñador con menos carga":
- `lib/services/designs/assignment.ts` (round-robin con priority por carga, devuelve uno).
- `app/api/designs/bulk/route.ts` líneas 132-156 (round-robin in-place que mantiene contador local entre iteraciones).

Bulk es más eficiente (1 fetch de cargas, N selecciones in-place). El servicio externo es más lento (N fetches).

**Fix**: extraer `selectDesignerByLoad()` que reciba "cargas actuales" y devuelva el siguiente. Bulk lo usa con su mapa local. `assignDesignerAutomatically` lo usa con un mapa freshly fetched. Una sola fuente de algoritmo.

### B.5 — `assign/route.ts` con N round-trips (P2)

Líneas 50-62: para cada diseño no asignado, `await assignDesignerAutomatically()` que **re-fetcha cargas**. Si hay 30 unassigned, son 30 fetches secuenciales.

**Fix**: misma lógica que bulk — fetch carga 1 vez, distribuir in-memory, batch update.

### B.6 — Errores leak Supabase messages (P2)

Múltiples routes hacen `return NextResponse.json({ error: error.message })`. El `error.message` de Supabase puede contener detalles de schema, RLS, índices. En producción mejor mapear a mensajes genéricos.

**Fix**: helper `mapError(error): { status, message }` que en prod oculta detalles, en dev los muestra.

### B.7 — Sin rate limiting (P3)

Bulk endpoint puede aceptar cientos de diseños sin throttle. Para un equipo interno de 8 personas no es problema crítico, pero documentar.

---

## C. Hooks de fetching

### C.1 — `useDashboard`, `useDesigns`, `useMyWeek` con `fetcher` duplicado (P2)

Cada uno define su propio:
```ts
const fetcher = async (url) => { ... };
```

Idénticos entre los tres. **Fix**: `lib/utils/api-fetcher.ts` con `defaultFetcher` exportado.

### C.2 — Sin coordinación entre hooks que tocan el mismo endpoint (P3)

Los tres pegan a `/api/designs?weekStart=...&weekEnd=...&...`. SWR deduplica por URL idéntica, pero las URLs varían en query params (status, designerId).

**Trade-off**: la diferencia de params es intencional (filtrado distinto). Ahora bien, podría unificarse a `useDesignsRange({ weekStart, weekEnd, filters })` que cubra los 3 casos.

**No urgente** mientras los 3 hooks sean simples.

### C.3 — Sin `swr-config` global con defaults (P2)

Cada hook usa SWR con defaults. No hay `<SWRConfig>` global que centralice:
- `revalidateOnFocus`
- `errorRetryCount`
- `dedupingInterval`
- error handler centralizado

**Fix**: `components/providers/swr-provider.tsx` ya existe — confirmar qué config tiene. Probable que esté vacío.

### C.4 — `useDashboardKPIs` no fetcha, solo deriva (P3 OK)

Es un useMemo bien hecho. No hay duplicación con useDashboard. OK.

---

## D. `lib/services/designs/assignment.ts`

### D.1 — Race condition en asignación concurrente (P1)

Si 2 requests simultáneos llaman `assignDesignerAutomatically()`:
- Ambos leen `taskCounts` en el mismo snapshot.
- Ambos eligen al diseñador con menos carga (mismo).
- Ambos asignan a ese mismo diseñador.
- Resultado: doble carga al mismo, desbalance.

**Fix**: usar transacciones o lock optimista. Para 8 personas y 60 diseños/semana, probable que ocurra rara vez. Pero estructurahmente es un bug.

### D.2 — Lógica round-robin "incompleta" (P2)

`assignDesignerAutomatically` devuelve **uno** con la menor carga, pero si hay empate (varios con carga `0`), siempre elige el `designers[0]` (orden indeterminado). Esto desbalance subgrupos.

`bulk/route.ts` lo hace mejor (mantiene `nextIndex` entre llamadas para round-robin real).

**Fix**: extraer función común que reciba "estado de round-robin" como parámetro. Usar en ambos sitios.

### D.3 — Solo log, no error response (P3)

Si falla, devuelve `null`. El caller debe manejar. El callsite `[id]/route.ts` lo hace, `[id]/assignee/route.ts` también, `assign/route.ts` cuenta cuántos asignó.

OK pero el contrato podría ser más explícito (`Result<string, Error>` pattern). No urgente.

---

## Conclusión mini-audit

**Hallazgos críticos nuevos (P0)**:
- **Mass update vulnerability** en `PUT /api/designs/:id` — cliente puede modificar campos arbitrarios.
- **Sin validación de payloads** en API routes (zod ausente).
- **`localStorage.clear()` en logout** destruye preferencias no relacionadas con auth.

**P1 nuevos**:
- Branch deprecated PUT/status sin decisión
- Inconsistencia algoritmo asignación (2 implementaciones)
- Race condition asignación
- Console.* directos en auth-context (ya estaba en P1)

**P2 nuevos**:
- `assign/route.ts` con N round-trips
- Errores leak Supabase messages
- `fetcher` duplicado en 3 hooks
- Sin SWR config global
- Algoritmo round-robin incompleto (empates)

## Plan de remediación actualizado

Inserto **Fase 0.5 — Seguridad API** entre Fase 0 y Fase 1, porque los P0 nuevos son agujeros de seguridad:

### Fase 0.5 — Seguridad API (1 día)

1. Instalar `zod`.
2. Crear `lib/api/schemas.ts` con schemas por endpoint:
   - `createDesignSchema`, `bulkCreateDesignsSchema`
   - `updateDesignSchema` (whitelist)
   - `updateStatusSchema` (enum BACKLOG/DELIVERED)
   - `updateAssigneeSchema` (UUID + verifica rol DESIGNER)
3. Migrar cada route a `parse` con schema.
4. **Whitelist explícita** en PUT genérico — no pasar `{ ...body }`.
5. Helper `mapError` para no leak Supabase messages.
6. **`localStorage.clear()` → eliminar solo `sb-*`** keys.
7. Type-check + lint + smoke test cada endpoint con curl.

### Fase 0.5b — Algoritmo asignación unificado (medio día)

1. Extraer `selectDesignerByLoad(loads, lastIndex?) -> { id, nextIndex }` puro.
2. Refactorizar `bulk/route.ts` y `assignDesignerAutomatically` para usarlo.
3. `assign/route.ts` cambia a fetch carga 1 vez + distribuir in-memory + batch update.
4. Documentar que sigue habiendo race window pero acotada.
