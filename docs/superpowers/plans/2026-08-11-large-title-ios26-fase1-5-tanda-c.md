# Tanda C — Large title colapsable (fase 1.5, iOS 26)

> **Para agentes:** SUB-SKILL REQUERIDA: usa `superpowers:subagent-driven-development` o
> `superpowers:executing-plans` para implementar tarea a tarea. Los pasos usan casillas
> (`- [ ]`) para el seguimiento.

**Objetivo:** que la barra superior y el título de página dejen de decir lo mismo a la vez — el
título grande manda arriba del scroll y la barra recoge el testigo al desplazar, como iOS.

**Arquitectura:** un `IntersectionObserver` sobre el `<h1>` de `PageHeader` publica un booleano
en un contexto ligero; `Header` lo consume para revelar su rótulo y su borde inferior. La
transición es **CSS pura** (no framer-motion) para que el estado del servidor sea ya el correcto
y no haya parpadeo al hidratar.

**Stack:** Next.js App Router · React context · IntersectionObserver · Tailwind · vitest.

## Global Constraints

- **Desde `md:` (768px) el escritorio no cambia absolutamente nada.** En escritorio el rótulo de
  la barra y el `<h1>` siguen visibles a la vez, como hoy. El colapso es exclusivo de móvil.
- **Nunca `git add -A` ni `git add .`** — hay una sesión paralela trabajando en el rediseño de
  creación de diseños. Stage por rutas explícitas, siempre.
- **No se pueden testear componentes React** (vitest en entorno `node`, sin jsdom). La lógica que
  SÍ se puede testear se extrae a un módulo puro y se prueba de verdad (tarea C1). El resto se
  verifica con type-check, lint, build y validación visual.
- Rama de trabajo: `feat/superficies-ios26-fase1`. Al terminar, merge a `preview`.

## Solape con el trabajo paralelo

La sesión paralela (rediseño de creación de diseños, fase 5 / InfoTip) vive en
`components/features/designs/dialogs/` y `components/features/designs/cards/`. Esta tanda toca
**solo** `components/layout/` y `components/ui/page-header.tsx`. **Superficie compartida: ninguna.**
Ni una página de `app/(dashboard)/` se modifica, así que un merge posterior no debería tener
conflictos. Si aparece alguno, será en `app/(dashboard)/disenos/page.tsx`, que esta tanda **no toca**.

---

## File Structure

| Archivo | Responsabilidad |
|---|---|
| `lib/ui/section-label.ts` | **Nuevo.** Deriva el rótulo de sección desde el pathname. Lógica pura, testeada |
| `lib/ui/section-label.test.ts` | **Nuevo.** Sus tests |
| `components/layout/page-title-context.tsx` | **Nuevo.** Contexto `{ collapsed, setCollapsed }` |
| `components/ui/page-header.tsx` | Observa su `<h1>` y publica el booleano |
| `components/layout/header.tsx` | Consume el booleano: revela rótulo y borde |
| `components/layout/app-layout.tsx` | Monta el proveedor |

---

### Task C1: Extraer la derivación del rótulo, con tests

**Files:**
- Create: `lib/ui/section-label.ts`
- Create: `lib/ui/section-label.test.ts`
- Modify: `components/layout/header.tsx:9-21`

**Interfaces:**
- Produces: `sectionLabelFor(pathname: string): string` — devuelve el rótulo de la sección, o
  cadena vacía si la ruta no corresponde a ninguna.

**Por qué:** hoy el mapa vive dentro de `header.tsx` y no se puede probar. Es la única parte de
esta tanda que admite un test real; extraerla convierte «no hay tests» en «hay los que se pueden
escribir».

- [ ] **Step 1: Escribir el test que falla**

