# Rediseño de creación de diseños — Fase 2: asignación ponderada + % de capacidad Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que la asignación automática de diseñadores reparta por **peso** de la pieza (no por conteo de filas) y **dentro de la semana** a la que pertenece cada diseño, y que la Team page muestre la carga de cada diseñador como **% de su capacidad semanal** — usando la misma base semanal que el algoritmo, para que lo que se ve coincida con cómo se reparte.

**Architecture:** Se extrae la lógica pura de "agrupar diseños por semana ISO y sumar pesos" a un módulo nuevo y testeado (`lib/services/designs/weekly-load.ts`), sin dependencias de Next/Supabase, para poder cubrirlo con tests unitarios. Los tres puntos que hoy construyen un mapa de carga `Map<designerId, número>` (las dos rutas de asignación en lote y el servicio de asignación individual) pasan a construir mapas **por semana** con ese módulo; `select-designer.ts` no cambia (ya elige por menor carga sobre un número). La Team page calcula el % con el mismo módulo (`sumWeight`) y el `weekly_capacity` ya existente en `profiles`.

**Tech Stack:** Next.js 15 / React 18 / TypeScript / Supabase (Postgres) / date-fns (ya dependencia). **Se añade Vitest** como framework de tests (el repo no tenía ninguno) para cubrir la lógica pura nueva — decisión tomada 2026-07-02, ver Global Constraints. El resto de verificación sigue el patrón del proyecto: `npm run type-check` + `npm run lint` + `npm run build`.

## Global Constraints

- **Base semanal = semana ISO de la fecha de entrega de cada diseño**, con la semana empezando en **lunes** (`weekStartsOn: 1`), idéntica convención que ya usa la Team page (`startOfWeek(date, { weekStartsOn: 1 })`). La clave de semana es el lunes de esa semana en formato `yyyy-MM-dd` construido con fecha **local** (no `toISOString()`, que desplazaría por zona horaria).
- **El % y la carga cuentan solo diseños NO entregados** (`status !== 'DELIVERED'`, que hoy equivale a `BACKLOG`). Debe coincidir exactamente con el conjunto que cuenta la asignación (`neq('status', 'DELIVERED')`), que es el punto de la coherencia: lo que ves en la Team page de la semana W es la misma base que el algoritmo usa para repartir en W.
- **Peso por tipo** vía `getDesignWeightValue(type)` de `lib/types/design.ts` (creado en la Fase 1): Rápida=1, Media=2, Pesada=4. Un `type` ausente cae a `matchday` (peso 1) por `DEFAULT_DESIGN_TYPE`.
- **Capacidad semanal**: columna `profiles.weekly_capacity` (integer, not null, default 10, creada en la Fase 1). En esta fase es **solo de lectura** — se muestra el % con el valor guardado (10 para todos). La UI para editar la capacidad por diseñador queda **fuera de alcance** (corte posterior).
- **Fuera de alcance de la Fase 2**: el flujo de tarjetas / entrada IA (Fases 3-4), el `InfoTip` (Fase 5), la edición de capacidad, y la vista `mi-semana` (la Fase 2 toca solo la Team page y su detalle). `select-designer.ts` **no se modifica**.
- **Vitest** se añade solo para la lógica pura de `weekly-load.ts` (y, de propina, `select-designer.ts`). No se testean componentes React ni rutas (esas se verifican con build + navegador). Si el usuario veta Vitest al revisar el plan, la Task 1 cae a "crear el módulo puro sin tests" y el resto del plan no cambia.
- Commits por tarea, mensajes en español, sin `git add -A` (stage por rutas explícitas). Trabajo en un worktree nuevo (lo crea subagent-driven-development), no en `main`.

---

### Task 1: Módulo puro `weekly-load.ts` + Vitest

**Files:**
- Modify: `package.json` (script `test` + devDependency `vitest`)
- Create: `vitest.config.ts`
- Create: `lib/services/designs/weekly-load.ts`
- Create: `lib/services/designs/weekly-load.test.ts`
- Create: `lib/services/designs/select-designer.test.ts`

