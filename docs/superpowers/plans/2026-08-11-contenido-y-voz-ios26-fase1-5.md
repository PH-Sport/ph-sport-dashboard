# Fase 1.5 — Contenido y voz (rediseño móvil iOS 26)

> **Para agentes:** SUB-SKILL REQUERIDA: usa `superpowers:subagent-driven-development` (recomendada)
> o `superpowers:executing-plans` para implementar tarea a tarea. Los pasos usan casillas
> (`- [ ]`) para el seguimiento.

**Objetivo:** eliminar el texto que no aporta dato y cambiar la voz tipográfica de los rótulos,
para que las superficies iOS de la fase 1 contengan contenido con la misma disciplina que su
envoltorio.

**Arquitectura:** dos tandas independientes sobre la rama `feat/superficies-ios26-fase1`. La
tanda A es puramente sustractiva (borra texto, no añade nada). La tanda B cambia un token de
Tailwind y los 62 puntos que lo consumen. Ninguna toca lógica de datos.

**Stack:** Next.js App Router · Tailwind (tokens en `tailwind.config.ts`) · TypeScript · vitest.

## Contexto: de dónde sale este plan

La crítica del 2026-08-11 sobre capturas reales del iPhone de Mario (snapshot en
`.impeccable/critique/2026-08-11T00-06-58Z__app-dashboard-inicio-page-tsx.md`) concluyó que la
fase 1 migró el envoltorio pero no el contenido. Puntuación 25/40, con un **1/4 en «estético y
minimalista»**: el cromo consume ~70% de los píxeles.

Decisiones tomadas por Mario tras esa crítica:

1. **Large title colapsable** (tanda C) — adelanta el trozo de mayor riesgo de la fase 2.
2. **Recorte total** del texto explicativo (tanda A).
3. **Antes de mergear a main** — la fase 1 se queda en `preview` hasta que esto esté.

## Global Constraints

- **Desde `md:` (768px) el escritorio no cambia absolutamente nada.** Restricción heredada de la
  fase 1 y sigue siendo dura. Todo cambio lleva su contraparte `md:` si altera el aspecto ≥768px.
- **Antes de dar por buena cualquier migración, compara las clases que aplican desde `md:` contra
  la versión anterior del archivo** (`git show <base>:<ruta>`), clase a clase. Diez defectos de la
  fase 1 fueron exactamente esto y ninguno lo detectaron los tests.
- **Abre el archivo antes de escribir o ejecutar una instrucción sobre él.**
- **Nunca `git add -A` ni `git add .`** — puede haber sesiones concurrentes. Stage por rutas explícitas.
- **No se pueden escribir tests de componentes React**: vitest corre en entorno `node`, solo recoge
  `*.test.ts`, y no hay jsdom ni testing-library. Su ausencia **no** es un defecto. La verificación
  de estas tandas es: `grep` de ausencia (asserts ejecutables), `npm run type-check`, `npm run lint`,
  `npx vitest run` (77/77) y `npm run build`.
- **Medir rendimiento siempre en `next build && next start`**, nunca en `dev`.
- Rama de trabajo: `feat/superficies-ios26-fase1`. No mergear a `main` dentro de este plan.

## Alcance de este documento

Cubre **tandas A y B**. Las tandas C (large title colapsable) y D (ritmo, remates, `/equipo`) se
planifican en un documento propio **después** de que Mario valide B en el iPhone: C toca el layout
compartido y su diseño depende de cómo se lea B en pantalla.

---

## File Structure

