# Superficies iOS 26 — Fase 1 · Plan de implementación

> **Para agentes:** SUB-SKILL OBLIGATORIA: usa superpowers:subagent-driven-development (recomendado) o superpowers:executing-plans para implementar tarea a tarea. Los pasos usan casillas (`- [ ]`) para seguimiento.

**Objetivo:** sustituir la agrupación por borde por agrupación por tono en móvil, con dos estilos de lista y separadores sangrados, sin tocar el escritorio.

**Arquitectura:** dos componentes de presentación nuevos (`<Surface>`, `<Row>`) que en `<md` aplican el modelo iOS (bloque tonal sin borde o lista a sangre) y a partir de `md:` restauran exactamente el aspecto actual de escritorio. La lógica de clases y el cálculo de radios concéntricos viven en un módulo puro `.ts` con tests; los componentes solo lo consumen.

**Stack:** Next.js App Router, React 18, Tailwind, `cn()` (clsx + tailwind-merge), Vitest en entorno node.

## Restricciones globales

- **El escritorio no cambia.** Todo estilo iOS va sin prefijo o bajo el breakpoint móvil; a partir de `md:` (768px) se restaura el aspecto actual: `border border-border`, **`rounded-2xl`**, `shadow-raised`. Cualquier diferencia visible en `>=md` es un fallo de la tarea.
- **Ojo con el radio de escritorio:** las 27 superficies que se migran usan hoy `rounded-2xl` (16px), **no** `rounded-lg`. `rounded-lg` es `var(--radius)` = 0.625rem = 10px y lo usa el componente `<Card>` de shadcn, que es otra cosa. `<Surface>` debe restaurar `md:rounded-2xl`; solo los `<Card>` de la Task 7 conservan `md:rounded-lg`.
- **Frontera de breakpoint:** `md` (768px). El spec define móvil como `<md`. Entre 640 y 767px se aplica el estilo iOS con los paddings `sm:` que ya existen en `PageContainer`.
- **Los 70 tests existentes siguen pasando** (8 archivos; 77 tras la Task 1). `npm test` debe terminar en verde en cada commit.
- **`npm run type-check` limpio** en cada commit.
- **Vitest solo recoge `*.test.ts`** (entorno node, sin jsdom). No escribas tests de componentes React: no hay infraestructura. La lógica testeable se extrae a `.ts` puro.
- **Radio exterior de superficie: 22px.** Radio interior = exterior − padding, mínimo 4px.
- **Textos de UI en español**, con tildes correctas.
- **Mensajes de commit en español, sin tildes** (patrón del repo: `fix(movil): ...`, `feat(tipografia): ...`).
- **Stage por rutas explícitas.** Nunca `git add -A` ni `git add .` — hay riesgo de commits concurrentes en este repo.
- **El separador va SIEMPRE dentro del `<li>`, nunca como su hermano.** `<ul>` solo admite `<li>` como hijo: un `<div>` suelto entre elementos es HTML inválido. Cuando el `<li>` ya es un contenedor flex horizontal, mueve sus clases a un `<div>` interior y deja el `<li>` como envoltorio limpio:

```tsx
<li key={x.id}>
  <div className="flex items-center gap-3 …">{/* contenido de la fila */}</div>
  {i < items.length - 1 && <RowSeparator inset="leading" />}
</li>
```

  Si el `<li>` es un `motion.li` con `layout`, el envoltorio interior no interfiere: la animación sigue midiendo el `<li>`.

---

## Estructura de archivos

| Archivo | Responsabilidad |
|---|---|
| `lib/ui/surface-variants.ts` | **Crear.** Lógica pura: clases por variante y `concentricRadius()`. Sin React. |
| `lib/ui/surface-variants.test.ts` | **Crear.** Tests de la lógica pura. |
| `components/ui/surface.tsx` | **Crear.** `<Surface>` — consume el módulo puro. |
| `components/ui/row.tsx` | **Crear.** `<Row>` y `<RowSeparator>`. |
| `tailwind.config.ts` | **Modificar.** Token `borderRadius.surface`. |
| `app/(dashboard)/mi-semana/page.tsx` | **Modificar.** Primer consumidor. |
| `components/features/dashboard/designer-dashboard.tsx` | **Modificar.** KPIs a bloque único, cola a `plain`. |
| `components/features/dashboard/admin-dashboard.tsx` | **Modificar.** Mismo tratamiento. |
| `app/(dashboard)/equipo/page.tsx` | **Modificar.** |
| `app/(dashboard)/equipo/[id]/page.tsx` | **Modificar.** |
| `app/(dashboard)/ajustes/page.tsx` | **Modificar.** |
| `components/features/designs/designs-filters.tsx` | **Modificar.** Quitar la tarjeta envolvente en móvil. |

---