**Interfaces:**
- Consumes: `getDesignWeightValue(type)` y `type DesignType` de `@/lib/types/design`; `startOfWeek` de `date-fns`; `selectDesignerByLoad` de `./select-designer` (solo para su test).
- Produces (lo que consumen las Tasks 2-5):
  - `interface LoadDesign { designer_id: string | null; deadline_at: string; type?: DesignType }`
  - `weekKeyFor(date: Date | string): string` — lunes de la semana ISO como `yyyy-MM-dd` local.
  - `buildWeeklyWeightMaps(designs: LoadDesign[], designerIds: string[]): Map<string, Map<string, number>>` — `Map<weekKey, Map<designerId, pesoTotal>>`. Ignora diseños con `designer_id` null o no presente en `designerIds`. Cada semana que aparece arranca con todos los diseñadores a 0.
  - `loadMapForWeek(maps: Map<string, Map<string, number>>, weekKey: string, designerIds: string[]): Map<string, number>` — devuelve el mapa de esa semana; si no existe, lo crea con todos los diseñadores a 0 y lo registra en `maps`.
  - `sumWeight(designs: { type?: DesignType }[]): number` — suma de pesos.

- [ ] **Step 1: Instalar Vitest**

Run: `npm install --save-dev vitest`
Expected: se añade `vitest` a `devDependencies` en `package.json`. Anota la versión que resuelva (p. ej. `^3.x`).

- [ ] **Step 2: Añadir el script de test a `package.json`**

En `package.json`, dentro de `"scripts"`, añade estas dos líneas (tras `"type-check": "tsc --noEmit",`):

```json
    "test": "vitest run",
    "test:watch": "vitest",
```

- [ ] **Step 3: Crear `vitest.config.ts`**

Crea `vitest.config.ts` en la raíz:

```ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['node_modules', '.next', 'dist'],
  },
});
```

- [ ] **Step 4: Escribir los tests de `weekly-load.ts` (RED)**

Crea `lib/services/designs/weekly-load.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  weekKeyFor,
  buildWeeklyWeightMaps,
  loadMapForWeek,
  sumWeight,
} from './weekly-load';

describe('weekKeyFor', () => {
  it('devuelve el lunes de la semana para un día entre semana', () => {
    // Miércoles 2026-07-01 → lunes 2026-06-29
    expect(weekKeyFor('2026-07-01T12:00:00')).toBe('2026-06-29');
  });

  it('un lunes devuelve ese mismo lunes', () => {
    expect(weekKeyFor('2026-06-29T00:00:00')).toBe('2026-06-29');
  });

  it('un domingo pertenece a la semana que empezó el lunes anterior', () => {
    // Domingo 2026-07-05 → lunes 2026-06-29
    expect(weekKeyFor('2026-07-05T23:00:00')).toBe('2026-06-29');
  });

  it('acepta un Date además de string', () => {
    expect(weekKeyFor(new Date(2026, 6, 1, 12, 0, 0))).toBe('2026-06-29');
  });
});

describe('buildWeeklyWeightMaps', () => {
  const designers = ['A', 'B'];

  it('suma pesos por diseñador dentro de cada semana', () => {
    const maps = buildWeeklyWeightMaps(
      [
        { designer_id: 'A', deadline_at: '2026-06-30T10:00:00', type: 'matchday' }, // sem 06-29, peso 1
        { designer_id: 'A', deadline_at: '2026-07-01T10:00:00', type: 'cv' },       // sem 06-29, peso 4
        { designer_id: 'B', deadline_at: '2026-07-07T10:00:00', type: 'fichaje' },  // sem 07-06, peso 2
      ],
      designers,
    );
    expect(maps.get('2026-06-29')!.get('A')).toBe(5);
    expect(maps.get('2026-06-29')!.get('B')).toBe(0);
    expect(maps.get('2026-07-06')!.get('B')).toBe(2);
    expect(maps.get('2026-07-06')!.get('A')).toBe(0);
  });

  it('ignora diseños sin diseñador o con diseñador desconocido', () => {
    const maps = buildWeeklyWeightMaps(
      [
        { designer_id: null, deadline_at: '2026-06-30T10:00:00', type: 'matchday' },
        { designer_id: 'Z', deadline_at: '2026-06-30T10:00:00', type: 'matchday' },
      ],
      designers,
    );
    // La semana existe (se creó al ver el primer diseño) pero A y B siguen a 0.
    expect(maps.get('2026-06-29')!.get('A')).toBe(0);
    expect(maps.get('2026-06-29')!.get('B')).toBe(0);
    expect(maps.get('2026-06-29')!.has('Z')).toBe(false);
  });

  it('un tipo ausente cuenta como matchday (peso 1)', () => {
    const maps = buildWeeklyWeightMaps(
      [{ designer_id: 'A', deadline_at: '2026-06-30T10:00:00' }],
      designers,
    );
    expect(maps.get('2026-06-29')!.get('A')).toBe(1);
  });
});

describe('loadMapForWeek', () => {
  it('devuelve el mapa existente de una semana ya presente', () => {
    const maps = buildWeeklyWeightMaps(
      [{ designer_id: 'A', deadline_at: '2026-06-30T10:00:00', type: 'cv' }],
      ['A', 'B'],
    );
    const m = loadMapForWeek(maps, '2026-06-29', ['A', 'B']);
    expect(m.get('A')).toBe(4);
  });

  it('crea y registra un mapa a cero para una semana ausente', () => {
    const maps = new Map<string, Map<string, number>>();
    const m = loadMapForWeek(maps, '2026-06-29', ['A', 'B']);
    expect(m.get('A')).toBe(0);
    expect(m.get('B')).toBe(0);
    expect(maps.has('2026-06-29')).toBe(true);
  });
});

describe('sumWeight', () => {
  it('suma los pesos de una lista de diseños', () => {
    expect(sumWeight([{ type: 'matchday' }, { type: 'cv' }, { type: 'fichaje' }])).toBe(7);
  });

  it('lista vacía → 0', () => {
    expect(sumWeight([])).toBe(0);
  });
});
```

