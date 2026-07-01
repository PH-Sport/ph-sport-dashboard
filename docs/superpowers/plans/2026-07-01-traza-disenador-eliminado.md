# Traza histórica del diseñador eliminado ("Exmiembro") — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que los diseños de un diseñador eliminado conserven su nombre ("Lorenzo · exmiembro") y se puedan filtrar desde una sección apartada "Exmiembros", en vez de quedar como "Sin asignar".

**Architecture:** Un trigger `BEFORE DELETE ON profiles` estampa `former_designer_id` + `former_designer_name` en los diseños del diseñador justo antes de que la FK `designer_id` (SET NULL) borre el vínculo. La UI resuelve 3 casos (activo / exmiembro / sin asignar) con un helper puro; el filtro añade una sección "Exmiembros" que solo aparece si existen.

**Tech Stack:** Next.js 15 (App Router), Supabase (Postgres + plpgsql), SWR, zod, TypeScript, Tailwind, Radix Select.

**Spec:** `docs/superpowers/specs/2026-07-01-traza-disenador-eliminado-design.md`

## Global Constraints

- **Palabra:** "exmiembro" en minúscula dentro de frase; rótulo de sección `Exmiembros`; opción de filtro `Nombre (exmiembro)`; etiqueta en diseño `Nombre · exmiembro`.
- **No tocar** la edge function `admin-delete-user` ni el flujo de borrado existente.
- **Verificación** (no hay runner de tests unitarios en el repo): `npm run type-check && npm run lint && npm run build`. La capa BD se verifica con SQL (MCP `execute_sql`); el end-to-end con Playwright.
- **`former_designer_*` solo se muestran cuando `designer_id IS NULL`** (el diseñador activo tiene prioridad absoluta).
- **Orden de despliegue:** aplicar la migración 037 a prod **antes** de borrar a Lorenzo (así sus 82 diseños se estampan solos).
- **Git:** stage por rutas explícitas (`git add <path>`), nunca `git add -A`. Cada commit termina con `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- **Proyecto Supabase:** `zhuluiqpakuwehibjyva`. Lorenzo id `9070faed-958a-46bf-a779-e72a11551be5` (82 diseños, 0 como creador).

---

### Task 1: Migración 037 — columnas `former_designer_*` + trigger de snapshot

**Files:**
- Create: `supabase/migrations/037_former_designer_snapshot.sql`

**Interfaces:**
- Produces: columnas `public.designs.former_designer_id uuid`, `public.designs.former_designer_name text`; trigger `trg_snapshot_designer_before_profile_delete` → función `public.snapshot_designer_on_profile_delete()`.

- [ ] **Step 1: Crear el fichero de migración**

`supabase/migrations/037_former_designer_snapshot.sql`:

```sql
-- 037: Traza histórica del diseñador eliminado ("Exmiembro")
-- Al borrar un perfil, estampar id + nombre del diseñador en sus diseños antes
-- de que la FK designs.designer_id (ON DELETE SET NULL) borre el vínculo.

ALTER TABLE public.designs
  ADD COLUMN IF NOT EXISTS former_designer_id   uuid,
  ADD COLUMN IF NOT EXISTS former_designer_name text;

COMMENT ON COLUMN public.designs.former_designer_id IS
  'Id (profiles.id) del diseñador cuya cuenta se eliminó. Sin FK: registro histórico. Clave estable para filtrar por exmiembro.';
COMMENT ON COLUMN public.designs.former_designer_name IS
  'display_name congelado del diseñador eliminado, para mostrar "Nombre · exmiembro".';

CREATE OR REPLACE FUNCTION public.snapshot_designer_on_profile_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  UPDATE public.designs
     SET former_designer_id   = OLD.id,
         former_designer_name = OLD.display_name
   WHERE designer_id = OLD.id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_snapshot_designer_before_profile_delete ON public.profiles;
CREATE TRIGGER trg_snapshot_designer_before_profile_delete
  BEFORE DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.snapshot_designer_on_profile_delete();
```

- [ ] **Step 2: Aplicar el DDL a prod** (MCP `execute_sql`, proyecto `zhuluiqpakuwehibjyva`) con el contenido íntegro del fichero anterior.

- [ ] **Step 3: Verificación estructural** (MCP `execute_sql`):

```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema='public' AND table_name='designs'
  AND column_name IN ('former_designer_id','former_designer_name')
ORDER BY column_name;
SELECT tgname FROM pg_trigger
WHERE tgrelid='public.profiles'::regclass AND NOT tgisinternal
  AND tgname='trg_snapshot_designer_before_profile_delete';