## Task 1: Módulo puro de variantes y concentricidad

**Files:**
- Create: `lib/ui/surface-variants.ts`
- Test: `lib/ui/surface-variants.test.ts`
- Modify: `tailwind.config.ts` (bloque `borderRadius`, línea ~107)

**Interfaces:**
- Produces: `type SurfaceVariant = 'grouped' | 'plain'`; `surfaceClasses(variant: SurfaceVariant): string`; `concentricRadius(outer: number, padding: number, min?: number): number`; constantes `SURFACE_RADIUS_PX = 22`, `SURFACE_PADDING_PX = 16`.

- [ ] **Step 1: Escribe el test que falla**

Crea `lib/ui/surface-variants.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  concentricRadius,
  surfaceClasses,
  SURFACE_RADIUS_PX,
  SURFACE_PADDING_PX,
} from './surface-variants';

describe('concentricRadius', () => {
  it('resta el padding al radio exterior', () => {
    expect(concentricRadius(22, 16)).toBe(6);
  });

  it('nunca baja del minimo, aunque el padding se coma el radio', () => {
    expect(concentricRadius(12, 16)).toBe(4);
    expect(concentricRadius(12, 16, 2)).toBe(2);
  });

  it('el radio interior por defecto del sistema es 6px', () => {
    expect(concentricRadius(SURFACE_RADIUS_PX, SURFACE_PADDING_PX)).toBe(6);
  });

  it('no devuelve nunca un hijo mas redondo que su padre', () => {
    for (let outer = 4; outer <= 40; outer += 2) {
      for (let pad = 0; pad <= 24; pad += 4) {
        expect(concentricRadius(outer, pad)).toBeLessThanOrEqual(Math.max(outer, 4));
      }
    }
  });
});

describe('surfaceClasses', () => {
  it('grouped agrupa por tono, sin borde, en movil', () => {
    const c = surfaceClasses('grouped');
    expect(c).toContain('bg-card');
    expect(c).toContain('rounded-surface');
    expect(c).not.toMatch(/(^|\s)border(\s|$)/);
    expect(c).not.toMatch(/(^|\s)shadow-raised(\s|$)/);
  });

  it('plain no pinta superficie en movil', () => {
    const c = surfaceClasses('plain');
    expect(c).toContain('bg-transparent');
    expect(c).not.toContain('rounded-surface');
  });

  it('ambas variantes restauran el escritorio actual bajo md:', () => {
    for (const v of ['grouped', 'plain'] as const) {
      const c = surfaceClasses(v);
      expect(c).toContain('md:border');
      expect(c).toContain('md:border-border');
      expect(c).toContain('md:bg-card');
      expect(c).toContain('md:rounded-2xl');
      expect(c).toContain('md:shadow-raised');
    }
  });
});
```

- [ ] **Step 2: Ejecuta el test y comprueba que falla**

```bash
npm test -- lib/ui/surface-variants.test.ts
```

Esperado: FAIL — `Cannot find module './surface-variants'`.

- [ ] **Step 3: Implementación mínima**

Crea `lib/ui/surface-variants.ts`:

```ts
/**
 * Superficies iOS 26 — logica pura, sin React.
 *
 * Regla (spec §3 R2): en movil se agrupa por TONO, no por borde. A partir de
 * md: se restaura el aspecto de escritorio actual, que no entra en esta fase.
 */

export type SurfaceVariant = 'grouped' | 'plain';

/** Radio exterior de una superficie agrupada, en px. */
export const SURFACE_RADIUS_PX = 22;
/** Padding interior estandar de una superficie, en px. */
export const SURFACE_PADDING_PX = 16;

/**
 * Radio concentrico: el hijo comparte centro de curvatura con el padre.
 * radio_interior = radio_exterior - padding (spec §3 R4).
 */
export function concentricRadius(outer: number, padding: number, min = 4): number {
  return Math.max(min, outer - padding);
}

/** Clases que restauran el escritorio actual. Identicas para ambas variantes. */
const DESKTOP = 'md:border md:border-border md:bg-card md:rounded-2xl md:shadow-raised';

export function surfaceClasses(variant: SurfaceVariant): string {
  const mobile =
    variant === 'grouped'
      ? 'bg-card rounded-surface overflow-hidden'
      : 'bg-transparent';
  return `${mobile} ${DESKTOP}`;
}
```

- [ ] **Step 4: Añade el token de radio a Tailwind**

En `tailwind.config.ts`, dentro de `theme.extend.borderRadius` (línea ~107), añade `surface` conservando lo que ya hay:

```ts
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        // Superficie agrupada iOS — exterior del modelo concentrico (22px).
        // El interior se deriva restando el padding: ver concentricRadius().
        surface: '22px',
      },
```

- [ ] **Step 5: Ejecuta los tests y comprueba que pasan**

