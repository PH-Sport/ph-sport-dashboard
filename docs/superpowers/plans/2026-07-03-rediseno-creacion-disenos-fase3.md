# Rediseño de creación de diseños — Fase 3: taller de tarjetas (sin IA) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sustituir el alta actual (tabs "Manual/Asistente (Pronto)" + tabla de lote) por un **taller de tarjetas**: una lista de tarjetas de diseño colapsables/editables que funciona completa por sí sola (añadir, editar, confirmar), con el campo `details` cableado de punta a punta y el peso de cada pieza visible. La barra del agente NO existe en esta fase (llega con la Fase 4).

**Architecture:** Un modelo puro `DesignCard` (en `lib/utils/design-cards.ts`, testeado con Vitest) reemplaza a `BulkDesignRow`/`SingleDesignFormData` como única representación del formulario, tanto en creación (N tarjetas → POST bulk) como en edición (1 tarjeta → PUT). Un componente `DesignCardItem` (cabecera colapsada + editor desplegado con `<Collapse>`) reemplaza a `design-form-bulk.tsx` y `design-form-single.tsx`, orquestado desde `create-design-dialog.tsx` que conserva su API pública (`open`, `design`, `activeWeekStart/End`, `onDesignCreated`).

**Tech Stack:** Next.js 15 / React 18 / TypeScript / Zod / framer-motion (SPRINGS + `<Collapse>`) / Vitest (solo lógica pura) / shadcn (Select, Input, Textarea, Button, Dialog, Badge).

## Global Constraints

- **Estética:** tokens existentes (Charcoal Authority). Dorado (`primary`) SOLO en CTA/selección/focus. NADA de glass charcoal en este flujo. Movimiento: `<Collapse>` de `components/ui/collapse.tsx` para desplegar; `SPRINGS.snappy` para el chevron; `AnimatePresence` para añadir/quitar tarjetas. Números y fechas en mono (`.mono` / `font-mono tabular`).
- **Ruido mínimo (feedback del usuario 2026-07-03):** el editor desplegado muestra SOLO: tipo, jugador, partido (solo matchday), entrega, diseñador y detalles. El título NO es un campo permanente: es la cabecera autogenerada, editable bajo demanda (botón lápiz). `folder_url` queda tras un disclosure discreto ("Carpeta de Drive"). Nada más.
- **Sin IA ni teasers:** el strip de tabs "Manual / Asistente (Pronto)" desaparece por completo. No se añade compositor ni botón deshabilitado.
- **`details` de punta a punta:** columna ya existe (Fase 1, migración 039). Esta fase la cablea: schema bulk + schema update + insert en bulk route + tarjeta (creación y edición) + bloque "Detalles" en `design-detail-sheet.tsx`.
- **Título autogenerado:** matchday con ambos equipos → `"{home} vs {away} — {player}"` (sin ` — {player}` si player vacío); resto → `"{DESIGN_TYPE_LABELS[type]} — {player}"` (solo label si player vacío); sin tipo → `''`. El payload manda el título efectivo (editado si `titleEdited`, si no el auto); la ruta bulk ya cae a `player` si llega vacío.
- **`designer_id` en payload de creación:** `card.designer_id || undefined` (la ruta bulk interpreta ausencia/'auto' como asignación automática ponderada — Fase 2, no se toca).
- **No tocar:** `app/api/designs/assign`, `lib/services/designs/*` (asignación ponderada F2), `select-designer.ts`, `weekly-load.ts`, migraciones.
- **Vitest solo para lógica pura** (`design-cards.ts`). Componentes/diálogo: type-check + lint + build + navegador.
- Commits por tarea en español, staging por rutas explícitas (nunca `git add -A`). Trabajo en worktree nuevo `worktree-rediseno-creacion-disenos-fase3-4` (compartido con la Fase 4, que se ejecuta a continuación en la misma rama).

## File Map

- Create: `lib/utils/design-cards.ts`, `lib/utils/design-cards.test.ts`, `components/features/designs/cards/weight-chip.tsx`, `components/features/designs/cards/design-card-item.tsx`
- Modify: `lib/api/schemas.ts`, `app/api/designs/bulk/route.ts`, `lib/hooks/use-design-submit.ts`, `components/features/designs/dialogs/create-design-dialog.tsx`, `components/features/designs/design-detail-sheet.tsx`, `lib/utils/design-form.ts`
- Delete (Task 4): `components/features/designs/dialogs/design-form-single.tsx`, `components/features/designs/dialogs/design-form-bulk.tsx`