- [ ] **Step 5: Ejecutar los tests para verlos fallar**

Run: `npm test`
Expected: FAIL — `weekly-load.ts` no existe todavía (error de import / módulo no encontrado).

- [ ] **Step 6: Implementar `weekly-load.ts` (GREEN)**

Crea `lib/services/designs/weekly-load.ts`:

```ts
import { startOfWeek } from 'date-fns';
import { getDesignWeightValue, type DesignType } from '@/lib/types/design';

/** Campos de un diseño que importan para el cálculo de carga. */
export interface LoadDesign {
  designer_id: string | null;
  deadline_at: string;
  type?: DesignType;
}

/**
 * Clave de semana ISO: el lunes de la semana a la que pertenece la fecha,
 * como `yyyy-MM-dd`. Semana empieza en lunes (weekStartsOn: 1), igual que la
 * Team page. Se construye con la fecha LOCAL (no toISOString) para no
 * desplazar el día por zona horaria.
 */
export function weekKeyFor(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const monday = startOfWeek(d, { weekStartsOn: 1 });
  const y = monday.getFullYear();
  const m = String(monday.getMonth() + 1).padStart(2, '0');
  const day = String(monday.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Construye mapas de carga ponderada por semana a partir de diseños existentes.
 * Devuelve Map<weekKey, Map<designerId, pesoTotal>>. Ignora diseños sin
 * diseñador conocido. Cada semana vista arranca con todos los diseñadores a 0.
 */
export function buildWeeklyWeightMaps(
  designs: LoadDesign[],
  designerIds: string[],
): Map<string, Map<string, number>> {
  const maps = new Map<string, Map<string, number>>();
  const known = new Set(designerIds);
  for (const d of designs) {
    const wk = weekKeyFor(d.deadline_at);
    const weekMap = loadMapForWeek(maps, wk, designerIds);
    if (!d.designer_id || !known.has(d.designer_id)) continue;
    weekMap.set(d.designer_id, (weekMap.get(d.designer_id) ?? 0) + getDesignWeightValue(d.type));
  }
  return maps;
}

/**
 * Devuelve el mapa de carga de una semana. Si no existe, lo crea con todos
 * los diseñadores a 0 y lo registra en `maps`.
 */
export function loadMapForWeek(
  maps: Map<string, Map<string, number>>,
  weekKey: string,
  designerIds: string[],
): Map<string, number> {
  let m = maps.get(weekKey);
  if (!m) {
    m = new Map(designerIds.map((id) => [id, 0]));
    maps.set(weekKey, m);
  }
  return m;
}

/** Suma de pesos de una lista de diseños. */
export function sumWeight(designs: { type?: DesignType }[]): number {
  return designs.reduce((acc, d) => acc + getDesignWeightValue(d.type), 0);
}
```

- [ ] **Step 7: Escribir el test de `select-designer.ts` (de propina, ya es el núcleo del desempate)**