```
Expected: 2 filas (`former_designer_id`=uuid, `former_designer_name`=text) + 1 fila del trigger.

- [ ] **Step 4: Test funcional en transacción con ROLLBACK** (prueba el caso real de Lorenzo sin tocar nada) (MCP `execute_sql`):

```sql
BEGIN;
DELETE FROM public.profiles WHERE id = '9070faed-958a-46bf-a779-e72a11551be5';
SELECT count(*) AS stamped,
       min(former_designer_name) AS name,
       bool_and(designer_id IS NULL) AS all_nulled
FROM public.designs
WHERE former_designer_id = '9070faed-958a-46bf-a779-e72a11551be5';
ROLLBACK;
```
Expected: `stamped=82`, `name=Lorenzo`, `all_nulled=true`. (El ROLLBACK deja a Lorenzo intacto.)

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/037_former_designer_snapshot.sql
git commit -m "feat(db): trigger de snapshot del diseñador eliminado (migración 037)"
```

---

### Task 2: Tipo `Design` + helper `resolveDesigner`

**Files:**
- Modify: `lib/types/design.ts` (interface `Design`, ~línea 86-91)
- Create: `lib/utils/designer-display.ts`

**Interfaces:**
- Consumes: `Design` de `lib/types/design.ts`.
- Produces: campos `Design.former_designer_id?`, `Design.former_designer_name?`; `resolveDesigner(design, designers): ResolvedDesigner` con `ResolvedDesigner = {kind:'active';name;displayName;avatarUrl?} | {kind:'former';name} | {kind:'none'}` y `DesignerLike = {id;name;displayName;avatar_url?}`.

- [ ] **Step 1: Añadir campos al tipo `Design`**

En `lib/types/design.ts`, dentro de `interface Design`, tras `reviewed_by?: string;`:

```ts
  reviewed_by?: string; // UUID (opcional)
  former_designer_id?: string; // UUID del diseñador eliminado (registro histórico)
  former_designer_name?: string; // display_name congelado del diseñador eliminado
  delivered_at?: string; // ISO 8601 string (opcional)
```

- [ ] **Step 2: Crear el helper `resolveDesigner`**

`lib/utils/designer-display.ts`:

```ts
import type { Design } from '@/lib/types/design';

export interface DesignerLike {
  id: string;
  name: string;
  displayName: string;
  avatar_url?: string | null;
}

export type ResolvedDesigner =
  | { kind: 'active'; name: string; displayName: string; avatarUrl?: string | null }
  | { kind: 'former'; name: string }
  | { kind: 'none' };

/**
 * Resuelve quién diseñó una pieza para la UI:
 * - 'active': el diseñador sigue en el equipo (designer_id resuelve en la lista).
 * - 'former': su cuenta se eliminó; nombre congelado (former_designer_name).
 * - 'none': sin asignar (o designer_id aún no cargado en la lista).
 * El activo tiene prioridad: former_* solo cuenta cuando designer_id es null.
 */
export function resolveDesigner(
  design: Pick<Design, 'designer_id' | 'former_designer_name'>,
  designers: DesignerLike[]
): ResolvedDesigner {
  if (design.designer_id) {
    const d = designers.find((x) => x.id === design.designer_id);
    return d
      ? { kind: 'active', name: d.name, displayName: d.displayName, avatarUrl: d.avatar_url }
      : { kind: 'none' };
  }
  const former = design.former_designer_name?.trim();
  return former ? { kind: 'former', name: former } : { kind: 'none' };
}
```

- [ ] **Step 3: Verificar** — `npm run type-check`. Expected: sin errores.

- [ ] **Step 4: Commit**

```bash
git add lib/types/design.ts lib/utils/designer-display.ts
git commit -m "feat(designs): campos former_designer_* y helper resolveDesigner"
```

---

### Task 3: Filtro por exmiembro en el API

**Files:**
- Modify: `lib/api/schemas.ts` (`weekFiltersSchema`, ~línea 19-24)
- Modify: `app/api/designs/route.ts` (parse ~15-20, filtros ~40-41)
- Modify: `lib/hooks/use-designs.ts` (construcción de URL ~28-36)

**Interfaces:**
- Consumes: `weekFiltersSchema`, GET `/api/designs`.
- Produces: query param `formerDesignerId` (uuid); `useDesigns` traduce `designerFilter` con prefijo `former:` a `formerDesignerId`.

- [ ] **Step 1: Añadir `formerDesignerId` al schema**

En `lib/api/schemas.ts`, `weekFiltersSchema`:

```ts
export const weekFiltersSchema = z.object({
  weekStart: isoDate,
  weekEnd: isoDate,
  status: z.enum(DESIGN_STATUS_VALUES).optional(),
  designerId: uuid.optional(),
  formerDesignerId: uuid.optional(),
});
```

- [ ] **Step 2: Parsear y aplicar el filtro en el route**

En `app/api/designs/route.ts`, en el `safeParse`:

```ts
  const parsed = weekFiltersSchema.safeParse({
    weekStart: searchParams.get('weekStart') ?? '',
    weekEnd: searchParams.get('weekEnd') ?? '',
    status: searchParams.get('status') ?? undefined,
    designerId: searchParams.get('designerId') ?? undefined,
    formerDesignerId: searchParams.get('formerDesignerId') ?? undefined,
  });
```

Y en la construcción de la query, tras la línea `if (filters.designerId) query = query.eq('designer_id', filters.designerId);`:

```ts
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.designerId) query = query.eq('designer_id', filters.designerId);
  if (filters.formerDesignerId)
    query = query.eq('former_designer_id', filters.formerDesignerId).is('designer_id', null);
```

- [ ] **Step 3: Traducir el prefijo `former:` en `useDesigns`**

En `lib/hooks/use-designs.ts`, reemplazar el bloque de la URL:

```ts
  const url =
    weekStart && weekEnd
      ? `/api/designs?${new URLSearchParams({
          weekStart: format(weekStart, 'yyyy-MM-dd'),
          weekEnd: format(weekEnd, 'yyyy-MM-dd'),
          ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
          ...(designerFilter !== 'all'
            ? designerFilter.startsWith('former:')
              ? { formerDesignerId: designerFilter.slice('former:'.length) }
              : { designerId: designerFilter }
            : {}),
        }).toString()}`
      : null;
```

- [ ] **Step 4: Verificar** — `npm run type-check && npm run lint`. Expected: sin errores.

- [ ] **Step 5: Commit**

```bash
git add lib/api/schemas.ts app/api/designs/route.ts lib/hooks/use-designs.ts
git commit -m "feat(designs): filtro de API por former_designer_id"
```

---

### Task 4: Hook `use-former-designers`

**Files:**
- Create: `lib/hooks/use-former-designers.ts`

**Interfaces:**
- Consumes: `createClient` de `@/lib/supabase/client`.
- Produces: `useFormerDesigners(): { formerDesigners: {id:string;name:string}[]; loading; error }`.

- [ ] **Step 1: Crear el hook**

`lib/hooks/use-former-designers.ts`:

```ts
'use client';

import useSWR from 'swr';
import { createClient } from '@/lib/supabase/client';

export interface FormerDesigner {
  id: string; // former_designer_id
  name: string; // former_designer_name (display_name congelado)
}

async function fetchFormerDesigners(): Promise<FormerDesigner[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('designs')
    .select('former_designer_id, former_designer_name')
    .not('former_designer_id', 'is', null);

  if (error) throw error;

  const seen = new Map<string, string>();
  for (const row of data ?? []) {
    const id = row.former_designer_id as string | null;
    if (id && !seen.has(id)) {
      seen.set(id, (row.former_designer_name as string | null) ?? 'Exmiembro');
    }
  }
  return Array.from(seen, ([id, name]) => ({ id, name }));
}

/**
 * Exmiembros (diseñadores eliminados) que aún tienen diseños. Alimenta la
 * sección "Exmiembros" del filtro. Vacío ⇒ la sección no se pinta. Key SWR
 * propia; el filtro `.not(former_designer_id is null)` la hace barata (0 filas
 * hasta el primer borrado).
 */
export function useFormerDesigners() {
  const { data, error, isLoading } = useSWR<FormerDesigner[]>(
    'former-designers',
    fetchFormerDesigners
  );
  return {
    formerDesigners: data ?? [],
    loading: isLoading,
    error: error ? 'Error al cargar exmiembros' : null,
  };
}
```

- [ ] **Step 2: Verificar** — `npm run type-check && npm run lint`. Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add lib/hooks/use-former-designers.ts
git commit -m "feat(designs): hook use-former-designers para el filtro"
```

---

### Task 5: Sección "Exmiembros" en el filtro de diseñador

**Files:**
- Modify: `components/features/designs/designs-filters.tsx` (interface + Select de diseñador + imports)
- Modify: `app/(dashboard)/disenos/page.tsx` (cablear `useFormerDesigners` → prop)

**Interfaces:**
- Consumes: `useFormerDesigners`; componente `DesignsFilters`.
- Produces: prop `formerDesigners: {id:string;name:string}[]` en `DesignsFilters`; opciones de filtro con valor `former:<id>`.

- [ ] **Step 1: Importar `SelectGroup`, `SelectLabel`, `SelectSeparator`**

En `components/features/designs/designs-filters.tsx`, ampliar el import de select:

```ts
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
```

- [ ] **Step 2: Añadir la prop `formerDesigners` a la interface**

En `interface DesignsFiltersProps`, tras `designers: Designer[];`:

```ts
  designers: Designer[];
  formerDesigners: { id: string; name: string }[];