| Archivo | Responsabilidad | Tanda |
|---|---|---|
| `app/(dashboard)/disenos/page.tsx` | Subtítulo de página fuera | A1 |
| `app/(dashboard)/equipo/page.tsx` | Subtítulo fuera · porcentaje redundante fuera | A1, A4 |
| `app/(dashboard)/mi-semana/page.tsx` | Subtítulo fuera · emoji fuera · contador duplicado | A1, A3, A4 |
| `app/(dashboard)/ajustes/page.tsx` | Subtítulo fuera | A1 |
| `components/features/dashboard/admin-dashboard.tsx` | `note` de KPI fuera · labels concordados | A2 |
| `tailwind.config.ts` | Token `eyebrow` reescrito | B1 |
| `components/ui/eyebrow.tsx` | Componente sin `font-mono uppercase` | B1 |
| `components/ui/kpi-card.tsx` + features + skeletons | Consumidores del token | B2, B3 |

**`app/(dashboard)/inicio/page.tsx` NO se toca en la tanda A.** Su subtítulo es
`` subtitle={`Semana del ${dateRangeLabel}`} `` — eso **es un dato** (el rango de fechas vigente),
no un tip explicativo. La prop `subtitle` de `PageHeader`/`DashboardPage` sobrevive por él;
no la elimines.

---

# TANDA A — Recortar

Sustractiva y sin riesgo. Cuatro tareas, cuatro commits.

### Task A1: Fuera los cuatro subtítulos explicativos

**Files:**
- Modify: `app/(dashboard)/disenos/page.tsx:195`
- Modify: `app/(dashboard)/equipo/page.tsx:190`
- Modify: `app/(dashboard)/mi-semana/page.tsx:104`
- Modify: `app/(dashboard)/ajustes/page.tsx:173`

**Interfaces:**
- Consumes: nada.
- Produces: nada. La prop `subtitle?: ReactNode` de `DashboardPage` y `PageHeader` **permanece**
  en la firma (la usa `/inicio`).

- [ ] **Step 1: Confirmar los cuatro puntos exactos antes de editar**

```bash
grep -n "subtitle=" "app/(dashboard)/disenos/page.tsx" "app/(dashboard)/equipo/page.tsx" \
  "app/(dashboard)/mi-semana/page.tsx" "app/(dashboard)/ajustes/page.tsx" "app/(dashboard)/inicio/page.tsx"
```

Esperado: cinco resultados. El de `inicio` es `` subtitle={`Semana del ${dateRangeLabel}`} `` y
**no se toca**. Los otros cuatro son literales de texto y se eliminan.

- [ ] **Step 2: Eliminar las cuatro líneas**

En `app/(dashboard)/disenos/page.tsx`, borrar la línea:

```tsx
      subtitle="Gestión de todas las piezas gráficas"
```

En `app/(dashboard)/equipo/page.tsx`, borrar la línea:

```tsx
      subtitle="Quién lleva qué esta semana"
```

En `app/(dashboard)/mi-semana/page.tsx`, borrar la línea:

```tsx
      subtitle="Tu cola, ordenada por entrega"
```

En `app/(dashboard)/ajustes/page.tsx`, borrar la línea:

```tsx
      subtitle="Tu cuenta, apariencia, notificaciones y la gestión del equipo"
```

- [ ] **Step 3: Verificar la ausencia (assert ejecutable)**

```bash
! grep -rn "Gestión de todas las piezas gráficas\|Quién lleva qué esta semana\|Tu cola, ordenada por entrega\|Tu cuenta, apariencia, notificaciones" --include='*.tsx' . && echo "OK: los cuatro subtítulos han desaparecido"
```

Esperado: imprime `OK: los cuatro subtítulos han desaparecido`.

- [ ] **Step 4: Verificar que el de `/inicio` sigue vivo**

```bash
grep -n "Semana del" "app/(dashboard)/inicio/page.tsx"
```

Esperado: una línea con `` subtitle={`Semana del ${dateRangeLabel}`} ``. Si no aparece, se ha
borrado por error: restáurala.

- [ ] **Step 5: Type-check y tests**

```bash
npm run type-check && npx vitest run
```

Esperado: sin errores de tipos; 77/77 tests en verde.

- [ ] **Step 6: Commit**

