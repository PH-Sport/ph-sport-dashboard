# Rediseño de creación de diseños — Fase 1: modelo de datos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ampliar `designs.type` de 3 a 14 tipos de pieza con peso (Rápida/Media/Pesada), eliminar `player_status` de punta a punta, y añadir las columnas de datos (`designs.details`, `profiles.weekly_capacity`) que las fases 2-5 van a consumir — sin tocar todavía el flujo de creación, la asignación ni la Team page.

**Architecture:** Cambio puramente de modelo de datos + limpieza. Se ejecuta en 3 pasos ordenados para que el build nunca se rompa a medio camino: (1) dejar de **leer** `player_status` en la UI de listados/detalle, (2) dejar de **leer/escribir** `player_status` en los formularios de alta/edición, (3) dejar de **aceptar/exponer** `player_status` en la API y ampliar tipos+pesos en `lib/types/design.ts` — y solo entonces (4) aplicar la migración que borra la columna de verdad. `type` sigue siendo `text` libre validado en la app (mismo patrón que la migración 034), así que los 14 tipos no requieren migración de datos, solo la constante ampliada.

**Tech Stack:** Next.js 15 / React 18 / TypeScript / Zod / Supabase (Postgres). Sin framework de tests instalado en el repo — la verificación de cada tarea es `npm run type-check` + `npm run lint` + `npm run build`, siguiendo el mismo patrón que el resto de specs de este proyecto (ver `docs/superpowers/specs/2026-07-01-traza-disenador-eliminado-design.md`, sección Rollout).

## Global Constraints

- No se toca el flujo de creación (tarjetas, entrada dual, IA), la asignación ponderada ni la Team page — eso son las Fases 2-5, con sus propios planes.
- `player_status` se elimina por completo: código Y columna. Ningún vestigio (tipos, imports, componente `PlayerStatusTag`, columna en BD).
- El nuevo campo libre se llama **`details`**, no `context`: `lib/types/design.ts` ya tiene un helper `getDesignContext(design)` que calcula un subtítulo de visualización — usar `context` como nombre de columna chocaría con ese helper y confundiría a quien lea el código después.
- Los 3 documentos históricos que mencionan `player_status` (`docs/audit-estructural.md`, `docs/auditoria-seguridad-rendimiento.md`, `docs/rediseno-plan.md`) **no se tocan** — son snapshots de auditorías pasadas, no código vivo.
- Project id de Supabase: `zhuluiqpakuwehibjyva`. Antes de cualquier DDL, el estado vivo manda sobre los nombres de archivo locales (ver memoria del proyecto: la numeración de migraciones locales diverge del historial real de Supabase) — este plan ya verificó el estado vivo (ver Task 4).
- Commits por tarea, mensajes en español, sin `git add -A` (stage por rutas explícitas).

---

### Task 1: Quitar la insignia "Estado Jugador" de listados y detalle

**Files:**
- Modify: `components/features/designs/designs-table.tsx` (import + 2 usos)
- Modify: `components/features/designs/design-detail-sheet.tsx` (import + 1 uso)
- Modify: `app/(dashboard)/mi-semana/page.tsx` (import + 1 uso)
- Modify: `app/(dashboard)/equipo/[id]/page.tsx` (import + 1 uso)
- Delete: `components/features/designs/tags/player-status-tag.tsx`

**Interfaces:**
- Consumes: nada (solo deja de leer `design.player_status`, que sigue existiendo en el tipo `Design` hasta la Task 3).
- Produces: nada — es una eliminación pura, sin nuevas superficies.

- [ ] **Step 1: Quitar el import y los 2 usos en `designs-table.tsx`**

En `components/features/designs/designs-table.tsx`, elimina la línea de import:

```ts
import { PlayerStatusTag } from '@/components/features/designs/tags/player-status-tag';
```

Elimina el uso en la lista móvil (dentro del `<p>` que muestra `{design.player}`):

```tsx
                  <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                    {design.player}
                    <span>
```