```bash
npm test -- lib/ui/surface-variants.test.ts
npm test
npm run type-check
```

Esperado: el archivo nuevo en verde, y los 70 tests previos siguen pasando (77 en total).

- [ ] **Step 6: Commit**

```bash
git add lib/ui/surface-variants.ts lib/ui/surface-variants.test.ts tailwind.config.ts
git commit -m "$(cat <<'EOF'
feat(superficies): logica de variantes y radios concentricos

Modulo puro con las clases por variante (grouped/plain) y el calculo de
radio concentrico. Movil agrupa por tono; md: restaura el escritorio.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01GBqC8cqr9ghGpdJpidJtRc
EOF
)"
```

---

## Task 2: Componente `<Surface>`

**Files:**
- Create: `components/ui/surface.tsx`

**Interfaces:**
- Consumes: `surfaceClasses`, `SurfaceVariant` de `lib/ui/surface-variants`.
- Produces: `<Surface variant padded as className>`; props `{ variant?: SurfaceVariant; padded?: boolean; as?: 'div' | 'section'; className?: string; children: ReactNode }`. Por defecto `variant='grouped'`, `padded=true`, `as='div'`.

- [ ] **Step 1: Crea el componente**

Crea `components/ui/surface.tsx`:

```tsx
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { surfaceClasses, type SurfaceVariant } from '@/lib/ui/surface-variants';

interface SurfaceProps {
  /** 'grouped' = bloque tonal (grupos con significado). 'plain' = a sangre (misma fila repetida). */
  variant?: SurfaceVariant;
  /** Padding interior. Desactivalo cuando la superficie contenga solo <Row>, que ya trae el suyo. */
  padded?: boolean;
  as?: 'div' | 'section';
  className?: string;
  children: ReactNode;
}

/**
 * Superficie de contenido (spec §8.1).
 *
 * Movil: agrupa por tono, sin borde ni sombra — el borde repetiria lo que el
 * tono ya dice. Escritorio (md:): intacto respecto a hoy.
 *
 * No lleva NUNCA glass: es capa de contenido, no funcional (spec §3 R1).
 */
export function Surface({
  variant = 'grouped',
  padded = true,
  as: Tag = 'div',
  className,
  children,
}: SurfaceProps) {
  return (
    <Tag
      className={cn(
        surfaceClasses(variant),
        // grouped: padding en movil y escritorio. plain: solo en escritorio,
        // porque en movil el padding lo pone cada <Row>.
        padded && (variant === 'grouped' ? 'p-md sm:p-lg' : 'md:p-lg'),
        className
      )}
    >
      {children}
    </Tag>
  );
}
```

- [ ] **Step 2: Comprueba tipos**

```bash
npm run type-check
```

Esperado: sin errores.

- [ ] **Step 3: Commit**

```bash
git add components/ui/surface.tsx
git commit -m "$(cat <<'EOF'
feat(superficies): componente Surface

Bloque tonal (grouped) o a sangre (plain) en movil; escritorio sin cambios.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01GBqC8cqr9ghGpdJpidJtRc
EOF
)"
```

---

## Task 3: Componentes `<Row>` y `<RowSeparator>`

**Files:**
- Create: `components/ui/row.tsx`

**Interfaces:**
- Produces: `<Row leading trailing subtitle onClick className children>` y `<RowSeparator inset className>`.
  - `RowProps = { leading?: ReactNode; trailing?: ReactNode; subtitle?: ReactNode; onClick?: () => void; className?: string; children: ReactNode }`
  - `RowSeparatorProps = { inset?: 'text' | 'leading' }` — `'text'` (por defecto) sangra 16px; `'leading'` sangra 44px, para listas con icono o avatar.

- [ ] **Step 1: Crea el componente**

Crea `components/ui/row.tsx`:

```tsx
'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface RowProps {
  /** Punto de urgencia, avatar o icono. */
  leading?: ReactNode;
  /** Valor, fecha o chevron. */
  trailing?: ReactNode;
  subtitle?: ReactNode;
  onClick?: () => void;
  className?: string;
  children: ReactNode;
}

/**
 * Fila de lista (spec §8.2).
 *
 * Altura minima de 44px (objetivo tactil del HIG) y la fila ENTERA es la zona
 * de toque: nada de botones diminutos dentro.
 */
export function Row({ leading, trailing, subtitle, onClick, className, children }: RowProps) {
  const content = (
    <>
      {leading}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{children}</span>
        {subtitle ? (
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">{subtitle}</span>
        ) : null}
      </span>
      {trailing}
    </>
  );

  const base = cn(
    'flex min-h-[44px] w-full items-center gap-3 px-md py-2 text-left transition-colors',
    'md:min-h-0 md:px-2',
    onClick && 'hover:bg-muted/40 active:bg-muted',
    className
  );

  if (!onClick) return <div className={base}>{content}</div>;

  return (
    // El foco necesita su PROPIA senal: `bg-muted/40` es identico al hover y en
    // oscuro son 2,4 puntos de luminancia sobre el lienzo — invisible con teclado.
    // Se usa el anillo que ya es convencion del repo (14 usos), con `ring-inset`
    // porque la fila vive dentro de un bloque con overflow-hidden.
    <button
      type="button"
      onClick={onClick}
      className={cn(
        base,
        'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset'
      )}
    >
      {content}
    </button>
  );
}

interface RowSeparatorProps {
  /**
   * 'text' — sangra hasta donde empieza el texto (16px).
   * 'leading' — sangra pasado el avatar o icono (44px).
   * Nunca va de borde a borde: eso encerraria en vez de separar (spec §3 R3).
   */
  inset?: 'text' | 'leading';
  className?: string;
}

export function RowSeparator({ inset = 'text', className }: RowSeparatorProps) {
  return (
    <div
      aria-hidden
      className={cn(
        'h-px bg-border',
        inset === 'leading' ? 'ml-[44px]' : 'ml-md',
        // En escritorio la separacion la siguen haciendo el hover y el espaciado.
        'md:hidden',
        className
      )}
    />
  );
}
```

- [ ] **Step 2: Comprueba tipos**

```bash
npm run type-check
```

- [ ] **Step 3: Commit**

```bash
git add components/ui/row.tsx
git commit -m "$(cat <<'EOF'
feat(superficies): componentes Row y RowSeparator

Fila de 44px con zona tactil completa y separador sangrado al texto.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01GBqC8cqr9ghGpdJpidJtRc
EOF
)"
```

---

## Task 4: Migrar `/mi-semana`

Primer consumidor real. Si algo del diseño de la API falla, se descubre aquí.

**Files:**
- Modify: `app/(dashboard)/mi-semana/page.tsx` (secciones en líneas 128-131 y 204-207)

**Interfaces:**
- Consumes: `<Surface>` de Task 2, `<Row>` y `<RowSeparator>` de Task 3.

- [ ] **Step 1: Importa los componentes nuevos**

En `app/(dashboard)/mi-semana/page.tsx`, junto a los demás imports de `@/components/ui/`:

```tsx
import { Surface } from '@/components/ui/surface';
import { RowSeparator } from '@/components/ui/row';
```

- [ ] **Step 2: «Pendientes» pasa a `plain`**

Sustituye la apertura de la sección de pendientes (línea ~128):

```tsx
          <motion.section
            variants={rise}
            className="rounded-2xl border border-border bg-card p-md shadow-raised sm:p-lg"
          >
```

por:

```tsx
          <Surface as="section" variant="plain">
```

Y su cierre `</motion.section>` por `</Surface>`.

Nota: la sección pierde la animación `rise` al dejar de ser `motion.section`. Recupérala envolviendo: `<motion.div variants={rise}>` por fuera del `<Surface>`, y cierra `</motion.div>` después.

- [ ] **Step 3: «Entregadas» pasa a `grouped`**

Sustituye la apertura de la sección de entregadas (línea ~204) por:

```tsx
          <Surface as="section" padded={false} className="md:p-lg">
```

Cierra con `</Surface>`, envuelta igual en `<motion.div variants={rise}>`.

`padded={false}` porque el bloque solo contiene filas: en iOS las filas llegan hasta el borde del bloque y el aire lo pone cada `<Row>`. En escritorio, `md:p-lg` devuelve el respiro de hoy.

- [ ] **Step 4: Separadores entre filas pendientes**

Cambia `inProgress.map((d) => {` por `inProgress.map((d, i) => {` para disponer del índice.

El separador va **dentro** del `<li>`, nunca como hermano (ver restricciones globales). Como el `motion.li` actual ya es un contenedor flex horizontal, mueve sus clases visuales a un `<div>` interior y deja el `motion.li` con solo las props de animación:

```tsx
<motion.li
  key={d.id}
  layout
  exit={{ opacity: 0, x: 24, transition: TWEENS.base }}
  transition={SPRINGS.smooth}
>
  <div className="group flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-muted/40">
    {/* el contenido actual de la fila, sin cambios */}
  </div>
  {i < inProgress.length - 1 && <RowSeparator inset="leading" />}
</motion.li>
```

- [ ] **Step 5: Verifica**

```bash
npm run type-check
npm test
```

Después, arranca y compruébalo en móvil:

```bash
npm run dev
```

Abre `http://localhost:3000/mi-semana` a 390px de ancho. Verificaciones:
- No hay borde alrededor de «Pendientes»; las filas van a sangre.
- «Entregadas» es un bloque tonal sin borde, con esquinas de 22px.
- Los separadores empiezan a 44px de la izquierda, no en el borde.
- A 1280px, la pantalla es **idéntica** a como estaba antes del cambio.

