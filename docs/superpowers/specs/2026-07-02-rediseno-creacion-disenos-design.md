# Rediseño del flujo de creación de diseños — tipos de pieza, IA y carga ponderada

- **Fecha:** 2026-07-02
- **Estado:** Aprobado (pendiente de plan de implementación)
- **Autor:** Mario + Claude

## Problema

Crear diseños sigue siendo un proceso con mucha fricción para quien los sube
(admins/managers, semanalmente): hay que teclear cada campo a mano, diseño a
diseño, a partir de un mensaje de WhatsApp con toda la información ya
redactada. Además, el departamento va a pasar de 3 tipos de pieza (`matchday`,
`presentacion`, `cumpleanos`) a 14, con complejidades muy distintas entre sí
(un Cumpleaños no es comparable a una Presentación para captación), y hoy la
asignación automática de diseñador cuenta cada diseño como 1 sin importar su
peso real. Este documento fusiona tres iniciativas que hasta ahora estaban
aparcadas por separado — rediseño del flujo de alta, asistente IA de
extracción de campos, y sistema de carga por % — porque son la misma
fricción vista desde tres ángulos.

**Fuera de alcance explícito:** un sistema de asignación *recurrente*
automática (p. ej. "un Matchday cada 2 semanas a un jugador concreto"). El
usuario no tiene aún información suficiente del equipo para diseñarlo con
solidez; se retomará en un brainstorm aparte.

## Estado actual verificado (2026-07-02)

- `components/features/designs/dialogs/create-design-dialog.tsx` (354 líneas)
  ya tiene modo individual (edición) y modo lote (alta), con un tab
  "Asistente IA — próximamente" deshabilitado a la espera de esto.
- `lib/types/design.ts` → `DESIGN_TYPES = ['matchday', 'presentacion', 'cumpleanos']`,
  libre en la app (no enum de Postgres) desde la migración `034`. Añadir/quitar
  un tipo es editar esta constante.
- **Datos en prod:** 761 diseños. **100% son `matchday`** (`presentacion` y
  `cumpleanos` nunca se han usado). `folder_url` relleno en **0** filas.
  `player_status` relleno en solo **13** (1.7%).
- `lib/services/designs/assignment.ts` + `select-designer.ts`: round-robin con
  prioridad por menor carga, pero la carga es "nº de diseños activos
  (`status != DELIVERED`) sin importar tipo" — cuenta 1 por diseño.
- Existe `Hint` (`components/ui/tooltip.tsx`), tooltip de una sola línea ya
  montado globalmente — insuficiente para explicar conceptos nuevos de más de
  una frase.

## Decisiones tomadas

1. Ampliar `type` de 3 a 14 valores, cada uno con un **peso fijo**
   (Rápida/Media/Pesada) que determina su impacto en la carga de trabajo.
2. Modelo de campos **híbrido**: núcleo común a todos los tipos + un campo de
   texto libre `context` para lo específico de cada tipo, salvo `matchday` que
   conserva sus campos estructurados de equipo local/visitante.
3. **Eliminar `player_status`** por completo (formulario, tabla, badge,
   columna): 1.7% de uso, no se echa en falta.
4. Flujo de alta **unificado en tarjetas**, con dos acciones de entrada
   igual de visibles — "Pegar mensaje" (IA) y "Añadir diseño en blanco"
   (manual) — nunca una por defecto ni una degradada. La IA quita fricción,
   no sustituye al manual.
5. Asignación automática pasa de contar diseños a **sumar pesos**; si el
   mensaje pegado nombra explícitamente a un diseñador, se respeta esa
   orden. La especialización diseñador↔tipo queda pospuesta.
6. Carga de equipo en **Team page**, medida como **% de capacidad semanal
   individual** (no share del total del equipo), con la misma ventana
   semanal usada por la asignación automática para que ambas cuenten la
   misma historia.
7. Ayuda contextual nueva y acotada (`InfoTip`, 2-3 líneas) solo para los
   conceptos que introduce esta feature. El sistema de ayuda transversal a
   toda la app queda aparcado como iniciativa propia.

## Arquitectura