(la línea `<PlayerStatusTag status={design.player_status} variant="compact" />` que había entre `{design.player}` y `<span>` desaparece).

Elimina el uso en la tabla desktop:

```tsx
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="truncate font-medium">{design.player}</span>
                      </div>
```

(la línea `<PlayerStatusTag status={design.player_status} variant="compact" />` que había tras el `<span>` desaparece).

- [ ] **Step 2: Quitar el import y el uso en `design-detail-sheet.tsx`**

En `components/features/designs/design-detail-sheet.tsx`, elimina el import:

```ts
import { PlayerStatusTag } from '@/components/features/designs/tags/player-status-tag';
```

Y en la cabecera del detalle, deja el párrafo así (quitando la línea `<PlayerStatusTag status={design.player_status} />`):

```tsx
                <p className="mt-0.5 flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="truncate">
                    {[design.player, getDesignContext(design)].filter(Boolean).join(' · ')}
                  </span>
                </p>
```

- [ ] **Step 3: Quitar el import y el uso en `mi-semana/page.tsx`**

En `app/(dashboard)/mi-semana/page.tsx`, elimina el import:

```ts
import { PlayerStatusTag } from '@/components/features/designs/tags/player-status-tag';
```

Y deja el título de la tarjeta así (quitando la línea `{d.player_status && <PlayerStatusTag status={d.player_status} />}`):

```tsx
                          <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                            {d.title}
                          </p>
```

- [ ] **Step 4: Quitar el import y el uso en `equipo/[id]/page.tsx`**

En `app/(dashboard)/equipo/[id]/page.tsx`, elimina el import:

```ts
import { PlayerStatusTag } from '@/components/features/designs/tags/player-status-tag';
```

Y deja el bloque así (quitando la línea `{design.player_status && <PlayerStatusTag status={design.player_status} />}`):

```tsx
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              {design.player}
            </p>
```

- [ ] **Step 5: Quitar el componente, dejar viva la config**

> **Corrección post-implementación (2026-07-02):** este paso decía originalmente "borra el archivo por completo". Eso es incorrecto: `design-form-single.tsx` y `design-form-bulk.tsx` (Task 2, todavía no tocados en este punto) importan `PLAYER_STATUS_CONFIG` desde este archivo — borrarlo aquí rompe `npm run type-check` hasta que la Task 2 se ejecute. La revisión de la Task 1 confirmó esto por grep antes de aprobarlo. El archivo se borra de verdad al final de la **Task 2** (Step 6), una vez sus dos únicos consumidores dejan de necesitarlo.

En `components/features/designs/tags/player-status-tag.tsx`, quita el componente `PlayerStatusTag`, su interfaz `PlayerStatusTagProps`, y los imports que solo él usaba (`Hint`, `cn`). Quita también el type export `PlayerStatus` (no lo consume nadie: `design-form-single.tsx`/`design-form-bulk.tsx` importan solo `PLAYER_STATUS_CONFIG` de este archivo, y tienen su propio `PlayerStatus` en `lib/utils/design-form.ts`). Deja **solo** `PLAYER_STATUS_CONFIG` exportado — lo siguen necesitando los dos formularios hasta la Task 2.

- [ ] **Step 6: Verificar**

Run: `npm run type-check`
Expected: sin errores nuevos relacionados con `PlayerStatusTag` (los 4 archivos ya no lo importan). Pueden seguir apareciendo referencias a `player_status` en otros archivos todavía no tocados (`design-form.ts`, `schemas.ts`, etc.) — eso es esperado hasta las Tasks 2 y 3, `player_status` sigue siendo un campo válido de `Design` en este punto.

Run: `npm run lint`
Expected: sin errores ni warnings nuevos (imports no usados, etc.).

- [ ] **Step 7: Commit**