---

### Task 1: Modelo `DesignCard` + `details` de punta a punta (TDD)

**Files:**
- Create: `lib/utils/design-cards.ts`, `lib/utils/design-cards.test.ts`
- Modify: `lib/api/schemas.ts` (~línea 28-48 y 56-68), `app/api/designs/bulk/route.ts` (objeto de insert, ~línea 99-111)

**Interfaces:**
- Consumes: `DesignType`, `DESIGN_TYPE_LABELS`, `getDesignWeightValue` de `@/lib/types/design`; `generateId` de `@/lib/utils/design-form`; tipo `Design` de `@/lib/types/design`.
- Produces (lo que consumen las Tasks 2-4):

```ts
export interface DesignCard {
  id: string;
  type: DesignType | null;        // null = sin elegir (no válido para crear)
  player: string;
  match_home: string;
  match_away: string;
  deadline_at: Date | undefined;
  designer_id: string | null;     // null = automático
  folder_url: string;
  details: string;
  title: string;                  // solo relevante cuando titleEdited
  titleEdited: boolean;
  source: 'manual' | 'ia';        // 'ia' lo usará la Fase 4
  warnings: string[];             // avisos del agente (F4); [] en manual
}

export function createEmptyCard(): DesignCard;              // source 'manual', type null, warnings []
export function autoTitleFor(card: DesignCard): string;     // reglas de Global Constraints
export function effectiveTitle(card: DesignCard): string;   // titleEdited && title.trim() ? title.trim() : autoTitleFor(card)
export function isCardEmpty(card: DesignCard): boolean;     // sin tipo, textos vacíos (trim), sin fecha, sin titleEdited
export function isCardValid(card: DesignCard): boolean;     // type !== null && player.trim() && deadline_at && (matchday → ambos equipos)
export function cardsWeight(cards: DesignCard[]): number;   // suma getDesignWeightValue(type) de las tarjetas con tipo
export function cardToBulkPayload(card: DesignCard): object; // ver Step 3
export function designToCard(design: Design): DesignCard;   // para modo edición (Task 4)
```

- [ ] **Step 1: Tests (RED)** — `lib/utils/design-cards.test.ts` con Vitest. Casos mínimos:
  - `autoTitleFor`: matchday con equipos y jugador → `'Espanyol vs Getafe — Joan García'`; matchday con equipos sin jugador → `'Espanyol vs Getafe'`; `fichaje` con jugador → `'Fichajes — Marc Bernal'` (usa el label REAL de `DESIGN_TYPE_LABELS`, léelo del código, no lo inventes); tipo null → `''`.
  - `effectiveTitle`: con `titleEdited` y título con espacios → trim del editado; `titleEdited` pero título en blanco → cae al auto.
  - `isCardValid`: matriz — sin tipo ✗; con tipo sin player ✗; matchday sin visitante ✗; matchday completo ✓; `cv` con player+fecha ✓ (sin equipos).
  - `isCardEmpty`: `createEmptyCard()` ✓; con solo type elegido ✗.
  - `cardsWeight([matchday, cv, sin tipo])` → 5.
  - `cardToBulkPayload`: mapea trims, `deadline_at.toISOString()`, `designer_id: null → undefined`, `details: '' → undefined`, equipos solo en matchday, `title` = efectivo o `undefined` si `''`.
  - `designToCard`: con un `Design` de título igual al auto → `titleEdited false`; con título personalizado → `titleEdited true`; `details` null → `''`.
- [ ] **Step 2: Run `npm test`** — FAIL (módulo no existe).
- [ ] **Step 3: Implementar `design-cards.ts` (GREEN)** con las firmas de arriba. `cardToBulkPayload` devuelve:

```ts
{
  type: card.type!,
  title: effectiveTitle(card) || undefined,
  player: card.player.trim(),
  match_home: card.type === 'matchday' ? card.match_home.trim() : undefined,
  match_away: card.type === 'matchday' ? card.match_away.trim() : undefined,
  deadline_at: card.deadline_at!.toISOString(),
  designer_id: card.designer_id || undefined,
  folder_url: card.folder_url.trim() || undefined,
  details: card.details.trim() || undefined,
}
```