```bash
git add "app/(dashboard)/disenos/page.tsx" "app/(dashboard)/equipo/page.tsx" \
  "app/(dashboard)/mi-semana/page.tsx" "app/(dashboard)/ajustes/page.tsx"
git commit -m "refactor(movil): los titulos de pagina se explican solos"
```

---

### Task A2: Fuera las notas de los KPI, y labels que concuerden

**Files:**
- Modify: `components/features/dashboard/admin-dashboard.tsx:57-77` (tipo y cuerpo de `KpiPlate`)
- Modify: `components/features/dashboard/admin-dashboard.tsx:229-248` (las cuatro llamadas)

**Interfaces:**
- Consumes: nada.
- Produces: `KpiPlate` pasa a tener la firma
  `{ label: string; value: string | number; tone?: keyof typeof TONE_TEXT }`.
  La prop `note` **desaparece del tipo**, así que TypeScript falla si queda alguna llamada sin migrar.
  Ese fallo es la red de seguridad de esta tarea.

**Por qué también cambian los labels:** hoy son `Activas` · `Entregados` · `Atrasados` ·
`Equipo activo`. El primero está en femenino y los otros dos en masculino, así que no nombran la
misma entidad. Todos cuentan **diseños**, luego van en masculino. Con la nota eliminada, el label
es lo único que queda: tiene que ser exacto.

- [ ] **Step 1: Leer el bloque actual antes de editar**

```bash
sed -n '55,80p' components/features/dashboard/admin-dashboard.tsx
sed -n '225,250p' components/features/dashboard/admin-dashboard.tsx
```

- [ ] **Step 2: Quitar `note` del tipo y del cuerpo de `KpiPlate`**

Sustituir la definición completa de `KpiPlate` por:

```tsx
function KpiPlate({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string | number;
  tone?: keyof typeof TONE_TEXT;
}) {
  return (
    // Columna de un bloque compartido en movil: su bg-card tapa el bg-border del
    // contenedor, y el hueco de 1px entre celdas ES el hairline. Escritorio (md:):
    // recupera su tarjeta propia, borde + fondo + sombra, como antes.
    <div className="bg-card p-sm sm:p-lg md:rounded-2xl md:border md:border-border md:bg-card md:shadow-raised">
      <p className="font-mono text-eyebrow uppercase text-muted-foreground">{label}</p>
      <p className={cn('mt-2 font-mono tabular text-3xl sm:text-4xl font-semibold leading-none', TONE_TEXT[tone])}>
        {value}
      </p>
    </div>
  );
}
```

Nota: la línea `<p className="mt-2 text-xs text-muted-foreground">{note}</p>` desaparece. Las
clases de la placa (`p-sm sm:p-lg md:rounded-2xl md:border md:border-border md:bg-card
md:shadow-raised`) se conservan **literalmente**: el escritorio no cambia.

- [ ] **Step 3: Migrar las cuatro llamadas**

Sustituir el bloque de las cuatro `<KpiPlate>` por:

```tsx
        <KpiPlate label="Activos" value={activeCount} />
        <KpiPlate
          label="Entregados"
          value={deliveredCount}
          tone={deliveredCount > 0 ? 'success' : 'default'}
        />
        <KpiPlate
          label="Atrasados"
          value={overdueCount}
          tone={overdueCount > 0 ? 'warning' : 'default'}
        />
        <KpiPlate
          label="Equipo"
          value={`${activeDesignersCount}/${designers.length}`}
          tone="primary"
        />
```

El `<section className="grid grid-cols-2 gap-px ...">` que los envuelve **no se toca**.

- [ ] **Step 4: Verificar la ausencia y que el tipo hizo su trabajo**

```bash
! grep -rn "Pendientes esta semana\|Completados esta semana\|Vencidos sin entregar\|Con trabajo asignado" --include='*.tsx' . && echo "OK: las notas de KPI han desaparecido"
! grep -n "note" components/features/dashboard/admin-dashboard.tsx && echo "OK: no queda rastro de la prop note"
npm run type-check
```