```bash
git add components/features/designs/designs-table.tsx components/features/designs/design-detail-sheet.tsx "app/(dashboard)/mi-semana/page.tsx" "app/(dashboard)/equipo/[id]/page.tsx" components/features/designs/tags/player-status-tag.tsx
git commit -m "refactor(designs): quita la insignia de estado del jugador de listados y detalle"
```

---

### Task 2: Quitar `player_status` de los formularios de alta/edición

**Files:**
- Modify: `lib/utils/design-form.ts`
- Modify: `components/features/designs/dialogs/design-form-single.tsx`
- Modify: `components/features/designs/dialogs/design-form-bulk.tsx`
- Modify: `components/features/designs/dialogs/create-design-dialog.tsx`
- Modify: `lib/hooks/use-design-submit.ts`
- Delete: `components/features/designs/tags/player-status-tag.tsx` (una vez sus 2 últimos consumidores se limpian en esta misma tarea — ver Step 6; la Task 1 dejó vivo solo `PLAYER_STATUS_CONFIG` de ese archivo, ver su Step 5 corregido)

**Interfaces:**
- Consumes: nada de la Task 1.
- Produces: `SingleDesignFormData` y `BulkDesignRow` (en `lib/utils/design-form.ts`) sin el campo `player_status` — de aquí en adelante ningún componente de formulario debe referenciarlo. **Debe completarse antes que la Task 3**: mientras el Select de "Estado Jugador" siga en la UI, alguien podría enviar un `player_status` real (no `undefined`) al API; si la Task 3 ya endureció el schema Zod en modo `.strict()`, esa petición fallaría con un 400.

- [ ] **Step 1: Quitar `PlayerStatus` y el campo de los tipos de formulario**

Reescribe `lib/utils/design-form.ts` completo:

```ts
import { type DesignType, DEFAULT_DESIGN_TYPE } from '@/lib/types/design';

export interface SingleDesignFormData {
  type: DesignType;
  title: string;
  player: string;
  match_home: string;
  match_away: string;
  deadline_at: Date | undefined;
  folder_url: string;
  designer_id: string | null;
}

export interface BulkDesignRow {
  id: string;
  type: DesignType;
  title: string;
  player: string;
  match_home: string;
  match_away: string;
  deadline_at: Date | undefined;
  designer_id: string | null;
  folder_url: string;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function createEmptyRow(type: DesignType = DEFAULT_DESIGN_TYPE): BulkDesignRow {
  return {
    id: generateId(),
    type,
    title: '',
    player: '',
    match_home: '',
    match_away: '',
    deadline_at: undefined,
    designer_id: null,
    folder_url: '',
  };
}

export function isRowValid(row: BulkDesignRow): boolean {
  if (!row.player.trim() || !row.deadline_at) return false;
  // El partido solo es obligatorio en matchday; el resto de tipos no lo tienen.
  if (row.type === 'matchday') {
    return !!(row.match_home.trim() && row.match_away.trim());
  }
  return true;
}

export function isRowEmpty(row: BulkDesignRow): boolean {
  return (
    !row.title.trim() &&
    !row.player.trim() &&
    !row.match_home.trim() &&
    !row.match_away.trim() &&
    !row.deadline_at &&
    !row.folder_url.trim()
  );
}

export function isOutsideWeek(
  date: Date | undefined,
  start?: Date,
  end?: Date
): boolean {
  if (!date || !start || !end) return false;
  return date.getTime() < start.getTime() || date.getTime() > end.getTime();
}
```

- [ ] **Step 2: Quitar el campo del formulario individual**

En `components/features/designs/dialogs/design-form-single.tsx`, cambia los imports de:

```ts
import { PLAYER_STATUS_CONFIG } from '@/components/features/designs/tags/player-status-tag';
import type { PlayerStatus, SingleDesignFormData } from '@/lib/utils/design-form';
```

a:

```ts
import type { SingleDesignFormData } from '@/lib/utils/design-form';
```

Sustituye el bloque `grid grid-cols-2` que contiene "Jugador/Equipo" + "Estado Jugador":