```

Y en la desestructuración de props del componente, añadir `formerDesigners` junto a `designers`.

- [ ] **Step 3: Renderizar la sección apartada dentro del `Select` de diseñador**

Reemplazar el `<SelectContent>` del Select de diseñador (el que lista `designers`) por:

```tsx
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {designers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.displayName}
                  </SelectItem>
                ))}
                {formerDesigners.length > 0 && (
                  <>
                    <SelectSeparator />
                    <SelectGroup>
                      <SelectLabel className="text-xs uppercase tracking-wide text-muted-foreground">
                        Exmiembros
                      </SelectLabel>
                      {formerDesigners.map((f) => (
                        <SelectItem key={`former:${f.id}`} value={`former:${f.id}`}>
                          {f.name} (exmiembro)
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </>
                )}
              </SelectContent>
```

- [ ] **Step 4: Cablear el hook en la página**

En `app/(dashboard)/disenos/page.tsx`:

Añadir import:

```ts
import { useFormerDesigners } from '@/lib/hooks/use-former-designers';
```

Tras `const { designers } = useDesigners();`:

```ts
  const { designers } = useDesigners();
  const { formerDesigners } = useFormerDesigners();
```

Y pasar la prop al componente `<DesignsFilters ... designers={designers} />` añadiendo:

```tsx
        designers={designers}
        formerDesigners={formerDesigners}
```

- [ ] **Step 5: Verificar** — `npm run type-check && npm run lint`. Expected: sin errores.

- [ ] **Step 6: Commit**

```bash
git add components/features/designs/designs-filters.tsx "app/(dashboard)/disenos/page.tsx"
git commit -m "feat(designs): seccion apartada Exmiembros en el filtro de disenador"
```

---

### Task 6: Etiqueta de exmiembro en la tabla de Diseños

**Files:**
- Modify: `components/features/designs/designs-table.tsx` (import + celda móvil ~205-219 + celda desktop ~256-299)

**Interfaces:**
- Consumes: `resolveDesigner`, `ResolvedDesigner` de `@/lib/utils/designer-display`.

- [ ] **Step 1: Importar el helper**

En `components/features/designs/designs-table.tsx`:

```ts
import { resolveDesigner } from '@/lib/utils/designer-display';
```

- [ ] **Step 2: Celda móvil — 3 casos**

Reemplazar (dentro del `.map` de la `<ul className="... md:hidden">`) la línea:

```tsx
          const designer = designers.find((d) => d.id === design.designer_id);
```
por:

```tsx
          const dz = resolveDesigner(design, designers);
```

Y la línea del nombre:

```tsx
                    <span>· {designer ? designer.displayName : 'Sin asignar'}</span>
```
por:

```tsx
                    <span>
                      ·{' '}
                      {dz.kind === 'active'
                        ? dz.displayName
                        : dz.kind === 'former'
                          ? `${dz.name} (exmiembro)`
                          : 'Sin asignar'}
                    </span>
```

- [ ] **Step 3: Celda desktop — 3 casos**

Reemplazar (dentro del `.map` del `<TableBody>`) la línea:

```tsx
              const designer = designers.find((d) => d.id === design.designer_id);
```
por:

```tsx
              const dz = resolveDesigner(design, designers);
```

Y el `<TableCell>` del diseñador (el bloque `{designer ? ( ... ) : ( <span ...>Sin asignar</span> )}`) por:

```tsx
                  <TableCell>
                    {dz.kind === 'active' ? (
                      <Hint label={dz.name}>
                        <div className="flex items-center gap-2">
                          <UserAvatar
                            name={dz.name}
                            src={dz.avatarUrl}
                            className="h-6 w-6"
                            fallbackClassName="bg-role-designer/15 text-xs font-medium text-role-designer"
                          />
                          <span className="max-w-[100px] truncate text-sm">
                            {dz.displayName}
                          </span>
                        </div>
                      </Hint>
                    ) : dz.kind === 'former' ? (
                      <div className="flex items-center gap-2">
                        <UserAvatar
                          name={dz.name}
                          className="h-6 w-6"
                          fallbackClassName="bg-muted text-xs font-medium text-muted-foreground"
                        />
                        <span className="flex max-w-[120px] items-baseline gap-1 truncate text-sm text-muted-foreground">
                          <span className="truncate">{dz.name}</span>
                          <span className="shrink-0 text-xs">· exmiembro</span>
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-status-warning">Sin asignar</span>
                    )}
                  </TableCell>
```

- [ ] **Step 4: Verificar** — `npm run type-check && npm run lint`. Expected: sin errores.

- [ ] **Step 5: Commit**

```bash
git add components/features/designs/designs-table.tsx
git commit -m "feat(designs): etiqueta 'exmiembro' en la tabla de disenos"
```

---

### Task 7: Etiqueta de exmiembro en el panel de detalle

**Files:**
- Modify: `components/features/designs/design-detail-sheet.tsx` (import + cálculo ~68-70 + cabecera diseñador ~237-249)

**Interfaces:**
- Consumes: `resolveDesigner` de `@/lib/utils/designer-display`.

- [ ] **Step 1: Importar el helper**

En `components/features/designs/design-detail-sheet.tsx`:

```ts
import { resolveDesigner } from '@/lib/utils/designer-display';
```

- [ ] **Step 2: Sustituir el cálculo del diseñador**

Reemplazar:

```tsx
  const designer = design?.designer_id
    ? designers.find((u) => u.id === design.designer_id)
    : null;
```
por:

```tsx
  const dz = design ? resolveDesigner(design, designers) : ({ kind: 'none' } as const);
```

- [ ] **Step 3: Cabecera del diseñador — 3 casos**

Reemplazar el contenido del botón (el bloque `{designer ? ( ... ) : ( <span className="text-status-warning">Sin asignar</span> )}`) por:

```tsx
                      {dz.kind === 'active' ? (
                        <>
                          <UserAvatar
                            name={dz.name}
                            src={dz.avatarUrl}
                            className="h-6 w-6"
                            fallbackClassName="bg-primary/10 font-mono text-[10px] font-semibold text-primary"
                          />
                          {dz.displayName}
                        </>
                      ) : dz.kind === 'former' ? (
                        <>
                          <UserAvatar
                            name={dz.name}
                            className="h-6 w-6"
                            fallbackClassName="bg-muted font-mono text-[10px] font-semibold text-muted-foreground"
                          />
                          <span className="text-muted-foreground">{dz.name} · exmiembro</span>
                        </>
                      ) : (
                        <span className="text-status-warning">Sin asignar</span>
                      )}
```

- [ ] **Step 4: Verificar build completo** — `npm run type-check && npm run lint && npm run build`. Expected: sin errores, todas las rutas compilan.

- [ ] **Step 5: Commit**

```bash
git add components/features/designs/design-detail-sheet.tsx
git commit -m "feat(designs): etiqueta 'exmiembro' en el panel de detalle"
```

---

## Verificación end-to-end (tras Task 7)

Manual/Playwright, sobre `next build && next start` (no `dev`):

1. Estado inicial: el filtro de Diseñador **no** muestra sección "Exmiembros" (aún no hay exmiembros).
2. Borrar a un diseñador de prueba con diseños desde Ajustes → Miembros (o, para validar sin gastar a Lorenzo, crear un diseñador desechable con 1 diseño y borrarlo).
3. Sus diseños muestran `Nombre · exmiembro` (apagado) en tabla y detalle, no "Sin asignar".
4. El filtro de Diseñador ahora muestra la sección "Exmiembros" con `Nombre (exmiembro)`; seleccionarlo aísla sus diseños.
5. Reasignar uno de esos diseños a un diseñador activo → muestra al activo y desaparece del filtro de exmiembros.

## Despliegue de la feature real

Con todo validado y en `main`: borrar a **Lorenzo** desde la UI. Sus 82 diseños quedan estampados automáticamente por el trigger y aparece "Lorenzo (exmiembro)" en el filtro.

## Self-review (cobertura del spec)

- Modelo de datos (columnas) → Task 1. ✔
- Trigger de preservación → Task 1. ✔
- Tipo `Design` + display 3 casos → Task 2 (helper), Task 6 (tabla), Task 7 (detalle). ✔
- Filtro apartado "Exmiembros" (solo si hay) → Task 4 (fuente), Task 5 (UI). ✔
- API `formerDesignerId` + guardia `.is('designer_id', null)` → Task 3. ✔
- Palabra "exmiembro" consistente → Tasks 5/6/7. ✔
- No tocar edge function → respetado (ninguna task la toca). ✔