Esperado: ambos `OK`, y el type-check sin errores. Si el type-check falla con
`Property 'note' does not exist`, es que queda una llamada sin migrar: migrarla.

- [ ] **Step 5: Comprobar la paridad de escritorio contra la base**

```bash
git show main:components/features/dashboard/admin-dashboard.tsx | grep -n "md:" | head -20
grep -n "md:" components/features/dashboard/admin-dashboard.tsx | head -20
```

Esperado: las clases `md:` de `KpiPlate` y de la rejilla son idénticas a las de antes de esta
tarea. Esta tarea no debe alterar ni una sola clase `md:`.

- [ ] **Step 6: Tests y commit**

```bash
npx vitest run
git add components/features/dashboard/admin-dashboard.tsx
git commit -m "refactor(inicio): los KPI se quedan con etiqueta y numero"
```

---

### Task A3: Fuera el emoji del estado vacío de Pendientes

**Files:**
- Modify: `app/(dashboard)/mi-semana/page.tsx:138-141`

**Interfaces:** ninguna.

**Contexto para no confundirse:** en este archivo hay **dos** textos que empiezan por «Semana
despejada». El de la línea ~112 es el estado vacío global de la página (una tarjeta centrada con
botón al backlog) y **se queda como está**. El de la línea ~140 es el estado vacío de la sección
«Pendientes» cuando sí hay entregas hechas, y es el que lleva el emoji.

- [ ] **Step 1: Distinguir los dos antes de editar**

```bash
grep -n "Semana despejada" "app/(dashboard)/mi-semana/page.tsx"
```

Esperado: dos resultados. El que contiene `🎉` es el objetivo.

- [ ] **Step 2: Sustituir el texto**

Reemplazar:

```tsx
                <p className="py-md text-sm text-muted-foreground">
                  Semana despejada — no te queda nada por entregar. 🎉
                </p>
```

por:

```tsx
                <p className="py-md text-sm text-muted-foreground">Nada pendiente.</p>
```

- [ ] **Step 3: Verificar**

```bash
! grep -rn "🎉" --include='*.tsx' . && echo "OK: sin emoji"
grep -n "Semana despejada" "app/(dashboard)/mi-semana/page.tsx"
```

Esperado: `OK: sin emoji`, y **un solo** resultado de «Semana despejada» (el estado vacío global,
que sigue vivo).

- [ ] **Step 4: Type-check, tests y commit**

```bash
npm run type-check && npx vitest run
git add "app/(dashboard)/mi-semana/page.tsx"
git commit -m "refactor(mi-semana): el vacio de pendientes dice lo justo"
```

---

### Task A4: Contadores que no se repiten

**Files:**
- Modify: `app/(dashboard)/mi-semana/page.tsx:228-256` (contador por grupo de semana)
- Modify: `app/(dashboard)/equipo/page.tsx:80` (porcentaje redundante)

**Interfaces:** ninguna.

**Los dos casos:**

1. En `/mi-semana`, la cabecera «Entregadas» lleva un badge con `deliveredCount`, y justo debajo
   cada grupo de semana muestra `w.items.length` a la derecha. Cuando **solo hay un grupo**, los
   dos números son el mismo, y así se ve en la captura: «Entregadas ⑤» sobre «3 DE AGO – 9 DE
   AGO … 5». Con varios grupos sí informan, luego el contador de grupo se muestra solo entonces.
2. En `/equipo`, cada diseñador muestra `{loadWeight}/{capacity} · {loadPct}%`. El porcentaje se
   deriva del fraccionario que tiene al lado: no añade información.

- [ ] **Step 1: Leer los dos puntos**

```bash
sed -n '226,232p' "app/(dashboard)/mi-semana/page.tsx"
sed -n '250,258p' "app/(dashboard)/mi-semana/page.tsx"
sed -n '50,56p' "app/(dashboard)/equipo/page.tsx"
sed -n '76,84p' "app/(dashboard)/equipo/page.tsx"
```

- [ ] **Step 2: Condicionar el contador de grupo en `/mi-semana`**