```tsx
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="player">Jugador/Equipo</Label>
              <Input
                id="player"
                placeholder="Jugador o equipo"
                required
                value={formData.player}
                onChange={(e) => onChange({ ...formData, player: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="player_status">Estado Jugador (Opcional)</Label>
              <Select
                value={formData.player_status || 'none'}
                onValueChange={(value) =>
                  onChange({
                    ...formData,
                    player_status: value === 'none' ? null : (value as PlayerStatus),
                  })
                }
              >
                <SelectTrigger id="player_status">
                  <SelectValue placeholder="Sin estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin estado</SelectItem>
                  {Object.entries(PLAYER_STATUS_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <config.icon className="h-4 w-4" />
                        <span>{config.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
```

por:

```tsx
          <div className="grid gap-2">
            <Label htmlFor="player">Jugador/Equipo</Label>
            <Input
              id="player"
              placeholder="Jugador o equipo"
              required
              value={formData.player}
              onChange={(e) => onChange({ ...formData, player: e.target.value })}
            />
          </div>
```

- [ ] **Step 3: Quitar el campo del formulario de lote**

En `components/features/designs/dialogs/design-form-bulk.tsx`, quita la línea de import:

```ts
import { PLAYER_STATUS_CONFIG } from '@/components/features/designs/tags/player-status-tag';
```

Y en el import de `@/lib/utils/design-form`, quita `type PlayerStatus,`:

```ts
import {
  type BulkDesignRow,
  isRowValid,
  isRowEmpty,
  isOutsideWeek,
} from '@/lib/utils/design-form';
```

En el bloque de detalle expandible, sustituye:

```tsx
                            <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
                              <div className="space-y-2">
                                <Label>Título (opcional)</Label>
                                <Input
                                  placeholder="Auto: jugador"
                                  value={row.title}
                                  onChange={(e) => updateBulkRow(row.id, 'title', e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>URL Drive (opcional)</Label>
                                <Input
                                  type="url"
                                  placeholder="https://drive.google.com/..."
                                  value={row.folder_url}
                                  onChange={(e) => updateBulkRow(row.id, 'folder_url', e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Estado jugador</Label>
                                <Select
                                  value={row.player_status || 'none'}
                                  onValueChange={(value) =>
                                    updateBulkRow(
                                      row.id,
                                      'player_status',
                                      value === 'none' ? null : (value as PlayerStatus)
                                    )
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Sin estado" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">Sin estado</SelectItem>
                                    {Object.entries(PLAYER_STATUS_CONFIG).map(([key, config]) => (
                                      <SelectItem key={key} value={key}>
                                        <div className="flex items-center gap-2">
                                          <config.icon className="h-3 w-3" />
                                          <span>{config.label}</span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
```

por:

```tsx
                            <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                              <div className="space-y-2">
                                <Label>Título (opcional)</Label>
                                <Input
                                  placeholder="Auto: jugador"
                                  value={row.title}
                                  onChange={(e) => updateBulkRow(row.id, 'title', e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>URL Drive (opcional)</Label>
                                <Input
                                  type="url"
                                  placeholder="https://drive.google.com/..."
                                  value={row.folder_url}
                                  onChange={(e) => updateBulkRow(row.id, 'folder_url', e.target.value)}
                                />
                              </div>
                            </div>
```

- [ ] **Step 4: Quitar las 4 inicializaciones en `create-design-dialog.tsx`**

En `components/features/designs/dialogs/create-design-dialog.tsx` hay 4 objetos `SingleDesignFormData` que incluyen `player_status: null,` (o `design.player_status || null,`). Quita esa línea en los 4 sitios:

1. El `useState<SingleDesignFormData>` inicial (cerca de la línea 59-69).
2. Dentro de `useEffect`, rama `if (design)` (cerca de la línea 76-86) — quita la línea `player_status: design.player_status || null,`.
3. Dentro de `useEffect`, rama `else` (cerca de la línea 88-98).
4. Dentro de `onSuccess` del `useDesignSubmit` (cerca de la línea 120-130).