Crea `lib/services/designs/select-designer.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { selectDesignerByLoad } from './select-designer';

describe('selectDesignerByLoad', () => {
  it('elige al diseñador con menor carga', () => {
    const loads = new Map([['A', 5], ['B', 2], ['C', 8]]);
    expect(selectDesignerByLoad(['A', 'B', 'C'], loads).id).toBe('B');
  });

  it('en empate rota desde startIndex', () => {
    const loads = new Map([['A', 0], ['B', 0], ['C', 0]]);
    const first = selectDesignerByLoad(['A', 'B', 'C'], loads, 0);
    expect(first.id).toBe('A');
    const second = selectDesignerByLoad(['A', 'B', 'C'], loads, first.nextIndex);
    expect(second.id).toBe('B');
  });

  it('sin diseñadores devuelve id null', () => {
    expect(selectDesignerByLoad([], new Map())).toEqual({ id: null, nextIndex: 0 });
  });
});
```

- [ ] **Step 8: Ejecutar toda la suite y el type-check**

Run: `npm test`
Expected: PASS — todos los tests de `weekly-load.test.ts` y `select-designer.test.ts` en verde, salida limpia.

Run: `npm run type-check`
Expected: sin errores. Nota: `tsconfig.json` incluye `**/*.ts`, así que a partir de ahora `tsc` (y el type-check de `next build`) también compilan `weekly-load.test.ts`, `select-designer.test.ts` y `vitest.config.ts` — es lo esperado; sus tipos (`vitest`, `vitest/config`) resuelven desde la dependencia recién instalada. No hace falta tocar `tsconfig`.

Run: `npm run lint`
Expected: sin errores ni warnings.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json vitest.config.ts lib/services/designs/weekly-load.ts lib/services/designs/weekly-load.test.ts lib/services/designs/select-designer.test.ts
git commit -m "feat(designs): módulo puro de carga semanal ponderada + Vitest"
```

---

### Task 2: Asignación ponderada por semana en las rutas de lote

**Files:**
- Modify: `app/api/designs/bulk/route.ts`
- Modify: `app/api/designs/assign/route.ts`

**Interfaces:**
- Consumes de la Task 1: `buildWeeklyWeightMaps`, `loadMapForWeek`, `weekKeyFor` de `@/lib/services/designs/weekly-load`; `getDesignWeightValue` de `@/lib/types/design`. Sigue usando `selectDesignerByLoad` de `@/lib/services/designs/select-designer` (sin cambios).
- Produces: nada nuevo para tareas posteriores; cambia el comportamiento de dos endpoints.

- [ ] **Step 1: `bulk/route.ts` — traer fecha y tipo en el fetch de carga**

En `app/api/designs/bulk/route.ts`, cambia el `.select` del fetch de diseños activos (líneas ~58-62) de:

```ts
    const { data: activeDesigns, error: designsError } = await supabase
      .from('designs')
      .select('id, designer_id')
      .neq('status', 'DELIVERED')
      .not('designer_id', 'is', null);
```

a:

```ts
    const { data: activeDesigns, error: designsError } = await supabase
      .from('designs')
      .select('id, designer_id, deadline_at, type')
      .neq('status', 'DELIVERED')
      .not('designer_id', 'is', null);
```

- [ ] **Step 2: `bulk/route.ts` — repartir por semana ponderada**

Sustituye el bloque desde `const taskCounts = new Map<string, number>();` (línea ~69) hasta el cierre del `.map(...)` en `});` (línea ~112) por:

```ts
    const weekMaps = buildWeeklyWeightMaps(activeDesigns ?? [], designerIds);
    const cursorByWeek = new Map<string, number>();

    // Si hay >1 diseño suprimimos notificaciones individuales y creamos una agregada.
    const shouldAggregate = designs.length > 1;

    const designsToInsert = designs.map((d) => {
      const wk = weekKeyFor(d.deadline_at);
      const loadMap = loadMapForWeek(weekMaps, wk, designerIds);

      let designerId: string | null = null;
      if (d.designer_id && d.designer_id !== 'auto') {
        designerId = d.designer_id;
      } else {
        const cursor = cursorByWeek.get(wk) ?? 0;
        const selection = selectDesignerByLoad(designerIds, loadMap, cursor);
        designerId = selection.id;
        cursorByWeek.set(wk, selection.nextIndex);
      }

      // El diseño recién repartido pesa en su semana para los siguientes del lote.
      if (designerId && loadMap.has(designerId)) {
        loadMap.set(designerId, (loadMap.get(designerId) ?? 0) + getDesignWeightValue(d.type));
      }

      const title = d.title?.trim() || d.player;
      const isMatchday = (d.type ?? 'matchday') === 'matchday';

      return {
        title,
        type: d.type ?? 'matchday',
        player: d.player,
        match_home: isMatchday ? d.match_home : null,
        match_away: isMatchday ? d.match_away : null,
        deadline_at: d.deadline_at,
        folder_url: d.folder_url || null,
        designer_id: designerId,
        created_by: data.user.id,
        status: 'BACKLOG' as const,
        suppress_assignment_notification: shouldAggregate,
      };
    });
