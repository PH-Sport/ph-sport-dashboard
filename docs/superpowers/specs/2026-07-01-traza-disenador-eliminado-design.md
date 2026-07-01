# Traza histórica del diseñador eliminado ("Exmiembro")

- **Fecha:** 2026-07-01
- **Estado:** Aprobado (pendiente de plan de implementación)
- **Autor:** Mario + Claude

## Problema

Al eliminar un usuario, la edge function `admin-delete-user` borra su cuenta
`auth` de forma irreversible. Por la FK `designs.designer_id → profiles.id ON
DELETE SET NULL`, sus diseños pierden **toda** traza del diseñador: pasan a
mostrar "Sin asignar". Queremos que, tras el borrado, esos diseños indiquen que
estaban asignados a esa persona ("Lorenzo") aunque su cuenta ya no exista, y
poder volver a verlos/filtrarlos.

Caso concreto: **Lorenzo** (id `9070faed-958a-46bf-a779-e72a11551be5`) sigue en
la BD, es DESIGNER y tiene **82 diseños** como `designer_id` (0 como creador/
revisor). Aún **no** ha sido borrado.

## Estado actual verificado (2026-07-01)

- **FK de `designs`:** `designer_id` → SET NULL, `reviewed_by` → SET NULL,
  `created_by` → RESTRICT (la edge function ya lo reasigna al Mánager antes de
  borrar).
- **`profiles.id → auth.users.id ON DELETE CASCADE`:** borrar la cuenta `auth`
  borra el perfil en cascada, lo que dispara el `SET NULL` de `designer_id`.
- **Resolución de nombre en cliente:** `GET /api/designs` hace `select('*')` y
  **no** une con `profiles`; devuelve solo `designer_id` (UUID). La UI mapea ese
  UUID contra la lista de diseñadores activos (`useDesigners`, filtra
  `role=DESIGNER`). Un diseñador borrado desaparece de esa lista → no hay forma
  de recuperar su nombre salvo que quede guardado en el propio diseño.
- **Datos:** 761 diseños, 4 diseñadores distintos, **0 huérfanos**
  (`designer_id IS NULL` = 0). Lorenzo es 1 de los 4.

## Decisiones tomadas

1. **Modelo de borrado:** borrado real (hard-delete, se mantiene la edge
   function ya desplegada) **+ snapshot del nombre en el diseño**. No se archiva
   ni se conserva el perfil.
2. **Ver diseños pasados:** además de la etiqueta visible, un filtro por
   exmiembro **apartado** (sección "Exmiembros" al fondo del selector de
   diseñador) que **solo aparece si existen exmiembros** y no estorba el
   filtrado del día a día.
3. **Palabra:** "Exmiembro" (corto, ocupa poco). Consistente en etiqueta,
   sección de filtro y opción.

## Arquitectura

### 1. Modelo de datos — migración `037`

Dos columnas nuevas en `public.designs`, **sin FK** (registro histórico; el
perfil ya no existe):

```sql
ALTER TABLE public.designs
  ADD COLUMN former_designer_id   uuid,
  ADD COLUMN former_designer_name text;

COMMENT ON COLUMN public.designs.former_designer_id IS
  'Id del diseñador (profiles.id) que tuvo asignado el diseño antes de que su cuenta se eliminara. Sin FK: es un registro histórico. Clave estable para filtrar por exmiembro.';
COMMENT ON COLUMN public.designs.former_designer_name IS
  'display_name congelado del diseñador eliminado, para mostrar "Nombre · exmiembro".';
```

Se guarda **id + nombre**: el id es la clave estable para el filtro (robusto
ante nombres repetidos); el nombre es el texto congelado a mostrar.

### 2. Preservación — trigger `BEFORE DELETE ON profiles`

La invariante "un diseño nunca pierde la identidad de su diseñador" la garantiza
la BD, sea cual sea la ruta de borrado (edge function, SQL manual, cascada).

```sql
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

CREATE TRIGGER trg_snapshot_designer_before_profile_delete
  BEFORE DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.snapshot_designer_on_profile_delete();
```

- Se ejecuta **antes** de que la cascada ponga `designer_id = NULL`, así captura
  el vínculo intacto (`designs.designer_id` aún = `OLD.id`).
- `SECURITY INVOKER` (no DEFINER): el borrado va por service-role (edge
  function), que bypassa RLS; no necesita elevación y así no añade superficie de
  ataque ni salta en los advisors.
- `OLD.display_name` está disponible (es columna generada STORED).
- **Solo diseñador.** `reviewed_by`/`created_by` quedan fuera de alcance
  (`created_by` ya lo reasigna la edge function; el usuario solo pidió el
  asignado).

### 3. Display

Tipo `Design` (`lib/types/design.ts`) gana:

```ts
former_designer_id?: string;   // UUID
former_designer_name?: string;
```

`select('*')` ya las devuelve; no hay cambios en el fetch.

La celda "Diseñador" (tabla desktop **y** lista móvil de `designs-table.tsx`) y
el panel de detalle (`design-detail-sheet.tsx`) pasan a 3 casos:

| Caso | Condición | Render |
|------|-----------|--------|
| Activo | `designers.find(id === designer_id)` | avatar azul + `displayName` (como hoy) |
| Exmiembro | si no, y `former_designer_name` presente | avatar **gris** (iniciales) + `former_designer_name` + sufijo tenue `· exmiembro` |
| Sin asignar | ninguno | `Sin asignar` (como hoy) |