- [ ] **Step 6: Commit**

```bash
git add "app/(dashboard)/mi-semana/page.tsx"
git commit -m "$(cat <<'EOF'
refactor(mi-semana): superficies iOS en movil

Pendientes a sangre, entregadas en bloque tonal, separadores sangrados.
Escritorio sin cambios.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01GBqC8cqr9ghGpdJpidJtRc
EOF
)"
```

---

## Task 5: KPIs del panel de diseñador a bloque único

Los tres `KpiPlate` con borde propio pasan a ser **un** bloque con separadores verticales (spec §7.1). Esto es lo que resuelve de raíz el desbordamiento del eyebrow que se parcheó en `74152eb`.

**Files:**
- Modify: `components/features/dashboard/designer-dashboard.tsx` (`KpiPlate` líneas 31-56; sección KPIs líneas 129-143; secciones cola y compañeros líneas 147 y 205)

- [ ] **Step 1: Reescribe `KpiPlate` como columna sin superficie propia**

Sustituye la función `KpiPlate` (líneas 31-56) por:

```tsx
function KpiPlate({
  label,
  value,
  note,
  tone = 'default',
}: {
  label: string;
  value: string | number;
  note: string;
  tone?: keyof typeof TONE_TEXT;
}) {
  return (
    // Movil: columna de un bloque compartido, sin superficie propia — el
    // separador vertical lo pone `divide-x` del contenedor (spec §7.1).
    // Escritorio (md:): recupera su tarjeta, porque alli siguen siendo tres
    // superficies separadas y el escritorio no entra en esta fase.
    <div className="flex-1 p-sm sm:p-lg md:rounded-2xl md:border md:border-border md:bg-card md:shadow-raised">
      <p className="font-mono text-eyebrow uppercase tracking-[0.08em] text-muted-foreground sm:tracking-[0.18em]">
        {label}
      </p>
      <p className={cn('mt-2 font-mono tabular text-3xl sm:text-4xl font-semibold leading-none', TONE_TEXT[tone])}>
        {value}
      </p>
      <p className="mt-2 text-xs text-muted-foreground">{note}</p>
    </div>
  );
}
```

- [ ] **Step 2: Un solo bloque para los tres**

Sustituye la sección de KPIs (líneas 129-143) por:

```tsx
      {/* Movil: UN bloque, tres columnas separadas por hairline. Antes eran tres
          superficies con borde — 3 bordes + 3 sombras diciendo lo que el tono ya
          dice, y solo 77px utiles por tarjeta.
          Escritorio (md:): vuelve la rejilla de tres tarjetas de hoy, intacta.

          NO se usa <Surface> aqui: Surface asume que el bloque es la superficie
          en ambos tamanos, y en los KPI la superficie cambia de sitio segun el
          ancho (contenedor en movil, cada tarjeta en escritorio). */}
      <section className="flex rounded-surface bg-card divide-x divide-border md:grid md:grid-cols-3 md:gap-4 md:rounded-none md:bg-transparent md:divide-x-0">
        <KpiPlate
          label="Pendientes"
          value={activeDesigns}
          note="En tu cola esta semana"
          tone={activeDesigns > 0 ? 'primary' : 'default'}
        />
        <KpiPlate
          label="Entregadas"
          value={completedThisWeek}
          note="Esta semana"
          tone={completedThisWeek > 0 ? 'success' : 'default'}
        />
        <KpiPlate label="Completado" value={`${completionPct}%`} note="De tu semana" tone="primary" />
      </Surface>
```

Añade el import: `import { Surface } from '@/components/ui/surface';`

- [ ] **Step 3: «Tu cola» a `plain`, «Compañeros» a `grouped`**

Sustituye la apertura de la sección «Tu cola» (línea ~147):

```tsx
        <section className="rounded-2xl border border-border bg-card p-md shadow-raised sm:p-lg">
```

por:

```tsx
        <Surface as="section" variant="plain">
```

Y la de «Compañeros» (línea ~205) por:

```tsx
        <Surface as="section" variant="grouped">
```

Cierra ambas con `</Surface>`.

- [ ] **Step 4: Verifica**

```bash
npm run type-check
npm test
npm run dev
```

En `http://localhost:3000/inicio` a 390px, con una cuenta de diseñador (o «Ver como» si tu cuenta es `is_dev`):
- Los tres KPI forman **un** bloque con dos líneas verticales finas.
- La etiqueta «Completado» ya no se desborda **y el tracking del token vuelve a caber**: hay ~104px por columna en vez de 77.
- A 1280px, idéntico a antes.

- [ ] **Step 5: Commit**