Reemplazar:

```tsx
                          <span className="font-mono tabular text-xs text-muted-foreground">
                            {w.items.length}
                          </span>
```

por:

```tsx
                          {deliveredGroups.length > 1 && (
                            <span className="font-mono tabular text-xs text-muted-foreground">
                              {w.items.length}
                            </span>
                          )}
```

- [ ] **Step 3: Quitar el porcentaje en `/equipo`**

Reemplazar la línea 80:

```tsx
              {loadWeight}/{capacity} · {loadPct}%
```

por:

```tsx
              {loadWeight}/{capacity}
```

- [ ] **Step 4: Limpiar el cálculo huérfano**

`loadPct` (línea 54) deja de tener consumidores en el JSX. Comprobar y eliminar si es así:

```bash
grep -n "loadPct" "app/(dashboard)/equipo/page.tsx"
```

Si el único resultado es la declaración `const loadPct = ...`, bórrala. Si aparece en algún otro
sitio (por ejemplo, una barra de progreso), **déjala** y no toques nada más.

- [ ] **Step 5: Verificar**

```bash
npm run type-check && npm run lint && npx vitest run
```

Esperado: sin errores de tipos, sin avisos de variable no usada, 77/77 en verde.

- [ ] **Step 6: Commit**

```bash
git add "app/(dashboard)/mi-semana/page.tsx" "app/(dashboard)/equipo/page.tsx"
git commit -m "refactor(movil): cada numero se dice una sola vez"
```

---

### Task A5: Cierre de la tanda A

- [ ] **Step 1: Build completo**

```bash
npm run build
```

Esperado: compila las 20 páginas sin errores.

- [ ] **Step 2: Barrido de restos**

```bash
! grep -rn "Gestión de todas las piezas gráficas\|Quién lleva qué esta semana\|Tu cola, ordenada por entrega\|Tu cuenta, apariencia, notificaciones\|Pendientes esta semana\|Completados esta semana\|Vencidos sin entregar\|Con trabajo asignado\|🎉" --include='*.tsx' . && echo "OK: tanda A completa"
```

Esperado: `OK: tanda A completa`.

- [ ] **Step 3: Paridad de escritorio de toda la tanda**

```bash
git diff main...HEAD -- "app/(dashboard)" components/features/dashboard | grep "^[-+].*md:"
```

Esperado: **ninguna línea**. La tanda A no debe haber añadido ni quitado una sola clase `md:`.
Si aparece alguna, revísala contra `git show main:<ruta>` antes de continuar.

- [ ] **Step 4: Push para validación en el iPhone**

```bash
git push origin feat/superficies-ios26-fase1
```

Luego mergear a `preview` y avisar a Mario para que lo mire en el móvil.

---

# TANDA B — La voz tipográfica

Cambia el token `eyebrow` de mono-mayúsculas-tracking-ancho a footnote semibold en caja de frase,
que es lo que usa iOS. Es el cambio con más superficie de contacto del plan: 62 usos de
`font-mono` en la app, de los que ~30 son rótulos (el resto son números tabulares, que se quedan).

**Regla que decide caso por caso:** mono se queda **solo** donde alinea dígitos en columna
(`1/3`, `0/10`, `13 ago · 21:00` en una tabla). Mono se va de todo lo que sea un **rótulo**,
una etiqueta de formulario o el nombre de una sección.

### Task B1: Reescribir el token y el componente `Eyebrow`

**Files:**
- Modify: `tailwind.config.ts:39`
- Modify: `components/ui/eyebrow.tsx:11`

**Interfaces:**
- Produces: la clase `text-eyebrow` pasa a significar «footnote semibold, caja de frase». Los
  consumidores dejan de necesitar `font-mono uppercase` y deben perderlo (tareas B2 y B3).

- [ ] **Step 1: Leer la escala completa antes de tocarla**

```bash
sed -n '30,45p' tailwind.config.ts
```