- [ ] **Step 4: `lib/api/schemas.ts`** — en `bulkDesignItemSchema` añade `details: z.string().trim().max(2000).optional(),` (tras `folder_url`); en `updateDesignSchema` añade `details: z.string().trim().max(2000).nullable().optional(),`. El PUT copia claves whitelisted en bucle, así que `details` fluye solo.
- [ ] **Step 5: `app/api/designs/bulk/route.ts`** — en el objeto de `designsToInsert` añade `details: d.details || null,` (junto a `folder_url`).
- [ ] **Step 6: Verificar** — `npm test` (verde), `npm run type-check`, `npm run lint`, `npm run build`.
- [ ] **Step 7: Commit** — `git add lib/utils/design-cards.ts lib/utils/design-cards.test.ts lib/api/schemas.ts app/api/designs/bulk/route.ts` → `feat(designs): modelo de tarjeta de diseño y details de punta a punta`

---

### Task 2: `WeightChip` + `DesignCardItem`

**Files:**
- Create: `components/features/designs/cards/weight-chip.tsx`, `components/features/designs/cards/design-card-item.tsx`

**Interfaces:**
- Consumes: `DesignCard`, `autoTitleFor`, `effectiveTitle` (Task 1); `DESIGN_TYPES`, `DESIGN_TYPE_LABELS`, `DESIGN_TYPE_WEIGHT`, `getDesignWeightValue`, `typeHasMatch` de `@/lib/types/design`; `Collapse` de `@/components/ui/collapse`; `SPRINGS` de `@/components/ui/animations`; `DateTimePicker` de `@/components/ui/date-time-picker`; shadcn `Select/Input/Textarea/Button/Label`; `Designer` de `@/lib/hooks/use-designers` (`{ id, name, displayName }`); `format` + locale `es` de date-fns.
- Produces:

```ts
// weight-chip.tsx
export function WeightChip({ type }: { type: DesignType | null }): JSX.Element;
// type null → chip punteado de aviso "Sin tipo" (text-status-warning, border-dashed)
// con tipo → píldora: label + número de peso en mono, coloreada por DESIGN_TYPE_WEIGHT:
//   RAPIDA → text-status-success bg-status-success/10
//   MEDIA  → text-status-warning bg-status-warning/10
//   PESADA → text-status-error  bg-status-error/10

// design-card-item.tsx
export interface DesignCardItemProps {
  card: DesignCard;
  index: number;                       // 1-based, se muestra "01", "02"… en mono
  open: boolean;
  onToggle: () => void;
  onChange: (patch: Partial<DesignCard>) => void;
  onRemove: () => void;
  canRemove: boolean;
  designers: Designer[];
  loadingDesigners: boolean;
  outsideWeek: boolean;                // el diálogo lo calcula con isOutsideWeek
}
export function DesignCardItem(props: DesignCardItemProps): JSX.Element;
```

- [ ] **Step 1: `weight-chip.tsx`** según contrato de arriba. Píldora `rounded-full text-xs font-medium px-2.5 py-0.5 inline-flex items-center gap-1.5`, número de peso en `font-mono text-[10px]`.
- [ ] **Step 2: `design-card-item.tsx` — cabecera colapsada.** Contenedor: `rounded-xl border border-border bg-card` (hover sombra sutil; con `open`, borde algo más marcado). Cabecera clicable entera (`cursor-pointer`, `aria-expanded`): índice mono muted → columna con (a) título efectivo en `text-sm font-medium truncate` o placeholder muted "Nuevo diseño" si `''`, y (b) fila meta con `WeightChip`, diseñador (displayName o "Auto") y fecha `format(deadline_at, 'dd MMM HH:mm', { locale: es })` en mono muted (u "sin fecha"), badge "Agente" si `source === 'ia'`, chip ámbar "Fuera de semana" si `outsideWeek`, y un chip ámbar por cada `warnings` → chevron a la derecha rotando 90° con `motion` + `SPRINGS.snappy`.
- [ ] **Step 3: editor desplegado** dentro de `<Collapse open={open}>`, separado por `border-t border-border/60`, padding alineado con el contenido de la cabecera:
  - **Fila 1 (grid responsive):** Tipo — `Select` con los 14 `DESIGN_TYPES`, cada `SelectItem` con puntito coloreado por peso (mismos colores del chip) + `DESIGN_TYPE_LABELS[t]` + peso en mono (`· 1`). Jugador — `Input`. Si `typeHasMatch(card.type)`: Local y Visitante — `Input`s. Entrega — `DateTimePicker`. Diseñador — `Select` ("Automático" + designers; `loadingDesigners` → item disabled "Cargando…").
  - **Fila 2:** Detalles — `Textarea` de 2 filas, placeholder "Rival, motivo, detalle de la pieza…".
  - **Fila 3 (discreta, ghost):** botón "Carpeta de Drive" (icono Link2) que despliega con `<Collapse>` un `Input type="url"` — si `folder_url` ya trae valor, el input arranca visible; botón "Título" (icono Pencil) que despliega un `Input` con el título efectivo + badge mono `auto`/`editado` (`onChange` → `{ title, titleEdited: value.trim() !== '' }`; al vaciarlo, `titleEdited: false` y vuelve el auto); y a la derecha "Quitar" (ghost, `text-destructive`, icono Trash2, `disabled={!canRemove}`).
  - Al cambiar el tipo desde matchday a otro, los inputs de equipos desaparecen (el estado conserva los valores; el payload ya los omite).