```bash
git add components/features/dashboard/designer-dashboard.tsx
git commit -m "$(cat <<'EOF'
refactor(inicio): KPIs del disenador en un solo bloque

Tres columnas separadas por hairline en vez de tres superficies con borde.
Recupera ~27px de ancho por columna y resuelve de raiz el desborde del
eyebrow parcheado en 74152eb.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01GBqC8cqr9ghGpdJpidJtRc
EOF
)"
```

---

## Task 6: Panel de administrador

**Files:**
- Modify: `components/features/dashboard/admin-dashboard.tsx` (líneas 64, 148, 213, 237, 324)

Este archivo tiene **su propio `KpiPlate`**, distinto del de diseñador, y **cuatro** KPIs en rejilla 2×2 en móvil (`grid-cols-2`, `xl:grid-cols-4`), no tres en fila. No copies la solución de la Task 5 sin adaptarla.

- [ ] **Step 1: Importa los componentes**

```tsx
import { Surface } from '@/components/ui/surface';
import { RowSeparator } from '@/components/ui/row';
```

- [ ] **Step 2: `KpiPlate` propio (línea 64) pierde su superficie**

Sustituye la línea 64:

```tsx
    <div className="rounded-2xl border border-border bg-card p-md shadow-raised sm:p-lg">
```

por:

```tsx
    <div className="p-sm sm:p-lg md:rounded-2xl md:border md:border-border md:bg-card md:shadow-raised">
```

Igual que en la Task 5: en móvil la columna no tiene superficie propia (la pone el
bloque), y desde `md:` recupera su tarjeta, porque en escritorio siguen siendo
cuatro superficies separadas.

- [ ] **Step 3: Rejilla de KPIs (línea 213) pasa a bloque único 2×2**

Sustituye:

```tsx
      <section className="grid grid-cols-2 gap-2 sm:gap-4 xl:grid-cols-4">
```

por:

```tsx
      {/* Movil: un bloque, rejilla 2x2 separada por hairline interno.
          Escritorio (md:): vuelven las tarjetas sueltas con su gap, y en xl las
          cuatro columnas de hoy. La superficie cambia de sitio segun el ancho,
          por eso aqui no se usa <Surface> (ver Task 5). */}
      <section className="grid grid-cols-2 rounded-surface bg-card divide-x divide-y divide-border md:gap-4 md:rounded-none md:bg-transparent md:divide-x-0 md:divide-y-0 xl:grid-cols-4">
```

Cierra con `</section>`. Mismo criterio que en la Task 5: **no uses `<Surface>` para los KPI**, porque en escritorio la superficie la lleva cada tarjeta y no el contenedor.

- [ ] **Step 4: Banner de reparto (línea 148) conserva el tinte, pierde el borde**

Sustituye:

```tsx
        <section className="flex flex-col gap-4 rounded-2xl border border-primary/20 bg-card p-md shadow-raised sm:p-lg md:flex-row md:items-center md:justify-between">
```

por:

```tsx
        <section className="flex flex-col gap-4 rounded-surface bg-primary/[0.07] p-md sm:p-lg md:flex-row md:items-center md:justify-between md:border md:border-primary/20 md:bg-card md:shadow-raised">
```

Es la acción primaria del panel, así que se gana el tinte (spec §3 R6) — pero con fondo tintado, no con borde.

- [ ] **Step 5: Las dos listas (líneas 237 y 324) pasan a `plain`**

Sustituye ambas apariciones de:

```tsx
        <section className="rounded-2xl border border-border bg-card p-md shadow-raised sm:p-lg">
```

por:

```tsx
        <Surface as="section" variant="plain">
```

Cierra ambas con `</Surface>`. Son la cola de próximas entregas y la carga por diseñador: misma fila repetida, luego `plain`.

- [ ] **Step 6: Separadores en esas dos listas**

En el `<ul>` de la línea ~258 (`upcoming.map`) y el de la ~331 (`designerLoads.slice(0, 5).map`), añade el índice al `map` e inserta entre elementos:

```tsx
{i < arr.length - 1 && <RowSeparator inset="leading" />}
```

donde `arr` es `upcoming` o `designerLoads.slice(0, 5)` según el caso. Extrae este último a una constante antes del `map` para no recortar dos veces.

- [ ] **Step 7: Verifica**

```bash
npm run type-check && npm test && npm run dev
```

En `/inicio` con cuenta ADMIN a 390px y a 1280px. Comprueba que los cuatro KPI forman una sola rejilla con líneas internas, y que en `xl` vuelven a ser cuatro columnas seguidas.

- [ ] **Step 8: Commit**

```bash
git add components/features/dashboard/admin-dashboard.tsx
git commit -m "$(cat <<'EOF'
refactor(inicio): superficies iOS en el panel de administrador

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01GBqC8cqr9ghGpdJpidJtRc
EOF
)"
```