En los 4 casos, el objeto queda con `designer_id: ...,` como último campo antes de la llave de cierre — no añadas coma colgante extra.

- [ ] **Step 5: Quitar `player_status` de los payloads en `use-design-submit.ts`**

En `lib/hooks/use-design-submit.ts`, en el `body` del `PUT` (modo edición), quita la línea:

```ts
            player_status: formData.player_status,
```

Y en el `map` de `validRows` (modo lote), quita la línea:

```ts
              player_status: r.player_status || undefined,
```

- [ ] **Step 6: Borrar `player-status-tag.tsx` de una vez por todas**

Tras los Steps 2 y 3, `design-form-single.tsx` y `design-form-bulk.tsx` ya no importan `PLAYER_STATUS_CONFIG` — eran sus dos únicos consumidores (la Task 1 dejó ese export vivo a propósito para no romper el build hasta este momento). Borra el archivo `components/features/designs/tags/player-status-tag.tsx` por completo.

- [ ] **Step 7: Verificar**

Run: `npm run type-check`
Expected: sin errores en los 5 archivos de esta tarea ni en el archivo borrado. Pueden seguir apareciendo referencias a `player_status` en `lib/api/schemas.ts`, `lib/types/design.ts` y `app/api/designs/bulk/route.ts` — se resuelven en la Task 3.

Run: `npm run lint`
Expected: sin imports no usados ni warnings nuevos.

- [ ] **Step 8: Commit**

```bash
git add lib/utils/design-form.ts components/features/designs/dialogs/design-form-single.tsx components/features/designs/dialogs/design-form-bulk.tsx components/features/designs/dialogs/create-design-dialog.tsx lib/hooks/use-design-submit.ts components/features/designs/tags/player-status-tag.tsx
git commit -m "refactor(designs): quita el campo Estado Jugador de los formularios de alta/edición y borra player-status-tag.tsx"
```

---

### Task 3: Quitar `player_status` de la API + ampliar tipos y pesos

**Files:**
- Modify: `lib/api/schemas.ts`
- Modify: `lib/types/design.ts`
- Modify: `app/api/designs/bulk/route.ts`

**Interfaces:**
- Consumes: la Task 2 debe estar completa primero (ver nota de riesgo en la Task 2 — el Select de "Estado Jugador" no puede seguir enviando `player_status` al API una vez este schema lo rechace en `.strict()` mode). Independiente de la Task 1.
- Produces:
  - `DESIGN_TYPES: readonly DesignType[]` — 14 valores (antes 3).
  - `DesignWeight = 'RAPIDA' | 'MEDIA' | 'PESADA'`.
  - `DESIGN_TYPE_WEIGHT: Record<DesignType, DesignWeight>` y `DESIGN_WEIGHT_VALUES: Record<DesignWeight, number>` — **estos dos son los que consumirá la Fase 2** (`select-designer.ts`/`assignment.ts`) para ponderar el reparto de carga. No se usan todavía en esta fase.
  - `getDesignWeightValue(type: DesignType | undefined): number` — helper que resuelve tipo → peso numérico directamente, mismo consumidor.
  - `Design.details?: string` — nuevo campo libre (antes `player_status?`, que desaparece).

- [ ] **Step 1: Quitar `player_status` de los schemas Zod**

En `lib/api/schemas.ts`, quita la constante:

```ts
const PLAYER_STATUS_VALUES = ['injured', 'suspended', 'doubt', 'last_minute'] as const;
```

Quita la línea `player_status: z.enum(PLAYER_STATUS_VALUES).nullish(),` de `bulkDesignItemSchema`.

Quita la línea `player_status: z.enum(PLAYER_STATUS_VALUES).nullable().optional(),` de `updateDesignSchema`.

- [ ] **Step 2: Ampliar tipos, pesos y campos en `lib/types/design.ts`**

Sustituye el bloque `// ─── Tipos de pieza ──` completo (desde `export const DESIGN_TYPES` hasta el cierre de `getDesignContext`) por:

```ts
// ─── Tipos de pieza ──────────────────────────────────────────
// Conjunto único y EXTENSIBLE: añadir un tipo = añadir su slug aquí + su
// label + su peso. Solo 'matchday' tiene partido (match_home/match_away);
// el resto, no.
export const DESIGN_TYPES = [
  'matchday',
  'cumpleanos',
  'convocatoria',
  'debut',
  'internacionalidad',
  'fichaje',
  'cesion',
  'firma',
  'playoff',
  'welcome',
  'md_conjunto',
  'md_animado',
  'cv',
  'presentacion_captacion',
] as const;
export type DesignType = (typeof DESIGN_TYPES)[number];
export const DEFAULT_DESIGN_TYPE: DesignType = 'matchday';

export const DESIGN_TYPE_LABELS: Record<DesignType, string> = {
  matchday: 'Matchday',
  cumpleanos: 'Cumpleaños',
  convocatoria: 'Convocatorias',
  debut: 'Debuts',
  internacionalidad: 'Internacionalidades',
  fichaje: 'Fichajes',
  cesion: 'Cesiones',
  firma: 'Firmas',
  playoff: 'Playoffs',
  welcome: 'Welcome',
  md_conjunto: 'MD conjuntos',
  md_animado: 'MD Animados',
  cv: 'CV',
  presentacion_captacion: 'Presentación para captación',
};

/** Peso de esfuerzo de cada tipo de pieza (usado por la Fase 2 para ponderar el reparto de carga). */
export type DesignWeight = 'RAPIDA' | 'MEDIA' | 'PESADA';

export const DESIGN_TYPE_WEIGHT: Record<DesignType, DesignWeight> = {
  matchday: 'RAPIDA',
  cumpleanos: 'RAPIDA',
  convocatoria: 'RAPIDA',
  debut: 'MEDIA',
  internacionalidad: 'MEDIA',
  fichaje: 'MEDIA',
  cesion: 'MEDIA',
  firma: 'MEDIA',
  playoff: 'MEDIA',
  welcome: 'MEDIA',
  md_conjunto: 'MEDIA',
  md_animado: 'PESADA',
  cv: 'PESADA',
  presentacion_captacion: 'PESADA',
};

/** Valor numérico de cada peso. Pesada > el doble de Media: una pieza pesada
 * suele equivaler en tiempo real a varias piezas rápidas, no a "un poco más". */
export const DESIGN_WEIGHT_VALUES: Record<DesignWeight, number> = {
  RAPIDA: 1,
  MEDIA: 2,
  PESADA: 4,
};

/** Resuelve un tipo de pieza directamente a su peso numérico. */
export function getDesignWeightValue(type: DesignType | undefined): number {
  const weight = DESIGN_TYPE_WEIGHT[type ?? DEFAULT_DESIGN_TYPE];
  return DESIGN_WEIGHT_VALUES[weight];
}

/** Tipos con partido (muestran/exigen equipos). De momento solo matchday. */
export function typeHasMatch(type: DesignType | undefined): boolean {
  return (type ?? DEFAULT_DESIGN_TYPE) === 'matchday';
}

/**
 * Texto de contexto de un diseño según su tipo: el partido si es matchday,
 * o la etiqueta del tipo (Cumpleaños, Presentación...) en caso contrario.
 */
export function getDesignContext(d: {
  type?: DesignType;
  match_home?: string | null;
  match_away?: string | null;
}): string {
  if (typeHasMatch(d.type)) {
    return d.match_home && d.match_away ? `${d.match_home} vs ${d.match_away}` : '';
  }
  return DESIGN_TYPE_LABELS[(d.type ?? DEFAULT_DESIGN_TYPE)] ?? '';
}
```

En la interfaz `Design`, sustituye:

```ts
  player_status?: 'injured' | 'suspended' | 'doubt' | 'last_minute'; // Estado del jugador
```

por:

```ts
  details?: string; // Texto libre con lo específico del tipo de pieza (rival, club, selección...)
```

- [ ] **Step 3: Quitar `player_status` del insert en el endpoint de lote**

En `app/api/designs/bulk/route.ts`, dentro del `.map()` que construye `designsToInsert`, quita la línea:

```ts
        player_status: d.player_status ?? null,
```

- [ ] **Step 4: Verificar**

Run: `npm run type-check`
Expected: **cero errores** — es la primera vez en esta fase que el proyecto entero type-checka limpio, porque las Tasks 1 y 2 ya quitaron todas las lecturas/escrituras de `player_status` y esta tarea acaba de quitar su última declaración de tipo.

Run: `npm run lint`
Expected: sin errores ni warnings.

Run: `npm run build`
Expected: build exitoso.

- [ ] **Step 5: Comprobación manual de que no queda ni rastro en código vivo**

Run: `grep -rn "player_status\|PlayerStatus" --include="*.ts" --include="*.tsx" app components lib`
Expected: sin resultados (los únicos matches restantes en el repo son los 3 docs históricos excluidos explícitamente en Global Constraints).

- [ ] **Step 6: Commit**

```bash
git add lib/api/schemas.ts lib/types/design.ts app/api/designs/bulk/route.ts
git commit -m "feat(designs): amplía tipos de pieza a 14 con peso y quita player_status de la API"
```

---

### Task 4: Migración — borra `player_status`, añade `details` y `weekly_capacity`

**Files:**
- Create: `supabase/migrations/039_design_type_weight_model.sql`

**Interfaces:**
- Consumes: debe ejecutarse **después** de las Tasks 1-3 (el código ya no debe tocar `player_status` en ningún punto de lectura/escritura antes de borrar la columna en la base de datos real).
- Produces: `public.designs.details` (text, nullable) y `public.profiles.weekly_capacity` (integer, not null, default 10) — ambas sin consumidor todavía; las usan las Fases 2 (asignación + Team page) y 4 (parseo IA).

- [ ] **Step 1: Escribir la migración**

Crea `supabase/migrations/039_design_type_weight_model.sql`:

```sql
-- 039: Modelo de tipos de pieza con peso + limpieza de player_status.
--
-- `designs.type` amplía de 3 a 14 valores (ver lib/types/design.ts,
-- DESIGN_TYPES). Sigue siendo texto libre validado en la app, no un enum de
-- Postgres (mismo patrón que la migración 034) — no requiere backfill.
--
-- `player_status` se elimina: solo 13 de 761 filas (1.7%) lo usaban en
-- producción (verificado 2026-07-02).
--
-- `details` sustituye a player_status como campo libre para lo específico
-- de cada tipo de pieza (rival, club nuevo, selección, motivo de la
-- firma...). Se llama `details` y no `context` para no chocar con el
-- helper getDesignContext() ya existente en lib/types/design.ts, que
-- calcula un subtítulo de visualización distinto. Sin consumidor todavía:
-- lo rellena el flujo de tarjetas (Fase 3) y el asistente IA (Fase 4).
--
-- `profiles.weekly_capacity` es la capacidad semanal de cada diseñador, en
-- unidades de peso (Rápida=1/Media=2/Pesada=4). Arranca en 10 para todos:
-- es la media histórica real redondeada al alza (~9.2 diseños/diseñador/
-- semana en los últimos ~6 meses, todos peso 1 hasta ahora, verificado
-- 2026-07-02). El equipo la ajustará por diseñador cuando la revise; la
-- consume el reparto de carga y el % de Team page (Fase 2).

alter table public.designs drop column player_status;

alter table public.designs add column details text;
comment on column public.designs.details is
  'Texto libre con el detalle específico del tipo de pieza (rival, club, selección, motivo...). Rellenado a mano o por el asistente IA (Fase 4).';

alter table public.profiles add column weekly_capacity integer not null default 10;
comment on column public.profiles.weekly_capacity is
  'Capacidad semanal del diseñador, en unidades de peso (Rápida=1/Media=2/Pesada=4). Usada por el reparto de carga y el % de Team page (Fase 2).';
```