- [ ] **Step 2: Reescribir el token**

Reemplazar:

```ts
        eyebrow: ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.18em', fontWeight: '500' }],
```

por:

```ts
        // Rótulo de sección — footnote de iOS (13pt), caja de frase, sin tracking.
        // La versión anterior (mono 11px + 0.18em + uppercase) era voz de dashboard,
        // no de app nativa: SF Pro no espacia mayúsculas.
        eyebrow: ['0.8125rem', { lineHeight: '1.125rem', letterSpacing: '0', fontWeight: '600' }],
```

- [ ] **Step 3: Limpiar el componente `Eyebrow`**

Reemplazar en `components/ui/eyebrow.tsx`:

```tsx
      className={cn('font-mono text-eyebrow uppercase text-muted-foreground', className)}
```

por:

```tsx
      className={cn('text-eyebrow text-muted-foreground', className)}
```

- [ ] **Step 4: Verificar que el token compila**

```bash
npm run type-check && npm run build
```

Esperado: build en verde. En este punto la app se ve **inconsistente** a propósito: los usos que
todavía llevan `font-mono uppercase` inline siguen en mayúsculas. B2 y B3 los migran.

- [ ] **Step 5: Commit**

```bash
git add tailwind.config.ts components/ui/eyebrow.tsx
git commit -m "refactor(tipografia): el rotulo de seccion habla como iOS, no como terminal"
```

---

### Task B2: Migrar los rótulos de producción

**Files:**
- Modify: `components/ui/kpi-card.tsx:40`
- Modify: `components/layout/header.tsx:29`
- Modify: `components/features/dashboard/admin-dashboard.tsx` (líneas 70, 163, 256, 343, 391)
- Modify: `components/features/dashboard/designer-dashboard.tsx` (líneas 49, 111, 159, 215)
- Modify: `components/features/account/members-panel.tsx` (líneas 261, 271, 282)
- Modify: `components/features/designs/design-detail-sheet.tsx:208`
- Modify: `app/(dashboard)/ajustes/page.tsx:40`
- Modify: `app/(dashboard)/mi-semana/page.tsx:250`

**Interfaces:** ninguna nueva. Consume el token redefinido en B1.

- [ ] **Step 1: Enumerar los objetivos exactos**

```bash
grep -rn "font-mono text-eyebrow uppercase" --include='*.tsx' components/ app/
```

Anota el número de resultados: es el contador de progreso de esta tarea.

- [ ] **Step 2: Sustituir el patrón en todos ellos**

En cada resultado, sustituir `font-mono text-eyebrow uppercase` por `text-eyebrow`, conservando
intacto el resto de la clase (el color: `text-muted-foreground`, `text-primary`,
`text-destructive`, etc.).

Ejemplo, en `components/layout/header.tsx:29`:

```tsx
          <span className="truncate text-eyebrow text-muted-foreground">
```

Ejemplo, en `components/features/dashboard/admin-dashboard.tsx:163`:

```tsx
              <p className="text-eyebrow text-primary">Avisos</p>
```

**Caso especial** — `components/features/dashboard/designer-dashboard.tsx:49` lleva además
tracking responsive propio:

```tsx
      <p className="font-mono text-eyebrow uppercase tracking-[0.08em] text-muted-foreground sm:tracking-[0.18em]">
```

Queda:

```tsx
      <p className="text-eyebrow text-muted-foreground">
```

(el tracking responsive desaparece con el resto: el token ya define `letterSpacing: 0`).

- [ ] **Step 3: Verificar que no queda ninguno**

```bash
! grep -rn "font-mono text-eyebrow uppercase" --include='*.tsx' components/ app/ && echo "OK: rótulos migrados"
```

Esperado: `OK: rótulos migrados`.

- [ ] **Step 4: Confirmar que los números tabulares NO se han tocado**

```bash
grep -rn "font-mono tabular" --include='*.tsx' components/ app/ | wc -l
```

