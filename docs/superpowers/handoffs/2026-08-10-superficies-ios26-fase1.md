# Traspaso — Fase 1 del rediseño móvil iOS 26 (superficies)

**Fecha:** 2026-08-10 · **Estado:** implementada y revisada, **pendiente de validación visual en dispositivo**

Este documento existe porque el registro de ejecución vive en `.superpowers/`, que está en
`.gitignore` y no viaja entre equipos. Aquí queda lo que hay que saber para continuar desde
cero, sin haber presenciado la sesión.

---

## Dónde está el trabajo

| Qué | Dónde |
|---|---|
| Rama de trabajo | `feat/superficies-ios26-fase1` — **subida a origin** |
| Integrado en | `preview` (merge `2adac7d`), desplegado para validar en móvil |
| `main` | **Sin tocar.** No se ha fusionado nada |
| Spec (el porqué) | `docs/superpowers/specs/2026-08-08-idioma-apple-ios26-design.md` |
| Plan (el cómo, tarea a tarea) | `docs/superpowers/plans/2026-08-08-superficies-ios26-fase1.md` |

La rama son 31 commits sobre `main`. `npm run type-check` limpio, 77/77 tests, `npm run build`
compila las 20 páginas.

---

## Qué hace esta fase

Traduce la app al lenguaje visual de iOS 26 **solo en móvil**. Su tesis, en una frase: el
contenido se agrupa **por tono** —un bloque con fondo propio— en vez de encerrarse en cajas
con borde y sombra.

**La restricción dura, y la que más ha costado respetar: desde `md:` (768px) el escritorio no
cambia absolutamente nada.** El rediseño de escritorio es una fase posterior. Todo lo migrado
lleva su contraparte `md:` que restaura el aspecto anterior.

Se creó `Surface` (`components/ui/surface.tsx` + `lib/ui/surface-variants.ts`) con dos
variantes, y `RowSeparator` (`components/ui/row.tsx`). Migradas siete pantallas: `/mi-semana`,
los dos paneles de `/inicio`, `/equipo`, `/equipo/[id]`, `/ajustes` y `/disenos`.

### El contrato de `Surface`

- `grouped` (por defecto) → móvil: `bg-card rounded-surface overflow-hidden`
- `plain` → móvil: `bg-transparent`
- Ambas → `md:border md:border-border md:bg-card md:rounded-2xl md:shadow-raised`
- `padded` aporta `p-md sm:p-lg` en grouped y `md:p-lg` en plain

**Los radios no son intercambiables:** `rounded-surface` = 22px, `rounded-2xl` = 16px,
`rounded-lg` (el `Card` de shadcn) = 10px. Restaurar el que no era ha causado tres regresiones.

---

## Lo que está verificado y lo que NO

**Verificado:** tipos, tests, build, y la paridad de escritorio clase a clase en los 15 bloques
de clases de producción y los 7 skeletons, contra `main`. Una revisión final de rama completa
(0 críticos).

**NO verificado, y es el único hueco real: nadie ha visto las pantallas con sesión iniciada.**
No hay credenciales en el entorno de desarrollo y a los agentes se les instruyó expresamente no
intentar crearlas ni saltarse la autenticación. Por eso el trabajo está en `preview` y no en
`main`.

### Recorrido pendiente, por orden de probabilidad de fallo

1. **`/inicio` como admin, 390px** — los cuatro KPI. Tenían dos líneas cruzando las esquinas
   redondeadas; se rehízo el separador como hueco de rejilla.
2. **`/equipo/[id]`, 390px** — ¿las tarjetas de diseño tienen sombra? No deberían. Estuvo roto
   de una forma invisible en el código (ver más abajo).
3. **`/mi-semana` con alguna entrega hecha** — que el título «Entregadas» no toque la esquina, y
   que los separadores de la lista arranquen a la misma altura tengan o no punto de urgencia.
4. **`/disenos` con más de una página** — que la paginación no quede a ras del borde inferior.
5. **1280px, las siete pantallas** — confirmar que el escritorio sigue idéntico.

---

## Decisiones ya adjudicadas — no las reabras sin motivo nuevo

- **La barra de composición del agente** (`agent-composer.tsx:154`) conserva su borde y fondo.
  No es un contenedor de contenido: es un control de entrada, el equivalente del campo de
  escribir de Mensajes. Quitárselo sería el error contrario al que persigue la fase.