```

- [ ] **Step 3: `bulk/route.ts` — actualizar los imports**

En la cabecera de `app/api/designs/bulk/route.ts`, la línea:

```ts
import { selectDesignerByLoad } from '@/lib/services/designs/select-designer';
```

pasa a:

```ts
import { selectDesignerByLoad } from '@/lib/services/designs/select-designer';
import { buildWeeklyWeightMaps, loadMapForWeek, weekKeyFor } from '@/lib/services/designs/weekly-load';
import { getDesignWeightValue } from '@/lib/types/design';
```

- [ ] **Step 4: `assign/route.ts` — traer fecha y tipo en ambos fetches**

En `app/api/designs/assign/route.ts`, cambia el fetch de no asignados (líneas ~36-40) de `.select('id')` a:

```ts
  const { data: unassigned, error: unassignedError } = await supabase
    .from('designs')
    .select('id, deadline_at, type')
    .is('designer_id', null)
    .eq('status', 'BACKLOG');
```

Y el fetch de carga (líneas ~63-67) de `.select('designer_id')` a:

```ts
  const { data: activeDesigns, error: activeError } = await supabase
    .from('designs')
    .select('designer_id, deadline_at, type')
    .neq('status', 'DELIVERED')
    .not('designer_id', 'is', null);
```

- [ ] **Step 5: `assign/route.ts` — repartir por semana ponderada**

Sustituye el bloque desde `const taskCounts = new Map<string, number>();` (línea ~71) hasta el final del `for (const design of unassigned) { ... }` (línea ~94) por:

```ts
  const weekMaps = buildWeeklyWeightMaps(activeDesigns ?? [], designerIds);
  const cursorByWeek = new Map<string, number>();

  // Round-robin in-memory por semana: agrupar por diseñador asignado.
  const assignmentsByDesigner = new Map<string, string[]>();

  for (const design of unassigned) {
    const wk = weekKeyFor(design.deadline_at);
    const loadMap = loadMapForWeek(weekMaps, wk, designerIds);
    const cursor = cursorByWeek.get(wk) ?? 0;
    const { id: selectedId, nextIndex } = selectDesignerByLoad(designerIds, loadMap, cursor);
    if (!selectedId) continue;
    cursorByWeek.set(wk, nextIndex);

    loadMap.set(selectedId, (loadMap.get(selectedId) ?? 0) + getDesignWeightValue(design.type));

    if (!assignmentsByDesigner.has(selectedId)) {
      assignmentsByDesigner.set(selectedId, []);
    }
    assignmentsByDesigner.get(selectedId)!.push(design.id);
  }
```

(El bloque siguiente, el `// 5. Update por diseñador` con el `for (const [designerId, designIds] ...)`, no cambia.)

- [ ] **Step 6: `assign/route.ts` — actualizar los imports**

La línea:

```ts
import { selectDesignerByLoad } from '@/lib/services/designs/select-designer';
```

pasa a:

```ts
import { selectDesignerByLoad } from '@/lib/services/designs/select-designer';
import { buildWeeklyWeightMaps, loadMapForWeek, weekKeyFor } from '@/lib/services/designs/weekly-load';
import { getDesignWeightValue } from '@/lib/types/design';
```

- [ ] **Step 7: Verificar**

Run: `npm run type-check`
Expected: sin errores.

Run: `npm run lint`
Expected: sin errores ni warnings (comprueba que no quedó `selectDesignerByLoad`/`taskCounts` sin usar ni imports huérfanos).

Run: `npm run build`
Expected: build exitoso.

- [ ] **Step 8: Commit**

```bash
git add app/api/designs/bulk/route.ts app/api/designs/assign/route.ts
git commit -m "feat(designs): asignación en lote ponderada por peso y por semana"
```

---

### Task 3: Asignación ponderada por semana en el reasignado individual