### 1. Tipos de pieza y peso

Config nueva en `lib/types/design.ts`, sustituyendo `DESIGN_TYPES`/`DESIGN_TYPE_LABELS`:

| Pieza (label) | Slug | Peso |
|---|---|---|
| Matchday | `matchday` | Rápida |
| Cumpleaños | `cumpleanos` | Rápida |
| Convocatorias | `convocatoria` | Rápida |
| Debuts | `debut` | Media |
| Internacionalidades | `internacionalidad` | Media |
| Fichajes | `fichaje` | Media |
| Cesiones | `cesion` | Media |
| Firmas | `firma` | Media |
| Playoffs | `playoff` | Media |
| Welcome | `welcome` | Media |
| MD conjuntos | `md_conjunto` | Media |
| MD Animados | `md_animado` | Pesada |
| CV | `cv` | Pesada |
| Presentación para captación | `presentacion_captacion` | Pesada |

Se retira el slug `presentacion` (0 filas lo usan hoy) en favor de
`presentacion_captacion`.

Valor numérico por peso, constante editable, no ligada a un enum de BD:
`RAPIDA = 1`, `MEDIA = 2`, `PESADA = 4` (una pieza pesada pondera más del
doble porque su esfuerzo real suele equivaler a varias piezas rápidas, no a
"un poco más").

`type` sigue siendo una columna `text` libre (como hoy) — no hace falta
migración de esquema para añadir tipos, solo para el resto de cambios de esta
spec (ver más abajo).

### 2. Modelo de campos

**Núcleo común (todos los tipos):**

- `type` — tipo de pieza.
- `player` — protagonista, texto libre (admite varios nombres separados por
  coma para `md_conjunto`, sin necesidad de estructura especial).
- `deadline_at` — fecha de entrega.
- `designer_id` — diseñador (automático u explícito).
- `folder_url` — carpeta Drive, opcional (se conserva aunque hoy no se use:
  es un enlace, no añade fricción de escritura).
- `context` **(campo nuevo)** — texto libre opcional con lo específico del
  tipo (rival, club nuevo, selección, motivo de la firma...). Es el campo que
  la IA rellena a partir del mensaje pegado sin que nadie lo escriba a mano.
- `title` — pasa a **autogenerarse** a partir de `type` + `player` (+
  `match_home`/`match_away` si aplica), editable si se quiere personalizar.
  Un campo obligatorio menos que rellenar o que la IA tenga que acertar.

**Excepción — `matchday`:** conserva `match_home`/`match_away` estructurados
sin cambios (alimentan el "vs" visual de las tarjetas; es el tipo de mayor
volumen).

**Eliminado — `player_status`:** fuera del núcleo y fuera de `context`. Se
retira por completo (ver "Ficheros afectados").

### 3. Flujo de entrada unificado

Mismo punto de entrada de hoy (botón "Crear Diseños"). Por dentro, un único
flujo de tarjetas sustituye a los tabs "Manual"/"Asistente" + tabla de lote:

1. **Estado inicial:** dos acciones con el mismo peso visual — "Pegar
   mensaje" y "Añadir diseño en blanco" — ninguna por defecto. Ambas
   desembocan en la misma lista de tarjetas.
2. **Parseo IA** (si se eligió "Pegar mensaje"): el texto se envía a un
   endpoint propio (`/api/designs/parse`, Claude Haiku) que devuelve N
   diseños candidatos con `type`, `player`, `match_home`/`match_away` (si
   aplica), `deadline_at` (infiriendo año cuando falta), `designer_id` (solo
   si el mensaje nombra a alguien y coincide con un diseñador real),
   `context`. **Nada se persiste en este paso.**
3. **Revisión en tarjetas:** cada diseño (generado por IA o añadido a mano)
   es una tarjeta editable: tipo (chip coloreado según peso), título
   autogenerado editable, jugador, fecha (con el aviso ya existente de
   "fuera de la semana visible"), diseñador, contexto colapsable. Campos que
   la IA no pudo resolver con confianza se marcan como aviso, sin bloquear.