- **La píldora de pestañas de Ajustes** (General/Miembros) tampoco se toca: capa funcional.
- **Las tarjetas de miembro** (`members-panel.tsx:183`) se aplazaron a la fase 2 **a propósito**.
  Hacerlo bien es convertirlas en filas de una lista agrupada, con la superficie cambiando de
  sitio según el ancho — el mismo patrón que ya costó una regresión en los KPI. Quitarles solo
  el borde las dejaría a medio camino.
- **Los `<Card>` de estados vacíos** conservan borde en móvil por decisión del plan. Es deuda
  declarada, no un descuido.

---

## La lección que más rendimiento ha dado

El plan tuvo **diez defectos**. Todos se redactaron mal desde el principio, ninguno lo introdujo
quien implementaba, y **ninguno lo detectaron los tests ni el type-check**. Casi todos eran del
mismo tipo: restaurar en escritorio un valor que no era el original.

Lo que los cazó, sistemáticamente, fue una sola costumbre:

> **Antes de dar por buena cualquier migración, compara las clases que aplican desde `md:`
> contra la versión anterior del archivo (`git show <base>:<ruta>`), clase a clase.**

Y su corolario: **abre el archivo antes de escribir una instrucción sobre él.** Varios defectos
consistían en que el plan describía un elemento que en el código era otra cosa.

Ejemplo de por qué esto no es paranoia: en `/equipo/[id]` las tarjetas llevaban `shadow-none`
para quedar planas en móvil… y la sombra seguía ahí. `tailwind-merge` no reconoce
`shadow-raised` como una sombra (es una clave propia del proyecto, no una suya), así que no
deshacía el conflicto; y en el CSS generado nuestra regla va después, con lo que gana. El código
decía una cosa y el navegador hacía otra. Se arregló quitando `elevation="raised"` del `Card`,
que era quien emitía la clase.

---

## Cosas del entorno que ahorran tiempo

- **Vitest corre en entorno `node`, solo recoge `*.test.ts`, y no hay jsdom ni testing-library.**
  No se pueden escribir tests de componentes React, y su ausencia **no** es un defecto aquí.
- **`diff <(...) <(...)` no funciona en el Git Bash de este equipo**: devuelve «sin cambios»
  aunque los haya. Para comparar clases usa conteos directos (`grep -c`) o lee los archivos.
- **Medir rendimiento siempre en `next build && next start`**, nunca en `dev` (regla del proyecto).
- **Nunca `git add -A` ni `git add .`** — puede haber sesiones concurrentes; stage por rutas.
- **Vercel:** el proyecto visible desde las herramientas del equipo «Rodz» apunta al repositorio
  **antiguo** (`RodzCantCode/ph-sport-dev`) y está parado en enero de 2026. El repo vivo es
  `PH-Sport/ph-sport-dashboard` y su proyecto de Vercel está en otro scope. No deduzcas de ahí
  URLs de despliegue ni concluyas que un push no ha desplegado.

---

## Abierto

- **Validación visual en dispositivo** (arriba). Es lo que bloquea el paso a `main`.
- **Menor sin arreglar:** en `designs-table.tsx` la línea que separa la paginación cruza el
  bloque de lado a lado en móvil, cuando el spec pide separadores con sangría.
- **Tres decisiones de producto sin responder**, del spec: entregar sin diálogo de confirmación
  (con «Deshacer» en el aviso), sustituir la paginación de `/disenos` por scroll infinito, y
  ajustes que se guarden solos. Cambian comportamiento, no aspecto.

## Lo que viene después (del spec, §10)

Fase 2: cabecera colapsable y efecto de borde al desplazar — toca el layout compartido, es el
cambio de mayor riesgo. Además, las listas (tarjetas de miembro incluidas) y el rediseño de
escritorio. Fase 3: gestos (deslizar para actuar, tirar para recargar, menú contextual).
Fase 4: concentricidad completa, disciplina de tinte, suelo tipográfico. Fase 5: hojas con
alturas intermedias.

**Techo realista:** el spec sitúa la conformidad alcanzable en 97/100, no en 100. WebKit no
permite hápticos en una PWA (el truco del interruptor lo parchearon en iOS 26.5) ni Dynamic
Type real. Están descontados de la meta, no prometidos.