**Files:**
- Modify: `lib/services/designs/assignment.ts`
- Modify: `app/api/designs/[id]/route.ts`

**Interfaces:**
- Consumes de la Task 1: `buildWeeklyWeightMaps`, `loadMapForWeek`, `weekKeyFor`.
- Produces: `assignDesignerAutomatically(designId: string, deadlineAt?: string): Promise<string | null>` — firma cambiada respecto a la anterior (`(excludeDesignId?: string)`). Ahora **requiere** el id del diseño y admite opcionalmente su fecha de entrega efectiva; reparte dentro de la semana de ese diseño excluyéndolo del conteo.

- [ ] **Step 1: Reescribir `assignment.ts`**

Sustituye el contenido completo de `lib/services/designs/assignment.ts` por:

```ts
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { selectDesignerByLoad } from './select-designer';
import { buildWeeklyWeightMaps, loadMapForWeek, weekKeyFor } from './weekly-load';

/**
 * Asigna automáticamente un diseñador a UN diseño según la carga ponderada de
 * la semana a la que pertenece ese diseño (mismo criterio que las rutas de
 * lote). El propio diseño se excluye del conteo.
 *
 * @param designId — id del diseño que se está (re)asignando. Se excluye del conteo.
 * @param deadlineAt — fecha de entrega efectiva (ISO). Si se omite, se lee la
 *   almacenada del diseño. Pásala cuando el mismo request cambia la fecha, para
 *   repartir según la semana NUEVA y no la antigua.
 */
export async function assignDesignerAutomatically(
  designId: string,
  deadlineAt?: string,
): Promise<string | null> {
  try {
    const supabase = await createClient();

    const { data: designers, error: designersError } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'DESIGNER');

    if (designersError) {
      logger.error('Error fetching designers for assignment:', designersError);
      return null;
    }
    if (!designers || designers.length === 0) {
      logger.warn('No designers found for assignment');
      return null;
    }
    const designerIds = designers.map((d) => d.id);

    // Semana objetivo: la fecha efectiva pasada, o la almacenada del diseño.
    let effectiveDeadline = deadlineAt;
    if (!effectiveDeadline) {
      const { data: target, error: targetError } = await supabase
        .from('designs')
        .select('deadline_at')
        .eq('id', designId)
        .single();
      if (targetError || !target) {
        logger.error('Error fetching target design for assignment:', targetError);
        return null;
      }
      effectiveDeadline = target.deadline_at;
    }
    const wk = weekKeyFor(effectiveDeadline);

    const { data: activeDesigns, error: designsError } = await supabase
      .from('designs')
      .select('id, designer_id, deadline_at, type')
      .neq('status', 'DELIVERED')
      .not('designer_id', 'is', null);

    if (designsError) {
      logger.error('Error fetching active designs for assignment:', designsError);
      return null;
    }

    // Carga ponderada de la semana objetivo, excluyendo el propio diseño.
    const weekMaps = buildWeeklyWeightMaps(
      (activeDesigns ?? []).filter((d) => d.id !== designId),
      designerIds,
    );
    const loadMap = loadMapForWeek(weekMaps, wk, designerIds);

    return selectDesignerByLoad(designerIds, loadMap).id;
  } catch (error) {
    logger.error('Unexpected error in assignDesignerAutomatically:', error);
    return null;
  }
}
```

- [ ] **Step 2: Actualizar la llamada en `[id]/route.ts`**

En `app/api/designs/[id]/route.ts`, dentro del `PUT`, el bloque:

```ts
    if (key === 'designer_id' && value === 'auto') {
      const { assignDesignerAutomatically } = await import('@/lib/services/designs/assignment');
      updateData.designer_id = await assignDesignerAutomatically(id);
    } else {
```

pasa a (pasa la fecha del body si viene, para repartir según la semana nueva):

```ts
    if (key === 'designer_id' && value === 'auto') {
      const { assignDesignerAutomatically } = await import('@/lib/services/designs/assignment');
      const deadlineAt = typeof body.deadline_at === 'string' ? body.deadline_at : undefined;
      updateData.designer_id = await assignDesignerAutomatically(id, deadlineAt);
    } else {
```

- [ ] **Step 3: Verificar**

Run: `npm run type-check`
Expected: sin errores (la firma nueva de `assignDesignerAutomatically` casa con la única llamada, en `[id]/route.ts`).