4. **Confirmar:** mismo patrón actual — diálogo de confirmación antes de
   crear los N diseños.
5. El modo edición de un diseño existente pasa a ser "una lista de una sola
   tarjeta", mismo componente que la revisión en lote — sustituye a
   `design-form-single.tsx` como pieza aparte.

El prototipado visual concreto (composición exacta de las dos acciones,
diseño de la tarjeta) se hace al arrancar la implementación con el sistema de
diseño real, no como parte de este documento.

### 4. Asignación de diseñador

- `select-designer.ts` no cambia de forma (mínimo + cursor rotatorio para
  lotes); cambia lo que recibe: el `Map<designerId, carga>` pasa de sumar +1
  por diseño activo a sumar **+peso del tipo** de cada diseño.
- `assignment.ts` y las rutas de asignación en lote (`assign`/`bulk`) suman
  pesos en vez de contar filas, y limitan la ventana a **la semana actual**
  (ver siguiente sección — debe coincidir con lo que se muestra en Team page).
- Si el mensaje pegado nombra explícitamente a un diseñador y coincide con
  uno real, ese nombre manda: se pre-rellena `designer_id` y se salta el
  algoritmo para esa tarjeta (editable igualmente).
- **Fuera de alcance:** asignación por especialización (qué diseñador destaca
  en qué tipo de pieza). El override explícito cubre el caso especial por
  ahora.

### 5. Carga de equipo en %

- Se muestra en la Team page (sustituye/complementa el completion rate
  actual).
- **% = peso de los diseños activos del diseñador con entrega esta semana /
  su capacidad semanal.** Capacidad semanal nueva, configurable por
  diseñador (columna nueva en `profiles`, valor por defecto igual para todos
  hasta que el equipo la ajuste).
- La ventana semanal debe ser **la misma** que usa la Sección 4 — si no,
  Team page podría mostrar a alguien "al 90%" mientras el algoritmo lo sigue
  eligiendo por mirar un backlog total distinto.

### 6. Ayuda contextual — `InfoTip`

Componente nuevo, hermano de `Hint` pero para 2-3 líneas de texto (no una).
Se coloca junto a los conceptos nuevos que esta feature introduce: peso de
cada tipo de pieza, significado del % de capacidad semanal, qué hace la IA
con `context`, por qué hay dos acciones de entrada. No es un apartado de
ayuda aparte, vive en el propio flujo.

## Manejo de errores

- **Parseo IA falla, timeout o respuesta inválida:** cae a una tarjeta manual
  con el texto pegado tal cual dentro de `context` — no se pierde lo escrito.
- **Campo ambiguo** (fecha poco clara, nombre de diseñador sin match): se
  marca como aviso en la tarjeta, nunca bloquea el guardado — mismo criterio
  que el aviso de "fecha fuera de semana" ya existente.
- **Nombre de diseñador mencionado pero no encontrado:** `designer_id` queda
  en automático (cae al algoritmo ponderado) y la tarjeta avisa que no se
  encontró, en vez de adivinar por parecido.
- **Migración de `player_status`:** riesgo bajo (1.7% de uso) pero migración
  explícita y revisada, no un DROP incidental.

## Testing

- **Unit:** tabla peso↔tipo; reparto ponderado en `select-designer.ts`
  (extiende los casos ya cubiertos hoy); generación de `title` automático.
- **Integración:** `/api/designs/parse` con respuesta de IA simulada,
  incluyendo el caso de fallback (respuesta vacía/inválida).
- **Componente:** la tarjeta unificada renderiza bien tanto `matchday` (con
  equipos) como el resto (con `context`), y refleja el peso vía chip.
- **Manual (obligatorio antes de dar por cerrada la Fase 4):** probar con un
  mensaje real de WhatsApp en el navegador — un test automatizado no basta
  para validar calidad de extracción.

## Casos borde y alcance

- Las 4 asunciones semánticas sobre tipos de pieza (Convocatorias/
  Internacionalidades, Firmas, Welcome, CV/Presentación para captación) no
  están confirmadas al 100% por el equipo — quedan anotadas para validar
  antes o durante el rollout; el modelo es extensible (renombrar/reclasificar
  un tipo después es editar una constante, no una migración).