```ts
import { describe, it, expect } from 'vitest';
import { sectionLabelFor } from './section-label';

describe('sectionLabelFor', () => {
  it('deriva el rótulo del primer segmento', () => {
    expect(sectionLabelFor('/inicio')).toBe('Inicio');
    expect(sectionLabelFor('/disenos')).toBe('Diseños');
    expect(sectionLabelFor('/ajustes')).toBe('Ajustes');
  });

  it('mapea las dos vistas de semana al mismo rótulo', () => {
    expect(sectionLabelFor('/equipo')).toBe('Semana');
    expect(sectionLabelFor('/mi-semana')).toBe('Semana');
  });

  it('ignora los segmentos posteriores', () => {
    expect(sectionLabelFor('/equipo/abc-123')).toBe('Semana');
  });

  it('devuelve cadena vacía en rutas desconocidas o vacías', () => {
    expect(sectionLabelFor('/loquesea')).toBe('');
    expect(sectionLabelFor('/')).toBe('');
    expect(sectionLabelFor('')).toBe('');
  });
});
```

- [ ] **Step 2: Ejecutar y verificar que falla**

Run: `npx vitest run lib/ui/section-label.test.ts`
Esperado: FALLA con «Failed to resolve import ./section-label».

- [ ] **Step 3: Implementación mínima**

```ts
/** Rótulo de sección derivado del primer segmento de la ruta. */
const SECTION_LABELS: Record<string, string> = {
  inicio: 'Inicio',
  equipo: 'Semana',
  'mi-semana': 'Semana',
  disenos: 'Diseños',
  ajustes: 'Ajustes',
};

/**
 * Rótulo de la sección a la que pertenece `pathname`, o '' si no es ninguna.
 * Solo mira el primer segmento: /equipo/abc y /equipo son la misma sección.
 */
export function sectionLabelFor(pathname: string): string {
  const segment = pathname.split('/')[1] ?? '';
  return SECTION_LABELS[segment] ?? '';
}
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

Run: `npx vitest run lib/ui/section-label.test.ts`
Esperado: 4 tests en verde.

- [ ] **Step 5: Consumirlo desde el Header**

En `components/layout/header.tsx`, borrar la constante `SECTION_LABELS` y las dos líneas que
derivan el rótulo, e importar la función:

```tsx
import { sectionLabelFor } from '@/lib/ui/section-label';
```

```tsx
  const pathname = usePathname() ?? '';
  const sectionLabel = sectionLabelFor(pathname);
```

- [ ] **Step 6: Verificar y commitear**

```bash
npm run type-check && npm run lint && npx vitest run
git add lib/ui/section-label.ts lib/ui/section-label.test.ts components/layout/header.tsx
git commit -m "refactor(header): el rotulo de seccion sale a un modulo con tests"
```

Esperado: 81/81 tests (los 77 de antes + 4 nuevos).

---

### Task C2: El contexto y el observador

**Files:**
- Create: `components/layout/page-title-context.tsx`
- Modify: `components/layout/app-layout.tsx`
- Modify: `components/ui/page-header.tsx`

**Interfaces:**
- Produces:
  - `PageTitleProvider({ children }): JSX.Element` — monta el estado.
  - `usePageTitleCollapsed(): boolean` — lo lee (para `Header`).
  - `usePageTitleReporter(): (collapsed: boolean) => void` — lo escribe (para `PageHeader`).

**Decisión de diseño:** dos hooks en vez de uno que devuelva el par. `Header` solo lee y
`PageHeader` solo escribe; separarlos evita que el escritor se re-renderice cuando cambia el
valor, que es justo lo que provocaría un bucle con el observador.

- [ ] **Step 1: Crear el contexto**

```tsx
'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const CollapsedContext = createContext(false);
const ReporterContext = createContext<(collapsed: boolean) => void>(() => {});

/**
 * Estado compartido del large title: ¿el <h1> de la página ha pasado por debajo
 * de la barra? PageHeader lo publica (observando su propio título) y Header lo
 * consume para revelar su rótulo. Solo tiene efecto en móvil; en escritorio el
 * Header ignora el valor y muestra el rótulo siempre.
 */
export function PageTitleProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  // Identidad estable: si el reporter cambiara en cada render, el efecto que
  // monta el IntersectionObserver se re-ejecutaria en bucle.
  const report = useCallback((next: boolean) => setCollapsed(next), []);
  const reporter = useMemo(() => report, [report]);

  return (
    <ReporterContext.Provider value={reporter}>
      <CollapsedContext.Provider value={collapsed}>{children}</CollapsedContext.Provider>
    </ReporterContext.Provider>
  );
}