Run: `npm run lint`
Expected: sin errores ni warnings.

Run: `npm run build`
Expected: build exitoso.

- [ ] **Step 4: Commit**

```bash
git add lib/services/designs/assignment.ts app/api/designs/[id]/route.ts
git commit -m "feat(designs): reasignado individual ponderado por semana del diseño"
```

---

### Task 4: Team page — % de capacidad semanal

**Files:**
- Modify: `lib/hooks/use-team-data.ts`
- Modify: `app/(dashboard)/equipo/page.tsx`

**Interfaces:**
- Consumes de la Task 1: `sumWeight` de `@/lib/services/designs/weekly-load`.
- Produces: `DesignerWithDesigns` gana `weekly_capacity: number` (lo consume la Task 5 también).

- [ ] **Step 1: `use-team-data.ts` — traer y exponer `weekly_capacity`**

En `lib/hooks/use-team-data.ts`, añade el campo a la interfaz:

```ts
export interface DesignerWithDesigns {
  id: string;
  full_name: string;
  display_name: string;
  avatar_url?: string | null;
  weekly_capacity: number;
  designs: Design[];
}
```

Cambia el `.select` de profiles (línea ~28) de:

```ts
    .select('id, full_name, display_name, avatar_url')
```

a:

```ts
    .select('id, full_name, display_name, avatar_url, weekly_capacity')
```

Y en el `designerMap.set(...)` (líneas ~46-52), añade el campo (con fallback defensivo a 10 por si llegara null):

```ts
    designerMap.set(d.id, {
      id: d.id,
      full_name: d.full_name || 'Sin nombre',
      display_name: d.display_name || d.full_name || 'Sin nombre',
      avatar_url: d.avatar_url ?? undefined,
      weekly_capacity: d.weekly_capacity ?? 10,
      designs: [],
    });
```

- [ ] **Step 2: `equipo/page.tsx` — calcular y mostrar el % en vez del conteo**

En `app/(dashboard)/equipo/page.tsx`, añade el import (junto a los otros de `@/lib/...`):

```ts
import { sumWeight } from '@/lib/services/designs/weekly-load';
```

Elimina la constante de umbral por conteo:

```ts
const OVERLOAD_THRESHOLD = 5;
```

Dentro de `DesignerPlate`, sustituye:

```ts
  const designs = sortDesigns(designer.designs);
  const active = designer.designs.filter((d) => d.status === 'BACKLOG').length;
  const overloaded = active > OVERLOAD_THRESHOLD;
```

por:

```ts
  const designs = sortDesigns(designer.designs);
  const backlog = designer.designs.filter((d) => d.status === 'BACKLOG');
  const loadWeight = sumWeight(backlog);
  const capacity = designer.weekly_capacity;
  const loadPct = capacity > 0 ? Math.round((loadWeight / capacity) * 100) : 0;
  const overloaded = loadPct > 100;
```

Sustituye la línea del conteo:

```tsx
            <p className="font-mono tabular text-xs text-muted-foreground">{active} activas</p>
```

por (peso/capacidad + %):

```tsx
            <p className="font-mono tabular text-xs text-muted-foreground">
              {loadWeight}/{capacity} · {loadPct}%
            </p>
```

(La insignia "Sobrecarga" ya usa `overloaded`, ahora ligada a `loadPct > 100` — no cambia su JSX.)

- [ ] **Step 3: Verificar**

Run: `npm run type-check`
Expected: sin errores.

Run: `npm run lint`
Expected: sin errores ni warnings (confirma que `OVERLOAD_THRESHOLD` ya no se referencia en ningún sitio).

Run: `npm run build`
Expected: build exitoso.

- [ ] **Step 4: Commit**

```bash
git add lib/hooks/use-team-data.ts "app/(dashboard)/equipo/page.tsx"
git commit -m "feat(equipo): carga del equipo como % de capacidad semanal"
```

---

### Task 5: Detalle del diseñador — stat de carga ponderada

**Files:**
- Modify: `app/(dashboard)/equipo/[id]/page.tsx`

**Interfaces:**
- Consumes de la Task 1: `sumWeight`. De la Task 4: `designer.weekly_capacity` (ya disponible en `useTeamData`).
- Produces: nada.

- [ ] **Step 1: Añadir el import**

En `app/(dashboard)/equipo/[id]/page.tsx`, junto a los imports de `@/lib/...`:

```ts
import { sumWeight } from '@/lib/services/designs/weekly-load';
```