- [ ] **Step 2: Aplicar la migración al proyecto real**

Usa la herramienta MCP de Supabase para aplicarla (project_id `zhuluiqpakuwehibjyva`):

```
mcp__plugin_supabase_supabase__apply_migration
  project_id: zhuluiqpakuwehibjyva
  name: design_type_weight_model
  query: <el contenido del Step 1>
```

- [ ] **Step 3: Verificar el esquema resultante**

Ejecuta vía `mcp__plugin_supabase_supabase__execute_sql` (project_id `zhuluiqpakuwehibjyva`):

```sql
select table_name, column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and ((table_name = 'designs' and column_name in ('player_status', 'details'))
    or (table_name = 'profiles' and column_name = 'weekly_capacity'))
order by table_name, column_name;
```

Expected: 2 filas — `designs.details` (`text`, nullable, sin default) y `profiles.weekly_capacity` (`integer`, `NO` nullable, default `10`). **Cero filas** para `designs.player_status` (columna borrada).

- [ ] **Step 4: Verificar que la app sigue funcionando contra el esquema real**

Run: `npm run build`
Expected: build exitoso (el build no toca la BD directamente, pero confirma que no quedó ninguna referencia rota tras el DDL).

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/039_design_type_weight_model.sql
git commit -m "feat(db): migración 039 — borra player_status, añade designs.details y profiles.weekly_capacity"
```

---

### Task 5: Verificación final de la Fase 1

**Files:** ninguno nuevo — solo verificación end-to-end de las Tasks 1-4.

**Interfaces:**
- Consumes: el resultado combinado de las Tasks 1-4.
- Produces: confirmación de que la Fase 1 está lista para dar paso a la Fase 2 (asignación ponderada + Team page).

- [ ] **Step 1: Verificación estática completa**

Run: `npm run type-check && npm run lint && npm run build`
Expected: los 3 comandos terminan sin errores.

- [ ] **Step 2: Verificación manual en navegador**

Arranca `npm run build && npm run start` (nunca `next dev` para medir/validar, según convención del proyecto) y en el navegador:

1. Abre "Crear Diseños" (modo lote) → el selector de "Tipo" muestra los 14 chips (Matchday, Cumpleaños, Convocatorias, Debuts, Internacionalidades, Fichajes, Cesiones, Firmas, Playoffs, Welcome, MD conjuntos, MD Animados, CV, Presentación para captación) y ya no aparece "Estado jugador" en el detalle expandible de ninguna fila.
2. Crea un diseño de tipo `matchday` y otro de un tipo nuevo (p. ej. `debut`) — confirma que el segundo no pide equipo local/visitante (mismo comportamiento que `presentacion`/`cumpleanos` ya tenían).
3. Abre el detalle de un diseño existente y la fila de "Mi semana" — confirma que no aparece ninguna insignia de estado del jugador.
4. Edita un diseño existente — confirma que el formulario individual tampoco muestra "Estado Jugador" y guarda sin errores.

- [ ] **Step 3: Confirmar que no queda deuda pendiente**

Run: `grep -rn "player_status\|PlayerStatus" --include="*.ts" --include="*.tsx" .`
Expected: 0 resultados en `app/`, `components/`, `lib/`. Los únicos matches permitidos son los 3 archivos `docs/*.md` ya excluidos en Global Constraints.

- [ ] **Step 4: Actualizar la memoria del proyecto**

Marca en la memoria (`project_pending_design_creation_redesign.md`) que la Fase 1 (modelo de datos) de la spec `2026-07-02-rediseno-creacion-disenos-design.md` está completada y pusheada, con la fecha y el commit final. Esto no es un paso de código — es la actualización de memoria persistente descrita en las instrucciones del proyecto, para que la siguiente sesión sepa que toca planificar la Fase 2.