/** Lo lee el Header. */
export function usePageTitleCollapsed(): boolean {
  return useContext(CollapsedContext);
}

/** Lo escribe el PageHeader. */
export function usePageTitleReporter(): (collapsed: boolean) => void {
  return useContext(ReporterContext);
}
```

- [ ] **Step 2: Montar el proveedor en el layout**

En `components/layout/app-layout.tsx`, importar `PageTitleProvider` y envolver el contenido de
`SidebarProvider` con él, **por dentro** (el proveedor debe abarcar a `Header` y a `children`):

```tsx
    <SidebarProvider>
      <PageTitleProvider>
        <a href="#main-content" className="...">
          Saltar al contenido principal
        </a>
        <AppSidebar />
        <MainArea>{hydrated ? children : null}</MainArea>
        <MobileTabBar />
      </PageTitleProvider>
    </SidebarProvider>
```

- [ ] **Step 3: Observar el `<h1>` desde PageHeader**

En `components/ui/page-header.tsx`: marcar el archivo como `'use client'` (hoy no lo es; lo
necesita por el efecto), añadir el ref y el observador.

```tsx
'use client';

import { ReactNode, useEffect, useRef } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePageTitleReporter } from '@/components/layout/page-title-context';

/** Alto de la barra en móvil (h-14). El título se da por colapsado al cruzarla. */
const HEADER_HEIGHT = 56;
```

Dentro del componente, antes del `return`:

```tsx
  const titleRef = useRef<HTMLHeadingElement>(null);
  const report = usePageTitleReporter();

  useEffect(() => {
    const el = titleRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => report(!entry.isIntersecting),
      // Recorta el viewport por arriba con el alto de la barra: el titulo cuenta
      // como oculto justo cuando pasa por debajo de ella, no cuando sale de pantalla.
      { rootMargin: `-${HEADER_HEIGHT}px 0px 0px 0px`, threshold: 0 }
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      // Al desmontar (navegacion), la proxima pagina arranca arriba del todo.
      report(false);
    };
  }, [report]);
```

Y el `<h1>` recibe el ref:

```tsx
        <h1
          ref={titleRef}
          className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3"
        >
```

- [ ] **Step 4: Verificar y commitear**

```bash
npm run type-check && npm run lint && npx vitest run && npm run build
git add components/layout/page-title-context.tsx components/layout/app-layout.tsx components/ui/page-header.tsx
git commit -m "feat(movil): la pagina avisa cuando su titulo pasa bajo la barra"
```

En este punto el observador funciona pero **nada cambia visualmente**: el Header aún no consume
el valor. Es deliberado, para que C3 sea un commit revertible por sí solo.

---

### Task C3: La barra recoge el testigo

**Files:**
- Modify: `components/layout/header.tsx`

**Interfaces:**
- Consumes: `usePageTitleCollapsed()` de C2, `sectionLabelFor()` de C1.

**Los dos cambios visuales, ambos solo en móvil:**

1. **El rótulo** entra al colapsar: de `opacity-0 translate-y-1` a `opacity-100 translate-y-0`.
   En `md:` está siempre visible, exactamente como hoy.
2. **El borde inferior** de la barra aparece al desplazar (el *scroll edge effect* de iOS): arriba
   del todo la barra no tiene línea. En `md:` la línea está siempre, como hoy.

**Por qué CSS y no framer-motion:** el HTML del servidor ya sale con las clases correctas
(`collapsed` arranca en `false`), así que no hay parpadeo al hidratar. Framer aplica estilos
inline tras montar y habría producido un salto del rótulo en la primera pintura.

- [ ] **Step 1: Reescribir el Header**

```tsx
'use client';

import { usePathname } from 'next/navigation';
import { UserMenu } from './user-menu';
import { NotificationsDropdown } from './notifications-dropdown';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { RolePill } from './role-pill';
import { usePageTitleCollapsed } from './page-title-context';
import { sectionLabelFor } from '@/lib/ui/section-label';
import { cn } from '@/lib/utils';