Esperado: el mismo número que antes de empezar la tarea. `font-mono tabular` es la clase de los
dígitos alineados y **se queda**. Si ha bajado, has migrado un número por error.

- [ ] **Step 5: Type-check, lint, tests, build**

```bash
npm run type-check && npm run lint && npx vitest run && npm run build
```

- [ ] **Step 6: Commit**

```bash
git add components/ui/kpi-card.tsx components/layout/header.tsx \
  components/features/dashboard/admin-dashboard.tsx \
  components/features/dashboard/designer-dashboard.tsx \
  components/features/account/members-panel.tsx \
  components/features/designs/design-detail-sheet.tsx \
  "app/(dashboard)/ajustes/page.tsx" "app/(dashboard)/mi-semana/page.tsx"
git commit -m "refactor(tipografia): los rotulos pierden la voz de terminal"
```

---

### Task B3: Alinear los skeletons

**Files:**
- Modify: los skeletons que imitan un eyebrow, listados por el grep del paso 1.

**Por qué:** un skeleton que reserva la altura de un rótulo de 11px cuando el rótulo real mide
13px produce salto al cargar. La fase 1 ya sufrió esto.

- [ ] **Step 1: Localizar los skeletons afectados**

```bash
grep -rn "eyebrow\|h-3 w-2[0-9]\|h-3 w-3[0-9]" --include='*.tsx' components/skeletons/
```

- [ ] **Step 2: Ajustar las alturas de placeholder de rótulo**

Para cada barra que representa un eyebrow, la altura pasa de `h-3` (12px) a `h-4` (16px), que es
la `lineHeight: 1.125rem` del token nuevo redondeada a la escala de Tailwind. No cambies anchos.

- [ ] **Step 3: Comparar cada skeleton con su pantalla real**

Para cada skeleton modificado, abre el componente de producción que imita y confirma que la
altura del placeholder corresponde al rótulo real. Este paso es manual y es el que evita el salto.

- [ ] **Step 4: Verificar**

```bash
npm run type-check && npm run lint && npx vitest run && npm run build
```

- [ ] **Step 5: Paridad de escritorio de toda la tanda B**

```bash
git diff main...HEAD -- components/ tailwind.config.ts | grep "^[-+].*md:"
```

Revisa cada línea que aparezca contra `git show main:<ruta>`. El token `eyebrow` no tiene
variante `md:`, así que el cambio afecta a escritorio también — **esto es deliberado y es la
única excepción autorizada** a la restricción global, porque un token tipográfico no se puede
bifurcar por viewport sin duplicarlo. Anótalo en el commit.

- [ ] **Step 6: Commit y push**

```bash
git add components/skeletons/
git commit -m "fix(skeletons): la altura del rotulo casa con la tipografia nueva"
git push origin feat/superficies-ios26-fase1
```

- [ ] **Step 7: Parar y validar**

Mergear a `preview` y **esperar el veredicto de Mario en el iPhone antes de planificar la tanda C.**
El large title colapsable toca el layout compartido: su diseño depende de cómo se lea esto.

---

## Notas de la self-review

- **Cobertura:** las cinco «Priority Issues» de la crítica se reparten así — cinco rótulos
  antes del dato → tanda C (fuera de este documento, por decisión de secuencia); texto que no es
  dato → A1/A2/A3; voz mono → B1/B2/B3; espaciado sin sistema → tanda D; densidad invertida →
  consecuencia de A y D. Las «Minor Observations» de contadores duplicados están en A4; las
  restantes (icono junto al título, scroll edge effect, tachado, placeholder, `/equipo` sin
  migrar) van a la tanda D.
- **Riesgo mayor del plan:** B1 cambia un token compartido con escritorio. Está declarado en B3
  Step 5 como excepción consciente a la restricción global, no como descuido.
- **Red de seguridad de A2:** eliminar `note` del *tipo* (y no solo del JSX) hace que TypeScript
  señale cualquier llamada sin migrar. Es el sustituto de un test que aquí no se puede escribir.