---

## Task 7: `/equipo` y `/equipo/[id]`

**Files:**
- Modify: `app/(dashboard)/equipo/page.tsx`
- Modify: `app/(dashboard)/equipo/[id]/page.tsx`
- Modify: `components/features/team/designer-card.tsx`

- [ ] **Step 1: Tarjeta de diseñador en `/equipo` (línea 59)**

Sustituye:

```tsx
      className="rounded-2xl border border-border bg-card p-md shadow-raised sm:p-lg"
```

por:

```tsx
      className="rounded-surface bg-card p-md sm:p-lg md:border md:border-border md:rounded-2xl md:shadow-raised"
```

Es una `motion.section` con más props, así que aquí se toca solo el `className` en lugar de envolver en `<Surface>`.

- [ ] **Step 2: Lista de diseños dentro de esa tarjeta**

En el `<ul>` de esa misma sección (filas con `min-h-11`, líneas ~98-135), añade el índice al `map` e inserta entre elementos:

```tsx
{i < items.length - 1 && <RowSeparator inset="leading" />}
```

Importa `RowSeparator` de `@/components/ui/row`. Usa el nombre real del array del `map` en lugar de `items`.

- [ ] **Step 3: `designer-card.tsx` (línea 37) y ficha de `/equipo/[id]` (línea 91)**

Ambos son `<Card>`. Añádeles el className que quita el borde en móvil y lo conserva en escritorio:

```tsx
className="rounded-surface border-0 shadow-none md:rounded-lg md:border md:border-border md:shadow-raised"
```

`Card` ya trae `rounded-lg border border-border bg-card`; `cn()` resuelve el conflicto a favor de lo que se pasa por `className`.

- [ ] **Step 4: Estados vacíos — NO tocar**

Los `<Card>` de `/equipo` línea 201, y de `/equipo/[id]` líneas 182 y 236, son estados vacíos. **Déjalos exactamente como están.** Entran en una fase posterior junto al resto de estados; tocarlos aquí mezclaría dos cambios que se validan distinto.

- [ ] **Step 5: Verifica**

```bash
npm run type-check && npm test && npm run dev
```

En `/equipo` con cuenta ADMIN a 390px y 1280px, y entra en una ficha.

- [ ] **Step 6: Commit**

```bash
git add "app/(dashboard)/equipo/page.tsx" "app/(dashboard)/equipo/[id]/page.tsx" components/features/team/designer-card.tsx
git commit -m "$(cat <<'EOF'
refactor(equipo): superficies iOS en movil

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01GBqC8cqr9ghGpdJpidJtRc
EOF
)"
```

---

## Task 8: `/ajustes` y barra de filtros

Ajustes es la pantalla que más se acerca al patrón de Apple sin esfuerzo (spec §7.6).

**Files:**
- Modify: `app/(dashboard)/ajustes/page.tsx` (componente `Section`, línea 28)
- Modify: `components/features/designs/designs-filters.tsx` (contenedor, línea 74)

La píldora de pestañas General/Miembros (línea ~97) **no se toca**. Es capa funcional, no
capa de contenido: un control segmentado conserva su superficie propia en iOS, igual que la
`MobileTabBar` conserva su cristal. Retirarle el borde en móvil la dejaría indistinguible de
texto suelto. Esta fase solo retira los bordes que agrupan **contenido**.

- [ ] **Step 1: `Section` de ajustes pasa a `grouped`**

El componente `Section` está en la **línea 28** de `app/(dashboard)/ajustes/page.tsx`. Envuelve **solo** `{children}` en `<Surface variant="grouped">`, dejando `label` y `hint` **fuera**: son la cabecera y el pie de sección de iOS, y van sobre el lienzo, nunca dentro del bloque. Ése es justo el detalle que hace que Ajustes se lea como Ajustes.

El `div` que sustituyes lleva `mt-3` además de las clases de superficie. Ese margen **no es** parte de la superficie y no lo aporta `Surface`: pásalo tú, `<Surface variant="grouped" className="mt-3">`, o el bloque se pegará al `hint`. El resto de sus clases (`rounded-2xl border border-border bg-card p-md shadow-raised sm:p-lg`) sí las cubre `Surface` con `padded` por defecto.

Añade `import { Surface } from '@/components/ui/surface';`

- [ ] **Step 2: Quita la tarjeta envolvente de los filtros en móvil**

En `components/features/designs/designs-filters.tsx` línea 74, sustituye:

```tsx
    <div className="rounded-2xl border border-border bg-card p-md shadow-raised">
```

por:

```tsx
    <Surface variant="plain" padded={false} className="md:p-md">
```

Añade el import y cierra con `</Surface>`. En móvil la búsqueda queda sobre el lienzo; en escritorio conserva su tarjeta.