- El peso de `matchday` es único (no varía por categoría del club), aunque un
  brainstorm anterior (abril 2026) distinguía "1RFEF para abajo" (rápida) de
  "Segunda división" (media). Se simplifica deliberadamente porque el peso es
  fijo por tipo, no editable por diseño; si el equipo lo pide, se puede
  desdoblar `matchday` en el futuro sin romper nada.
- La capacidad semanal por defecto (el número concreto) no está validada con
  el equipo — arranca con un valor por defecto razonable y configurable.
- Diseños existentes (761, todos `matchday`) no requieren backfill: el modelo
  de tipos es aditivo y `context`/`title` autogenerado no rompen filas
  previas.

## Rollout sugerido (por fases, con validación entre cada una)

1. **Modelo de datos:** ampliar `DESIGN_TYPES` + pesos, migración que borra
   `player_status` y añade capacidad semanal en `profiles`.
2. **Asignación ponderada + Team page:** algoritmo por peso y ventana
   semanal, % en Team page. Validable de forma aislada, sin tocar el flujo
   de alta todavía.
3. **Flujo de entrada unificado (sin IA):** tarjetas + entrada dual,
   sustituye tabs/grid, modo manual mejorado por sí solo.
4. **Endpoint de parseo IA** integrado en el flujo de tarjetas.
5. **`InfoTip`** en los puntos nuevos del flujo.

## Criterios de aceptación

- Crear un lote de diseños a partir de un mensaje de WhatsApp pegado requiere
  revisar/confirmar tarjetas pre-rellenadas, no teclear cada campo desde cero.
- Añadir un diseño a mano sigue siendo igual de accesible que pegar un
  mensaje — ninguna acción está degradada respecto a la otra.
- La asignación automática de diseñador refleja el peso real de las piezas
  activas de esa semana, no solo su conteo.
- Team page muestra la carga de cada diseñador como % de su capacidad
  semanal, usando la misma ventana que la asignación automática.
- `player_status` no aparece en ningún formulario, tabla ni detalle de
  diseño.

## Fuera de alcance (YAGNI)

- Asignación recurrente automática (p. ej. Matchday cada 2 semanas a un
  jugador fijo) — brainstorm aparte cuando haya info del equipo.
- Asignación por especialización diseñador↔tipo de pieza.
- Sistema de ayuda/consejos transversal a toda la app (más allá de los
  `InfoTip` puntuales de esta feature).
- Prototipado visual pixel-perfect de las tarjetas — se resuelve en
  implementación con el sistema de diseño real, no en este documento.
- Otras fuentes de intake más allá de texto pegado (imagen/captura, email).

## Ficheros afectados (aproximado, se detalla en el plan de implementación)

- `supabase/migrations/0XX_*.sql` (nuevo) — drop `player_status`, capacidad
  semanal en `profiles`.
- `lib/types/design.ts` — tipos/pesos ampliados, `context`, título
  autogenerado, retirada de `player_status`.
- `app/api/designs/parse/route.ts` (nuevo) — endpoint de parseo IA.
- `components/features/designs/dialogs/` — nueva tarjeta unificada,
  sustituye `design-form-single.tsx` + `design-form-bulk.tsx`;
  `create-design-dialog.tsx` pasa a alojar la entrada dual + lista de
  tarjetas.
- `components/ui/info-tip.tsx` (nuevo).
- `lib/services/designs/select-designer.ts`, `assignment.ts`, rutas de
  asignación en lote — peso en vez de conteo, ventana semanal.
- Team page (`app/(dashboard)/equipo/...`) — % de capacidad semanal.
- Limpieza de `player_status` en los 16 ficheros donde aparece hoy
  (formularios, `designs-table.tsx`, `design-detail-sheet.tsx`,
  `mi-semana`, `equipo/[id]`, `lib/api/schemas.ts`,
  `lib/hooks/use-design-submit.ts`, `app/api/designs/bulk/route.ts`,
  `player-status-tag.tsx`, `lib/utils/design-form.ts`).