- [ ] **Step 2: Calcular la carga de la semana**

Tras las líneas que ya calculan `backlog`/`delivered` (líneas ~80-81):

```ts
  const backlog = designs.filter((d) => d.status === 'BACKLOG');
  const delivered = designs.filter((d) => d.status === 'DELIVERED');
```

añade:

```ts
  const loadWeight = sumWeight(backlog);
  const capacity = designer?.weekly_capacity ?? 10;
  const loadPct = capacity > 0 ? Math.round((loadWeight / capacity) * 100) : 0;
```

- [ ] **Step 3: Añadir el stat "Carga" al resumen de la semana**

En el bloque del resumen (`{/* Resumen de la semana */}`), añade un cuarto stat tras el de "Entregados" (tras su `</div>` de cierre, dentro del `<div className="flex flex-wrap gap-xl">`):

```tsx
            <div>
              <Eyebrow>Carga</Eyebrow>
              <p
                className={cn(
                  'font-mono tabular text-3xl font-semibold leading-tight',
                  loadPct > 100 ? 'text-status-warning' : 'text-foreground'
                )}
              >
                {loadPct}%
              </p>
              <p className="font-mono tabular text-xs text-muted-foreground">
                {loadWeight}/{capacity}
              </p>
            </div>
```

- [ ] **Step 4: Añadir el import de `cn`**

El stat nuevo usa `cn`, que este archivo **no** importa todavía. Añade junto a los otros imports de `@/lib/...`:

```ts
import { cn } from '@/lib/utils';
```

- [ ] **Step 5: Verificar**

Run: `npm run type-check`
Expected: sin errores.

Run: `npm run lint`
Expected: sin errores ni warnings.

Run: `npm run build`
Expected: build exitoso.

- [ ] **Step 6: Commit**

```bash
git add "app/(dashboard)/equipo/[id]/page.tsx"
git commit -m "feat(equipo): stat de carga ponderada en el detalle del diseñador"
```

---

### Task 6: Verificación final de la Fase 2

**Files:** ninguno nuevo — verificación end-to-end de las Tasks 1-5.

**Interfaces:**
- Consumes: el resultado combinado de las Tasks 1-5.
- Produces: confirmación de que la Fase 2 está lista para revisión de rama + merge.

- [ ] **Step 1: Suite + verificación estática completa**

Run: `npm test`
Expected: todos los tests en verde, salida limpia.

Run: `npm run type-check && npm run lint && npm run build`
Expected: los tres sin errores.

- [ ] **Step 2: Verificación manual en navegador**

Arranca `npm run build && npm run start` (nunca `next dev` para validar) y, como admin:

1. **Team page (`/equipo`)** — cada diseñador muestra ahora `peso/capacidad · %` en vez de "N activas". Cambia de semana con el WeekNav y confirma que el % refleja solo los diseños **pendientes** de esa semana (los entregados, tachados, no suman al %).
2. **Reparto ponderado** — crea en el diálogo de lote 2 diseños de la misma semana: uno tipo `matchday` (peso 1) para un diseñador concreto y otro tipo `cv`/`presentacion_captacion` (peso 4) en "Automático". Repite creando varios en automático y confirma que el reparto tiende a igualar **peso**, no número de piezas (a un diseñador con una pieza pesada no se le encasqueta otra hasta que el resto alcanza su peso).
3. **Semana distinta** — crea un diseño en automático con fecha de **otra** semana y confirma que su asignación se decide por la carga de **esa** semana, no la actual (un diseñador "lleno" esta semana puede recibirlo si esa otra semana está libre).
4. **Detalle del diseñador (`/equipo/[id]`)** — el resumen muestra el stat "Carga" con el % y `peso/capacidad`.

- [ ] **Step 3: Confirmar coherencia del %**

Verifica en un caso concreto que el % que la Team page muestra para un diseñador en la semana W usa el mismo conjunto (no entregados de W) y el mismo peso que usó el algoritmo al asignarle esos diseños — es el objetivo central de la fase.

- [ ] **Step 4: Actualizar la memoria del proyecto**

Marca en la memoria (`project_pending_design_creation_redesign.md`) que la Fase 2 (asignación ponderada + Team page) está completada, con fecha y commits, y que el siguiente paso es la Fase 3 (flujo de tarjetas). No es un paso de código — es la actualización de memoria persistente descrita en las instrucciones del proyecto.