`variant="plain"` es obligatorio aquí, no un adorno: la variante por defecto es `grouped`, que en móvil pinta `bg-card rounded-surface` — un bloque de color ceñido al campo y sin padding, que es peor que cualquiera de las dos opciones. `plain` da `bg-transparent`, que es lo que significa «sobre el lienzo». En `md:` ambas variantes son idénticas, así que el escritorio no lo nota.

- [ ] **Step 3: Verifica**

```bash
npm run type-check && npm test && npm run dev
```

En `/ajustes` y `/disenos` a 390px y 1280px.

- [ ] **Step 4: Commit**

```bash
git add "app/(dashboard)/ajustes/page.tsx" components/features/designs/designs-filters.tsx
git commit -m "$(cat <<'EOF'
refactor(ajustes): secciones agrupadas al estilo iOS

Cabecera y pie de seccion sobre el lienzo; el bloque solo envuelve los campos.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01GBqC8cqr9ghGpdJpidJtRc
EOF
)"
```

---

## Task 9: Barrido final y verificación de la fase

- [ ] **Step 1: Busca superficies de agrupación que hayan quedado sueltas**

```bash
grep -rn "rounded-2xl border border-border bg-card" app components --include="*.tsx"
```

Esperado: solo coincidencias en `components/skeletons/**`. Los skeletons deben reflejar la forma nueva, así que actualízalos para que usen `bg-card rounded-surface` sin borde en móvil — si un skeleton pinta un borde que el contenido real ya no tiene, se ve un salto al cargar.

- [ ] **Step 2: Comprueba que no quedan sombras de agrupación en contenido**

```bash
grep -rn "shadow-raised" app components --include="*.tsx"
```

`shadow-raised` solo debe sobrevivir en `md:` (escritorio) y en capa funcional. Si aparece sin prefijo en una superficie de contenido, quítalo: la elevación es de la capa funcional (spec §3 R1).

- [ ] **Step 3: Reindentar los bloques `motion.div` / `Surface`**

Las migraciones dejaron indentación desalineada donde `<Surface>` se envuelve en `<motion.div variants={rise}>` — el hijo queda al mismo nivel que el padre. Empezó en `app/(dashboard)/mi-semana/page.tsx` (bloques de las líneas ~131-201 y ~207-289) y se replica allá donde se usó el mismo patrón. No rompe nada (no hay regla de indentación en el linter ni Prettier configurado), pero deja el archivo torcido.

Recorre los archivos migrados y reindenta esos bloques a un nivel por anidamiento. Solo espacios: si el diff muestra cualquier cambio que no sea de indentación, te has pasado.

- [ ] **Step 4: Verificación completa**

```bash
npm run type-check
npm test
npm run build
```

Los tres deben pasar. `npm run build` es obligatorio: detecta errores de tipos que `type-check` puede pasar por alto en componentes de servidor.

- [ ] **Step 4: Revisión visual de las cinco pantallas**

```bash
npm run build && npm start
```

Mide en **build de producción, nunca en dev** (regla del proyecto). Recorre a 390px y luego a 1280px: `/inicio`, `/mi-semana`, `/equipo`, `/disenos`, `/ajustes`.

Criterios de aceptación de la fase:
- En móvil no queda **ningún** borde rodeando un grupo de contenido.
- Los separadores empiezan alineados con el texto, nunca en el borde de la pantalla.
- Las listas de filas repetidas van a sangre; los grupos heterogéneos son bloques tonales.
- A 1280px, las cinco pantallas son indistinguibles de `main` antes de esta fase.

- [ ] **Step 5: Commit final**

```bash
git add components/skeletons
git commit -m "$(cat <<'EOF'
refactor(skeletons): reflejar las superficies sin borde en movil

Evita el salto visual entre el esqueleto y el contenido ya cargado.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01GBqC8cqr9ghGpdJpidJtRc
EOF
)"
```

---

## Fuera de alcance en esta fase

Documentado para que nadie lo intente por iniciativa propia:

- **Cabecera colapsable y scroll edge effect** → fase 2. Toca el layout compartido de todas las páginas y es el cambio de mayor riesgo.
- **Swipe actions, pull-to-refresh, menú contextual** → fase 3.
- **Concentricidad completa, disciplina de tinte, suelo tipográfico, CSS nativo de PWA** → fase 4.
- **Sheets con detents, grabber, form sheets** → fase 5.
- **Estados vacíos y de error** → fase posterior; en esta fase los `<Card>` de estado vacío se dejan intactos a propósito.
- **Escritorio** → fase 2 del proyecto, no de este plan.

## Resultado esperado

Marcador de conformidad: **48 → 73** (spec §9, pasada 1). Las dimensiones que suben son B (superficies) de 4 a 19, C (forma) de 3 a 7 y A (capas) de 16 a 19.