- [ ] **Step 4: Verificar** — `npm run type-check && npm run lint && npm run build` (el componente aún no se usa; debe compilar y no romper lint).
- [ ] **Step 5: Commit** — `git add components/features/designs/cards/weight-chip.tsx components/features/designs/cards/design-card-item.tsx` → `feat(designs): tarjeta de diseño desplegable con peso visible`

---

### Task 3: Integración en el diálogo — modo creación

**Files:**
- Modify: `components/features/designs/dialogs/create-design-dialog.tsx`, `lib/hooks/use-design-submit.ts`

**Interfaces:**
- Consumes: Task 1 (`DesignCard`, `createEmptyCard`, `isCardValid`, `cardsWeight`, `cardToBulkPayload`) y Task 2 (`DesignCardItem`). `isOutsideWeek` sigue viniendo de `@/lib/utils/design-form`.
- Produces: `useDesignSubmit` cambia su contrato a `{ design?, cards: DesignCard[], onSuccess }` (la Task 4 usa el mismo hook para edición).

- [ ] **Step 1: `use-design-submit.ts`** — sustituye `formData`/`bulkRows` por `cards: DesignCard[]`:
  - **Creación:** `validCards = cards.filter(isCardValid)`; validación "fecha > hace 1h" igual que hoy (mensaje con `effectiveTitle(card) || card.player`); POST `/api/designs/bulk` con `{ designs: validCards.map(cardToBulkPayload) }`. Toasts idénticos a los actuales.
  - **Edición (la usa Task 4, déjala lista ya):** usa `cards[0]`; si `!card.deadline_at` → toast "Selecciona una fecha de entrega"; PUT `/api/designs/{design.id}` con:

```ts
{
  type: card.type ?? 'matchday',
  title: effectiveTitle(card) || card.player.trim(),
  player: card.player.trim(),
  match_home: card.type === 'matchday' ? card.match_home : null,
  match_away: card.type === 'matchday' ? card.match_away : null,
  folder_url: card.folder_url.trim() || null,
  deadline_at: card.deadline_at.toISOString(),
  designer_id: card.designer_id || null,
  details: card.details.trim() || null,
}
```

- [ ] **Step 2: `create-design-dialog.tsx` — estado y layout (modo creación).** Sustituye `bulkRows`/`formData` por `cards: DesignCard[]` + `openId: string | null` (UNA tarjeta abierta a la vez; toggle sobre la abierta la cierra). Estado inicial creación: `[createEmptyCard()]` con esa tarjeta abierta. `addCard()` añade una vacía, la abre y hace scroll al final del contenedor. Elimina por completo el strip de tabs "Manual / Asistente (Pronto)" (y los imports `Hint`/`Sparkles` si quedan huérfanos), el uso de `DesignFormBulk` y los botones "+1/+5/+10 Filas". Lista: `cards.map(...)` con `<DesignCardItem>` dentro de `AnimatePresence` (entrada `opacity/y` con `SPRINGS.smooth`, sin rebote), seguida del botón "Añadir diseño" (ancho completo, `border-dashed rounded-xl`, ghost, icono Plus). Mantén el banner agregado de "fuera de la semana visible" calculado ahora sobre `cards` válidas. `DialogContent` creación: `w-[92vw] max-w-[920px] h-[80vh] max-h-[780px]`.
- [ ] **Step 3: pie del diálogo (creación).** Izquierda: `"{n} diseños · peso {cardsWeight(cards)}"` en text-xs mono muted + `"· {k} incompletos"` en `text-status-warning` si hay tarjetas no vacías y no válidas. Derecha: Cancelar + `Crear {validCount} Diseño{s}` (disabled si 0), mismo flujo `useConfirm` actual.
- [ ] **Step 4: Verificar** — `npm run type-check && npm run lint && npm run build`. OJO: hasta la Task 4 el modo edición sigue usando `DesignFormSingle` — mantenlo compilando (el hook nuevo ya soporta ambos modos; adapta la llamada del modo edición construyendo la card con `designToCard(design)` SOLO si es más simple que mantener temporalmente el form viejo; si mantienes el form viejo este task, no rompas su submit).
- [ ] **Step 5: Commit** — `git add components/features/designs/dialogs/create-design-dialog.tsx lib/hooks/use-design-submit.ts` → `feat(designs): el alta pasa a taller de tarjetas (modo creación)`