export function Header() {
  const pathname = usePathname() ?? '';
  const sectionLabel = sectionLabelFor(pathname);
  // En movil la barra empieza desnuda y recoge el testigo del titulo grande al
  // desplazar. En escritorio nada de esto aplica: rotulo y linea, siempre.
  const collapsed = usePageTitleCollapsed();

  return (
    <header
      className={cn(
        'sticky top-0 z-30 border-b bg-background/90 backdrop-blur-sm',
        'pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] pt-[env(safe-area-inset-top)]',
        'transition-colors duration-200 ease-out-expo md:border-border',
        collapsed ? 'border-border' : 'border-transparent'
      )}
    >
      {/* Móvil: 56px de alto — aire para los controles de 44px (como las apps nativas). */}
      <div className="flex h-14 items-center justify-between gap-2 px-3 md:h-12 md:gap-4 md:px-6">
        <div className="flex min-w-0 items-center gap-2 md:gap-3">
          {/* Móvil: sin hamburguesa — la navegación vive en la MobileTabBar inferior. */}
          <span
            aria-hidden={!collapsed}
            className={cn(
              'truncate text-eyebrow text-muted-foreground',
              'transition-all duration-200 ease-out-expo',
              'md:translate-y-0 md:opacity-100',
              collapsed ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'
            )}
          >
            {sectionLabel}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <RolePill />
          <ThemeToggle />
          <NotificationsDropdown />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Comprobar la paridad de escritorio clase a clase**

```bash
git show main:components/layout/header.tsx | grep -n "md:"
grep -n "md:" components/layout/header.tsx
```

Comprobar una por una: `md:h-12`, `md:gap-4`, `md:px-6`, `md:gap-3` siguen presentes e
idénticas. Las nuevas (`md:border-border`, `md:translate-y-0`, `md:opacity-100`) existen
precisamente **para restaurar** en escritorio lo que el móvil ahora oculta.

- [ ] **Step 3: Verificar**

```bash
npm run type-check && npm run lint && npx vitest run && npm run build
```

- [ ] **Step 4: Commit**

```bash
git add components/layout/header.tsx
git commit -m "feat(movil): la barra recoge el testigo del titulo al desplazar"
```

---

### Task C4: Cierre

- [ ] **Step 1: Barrido de paridad de toda la tanda**

```bash
git diff 079da02..HEAD -- components/ | grep "^[-+].*md:"
```

Esperado: solo las tres clases `md:` **añadidas** al Header (`md:border-border`,
`md:translate-y-0`, `md:opacity-100`). Ninguna eliminada, ninguna modificada.

- [ ] **Step 2: Build y tests finales**

```bash
npm run type-check && npm run lint && npx vitest run && npm run build
```

Esperado: 81/81, build de 20 páginas.

- [ ] **Step 3: Push y merge a preview**

```bash
git push origin feat/superficies-ios26-fase1
git checkout preview && git pull --ff-only origin preview
git merge --no-ff feat/superficies-ios26-fase1
npm run build && git push origin preview
git checkout feat/superficies-ios26-fase1
```

- [ ] **Step 4: Recorrido de validación para el dispositivo**

1. **Cualquier pantalla, arriba del todo** — la barra debe estar desnuda: sin rótulo y **sin
   línea inferior**.
2. **Desplazar** — el rótulo entra por abajo con un fundido corto, y la línea aparece a la vez.
3. **Volver arriba** — ambos se van.
4. **Navegar entre secciones con la tab bar** — la barra debe arrancar desnuda en cada una, sin
   arrastrar el rótulo de la anterior.
5. **1280px** — barra idéntica a hoy: rótulo y línea siempre presentes.

---

## Fuera de alcance (van a la tanda D)

- El **icono azul junto al `<h1>`**. Con el título grande convertido en large title, el icono
  canta más, pero quitarlo es un cambio de contenido y pertenece a D.
- El **fundido bajo la tab bar** inferior (el otro extremo del mismo efecto).
- Ritmo de listas (fila 44pt, separador sangrado), estados vacíos a una línea, `/equipo` migrado
  a superficies.