El exmiembro se pinta **apagado** (iniciales en gris/muted, no el azul
`role-designer`) para que se lea de un vistazo que ya no está. El sufijo
`· exmiembro` va en `text-muted-foreground`, tamaño pequeño.

### 4. Filtro apartado "Exmiembros"

- **Fuente:** hook nuevo `lib/hooks/use-former-designers.ts` (SWR, key propia),
  que consulta los exmiembros distintos presentes en diseños:
  `SELECT DISTINCT former_designer_id, former_designer_name FROM designs WHERE former_designer_id IS NOT NULL`.
  Devuelve `{ id, name }[]`. Si está vacío, la sección no se pinta.
- **Selector** (`designs-filters.tsx`): tras los diseñadores activos y un
  separador + sub-rótulo tenue "EXMIEMBROS", una opción por exmiembro con
  `value = "former:<id>"` y label `${name} (exmiembro)`. La sección solo se
  renderiza si `formerDesigners.length > 0`.

```
Diseñador:
  Todos
  Lluís
  Pau
  José Joaquín
  ──────────────────
  EXMIEMBROS
  Lorenzo (exmiembro)
```

- **Estado del filtro:** `designerFilter` (string) admite ahora también
  `"former:<uuid>"`. `use-designs-filters.ts` **no cambia** (su estado ya es
  `string | 'all'` y `hasActiveFilters`/`resetFilters` funcionan igual).
- **API:** `weekFiltersSchema` gana `formerDesignerId` opcional (uuid).
  La traducción va en **`use-designs.ts`** (donde se arma la URL): si
  `designerFilter` empieza por `"former:"`, manda `formerDesignerId=<id>` (sin
  `designerId`); si no, como hoy. En `GET /api/designs`:

  ```ts
  if (filters.designerId)       query = query.eq('designer_id', filters.designerId);
  if (filters.formerDesignerId) query = query.eq('former_designer_id', filters.formerDesignerId)
                                             .is('designer_id', null);
  ```

  La guardia `.is('designer_id', null)` asegura que un diseño **reasignado** a un
  diseñador activo (que conserva su `former_designer_id` como registro histórico)
  ya **no** aparezca bajo el filtro del exmiembro.

## Casos borde y alcance

- **Los 82 de Lorenzo:** se estampan **solos** cuando se le borre, siempre que
  esta feature (columnas + trigger) esté aplicada **antes** del borrado. Sin
  backfill.
- **0 huérfanos hoy:** nada que arrastrar; los diseños existentes con
  `designer_id` válido no cambian.
- **Colisión de nombres:** resuelta por `former_designer_id` (clave estable);
  dos "Lorenzo" serían opciones de filtro distintas.
- **Reasignar un diseño de exmiembro:** el selector de reasignación del panel de
  detalle lista solo diseñadores activos. Reasignar pone `designer_id` a un
  activo → el diseño vuelve a mostrar al activo (el display prioriza
  `designer_id` sobre `former_designer_*`) y **sale** del filtro de exmiembros
  por la guardia `.is('designer_id', null)`. Las columnas `former_designer_*` se
  conservan intactas como registro histórico (inofensivas).
- **Touchpoints secundarios:** los dashboards de equipo tiran de diseñadores
  activos; un exmiembro no aparece ahí (correcto). Si algún punto secundario
  resolviera su nombre vía `useDesigners`, degrada con gracia a "Sin asignar".
  El alcance de display de esta feature son la **lista de Diseños (tabla +
  detalle)** y su **filtro**.
- **`reviewed_by`:** fuera de alcance (se pierde el revisor al borrar, como hoy).

## Rollout

1. Aplicar migración 037 (columnas + trigger) a prod.
2. Implementar cambios de tipo/API/UI, validar (type-check + lint + build).
3. **Solo después**, borrar a Lorenzo desde la UI → sus 82 diseños quedan
   estampados automáticamente y aparece la sección "Exmiembros" en el filtro.

## Criterios de aceptación

- Tras borrar a un diseñador con diseños asignados, esos diseños muestran
  `Nombre · exmiembro` (apagado) en lugar de "Sin asignar".
- El selector de Diseñador muestra una sección "Exmiembros" **solo** si existe
  al menos un exmiembro con diseños; seleccionar uno filtra sus diseños.
- Sin exmiembros, el selector es idéntico al actual (sin sección extra).
- Un diseño sin diseñador y sin exmiembro sigue mostrando "Sin asignar".
- La edge function `admin-delete-user` no cambia; el borrado sigue funcionando y
  conservando los diseños.

## Fuera de alcance (YAGNI)

- Archivar/soft-delete de perfiles.
- Snapshot de `reviewed_by`/`created_by`.
- Tabla `former_members` dedicada (avatar, email, etc.): basta id + nombre en el
  diseño.
- Restaurar exmiembros o reasignar sus diseños en bloque.

## Ficheros afectados

- `supabase/migrations/037_former_designer_snapshot.sql` (nuevo)
- `lib/types/design.ts` (campos `former_designer_id`/`former_designer_name`)
- `app/api/designs/route.ts` + `lib/api/schemas.ts` (`weekFiltersSchema` gana
  `formerDesignerId`)
- `lib/hooks/use-former-designers.ts` (nuevo)
- `lib/hooks/use-designs.ts` (traducción `former:<id>` → `formerDesignerId`;
  `use-designs-filters.ts` NO cambia)
- `components/features/designs/designs-filters.tsx` (sección "Exmiembros")
- `components/features/designs/designs-table.tsx` (celda diseñador: desktop +
  móvil, 3 casos)
- `components/features/designs/design-detail-sheet.tsx` (cabecera del diseñador,
  3 casos)