---

### Task 4: Edición como tarjeta única + retirada de los formularios antiguos

**Files:**
- Modify: `components/features/designs/dialogs/create-design-dialog.tsx`, `components/features/designs/design-detail-sheet.tsx`, `lib/utils/design-form.ts`
- Delete: `components/features/designs/dialogs/design-form-single.tsx`, `components/features/designs/dialogs/design-form-bulk.tsx`

**Interfaces:**
- Consumes: `designToCard` (Task 1), `DesignCardItem` (Task 2), hook adaptado (Task 3).

- [ ] **Step 1: modo edición en el diálogo.** Cuando `design` llega: `cards = [designToCard(design)]`, abierta por defecto, `canRemove: false`, sin botón "Añadir diseño" ni compositor de conteo; pie igual que hoy (Cancelar + "Guardar Cambios" con confirm). `DialogContent` edición: mantiene `max-w-2xl overflow-y-auto` (la tarjeta única cabe). El aviso `editDeadlineOutsideWeek` existente pasa como `outsideWeek` de la tarjeta.
- [ ] **Step 2: borrar `design-form-single.tsx` y `design-form-bulk.tsx`** y todo import suyo. Grep de `DesignFormSingle|DesignFormBulk|SingleDesignFormData|BulkDesignRow|createEmptyRow|isRowValid|isRowEmpty` en todo el repo: cero referencias vivas fuera de `design-form.ts`.
- [ ] **Step 3: limpiar `lib/utils/design-form.ts`** — deja SOLO `generateId` e `isOutsideWeek` (verifica con grep que nada más se usa; si el calendario u otro fichero importa algo más, consérvalo y anótalo en el reporte).
- [ ] **Step 4: `design-detail-sheet.tsx`** — añade un bloque "Detalles" (label muted + `<p className="text-sm whitespace-pre-wrap">`) visible solo si `design.details` tiene contenido, junto al resto de metadatos.
- [ ] **Step 5: Verificar** — `npm test && npm run type-check && npm run lint && npm run build`.
- [ ] **Step 6: Commit** — `git add -u components/features/designs/ lib/utils/design-form.ts && git add components/features/designs/design-detail-sheet.tsx` (ajusta a las rutas exactas tocadas/borradas; `git rm` para los borrados) → `feat(designs): edición como tarjeta única y retirada del formulario antiguo`

---

### Task 5: Verificación final de la Fase 3

**Files:** ninguno nuevo.

- [ ] **Step 1:** `npm test && npm run type-check && npm run lint && npm run build` — todo verde.
- [ ] **Step 2 (navegador, `npm run build && npm run start`, como admin — CUIDADO: Supabase de PRODUCCIÓN):**
  1. "Crear Diseños" → aparece 1 tarjeta en blanco abierta; el strip de tabs ya no existe.
  2. Elegir tipo → chip de peso se colorea; escribir jugador → el título de la cabecera se compone solo; editar título a mano → badge `editado`.
  3. Crear UN diseño de prueba real (matchday, título "PRUEba F3 — borrar", fecha esta semana) → confirmar → aparece en la tabla.
  4. Editarlo: diálogo = tarjeta única con sus datos; añadir texto en Detalles; guardar; abrir el detail-sheet y ver el bloque "Detalles".
  5. **Borrar el diseño de prueba** (dejar producción limpia).
- [ ] **Step 3:** actualizar el ledger de progreso. La Fase 4 continúa en la misma rama.
