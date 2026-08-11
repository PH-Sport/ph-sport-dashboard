# Chat con el agente en la creación de diseños + hoja a pantalla completa

- **Fecha:** 2026-08-11
- **Estado:** Aprobado (pendiente de plan de implementación)
- **Autor:** Mario + Claude
- **Rama:** `feat/chat-creacion-disenos` (parte de `preview`)

## Problema

El asistente de IA de la creación de diseños (Fase 4 del rediseño, en
producción desde 2026-07-10) es un *one-shot*: escribes o pegas un mensaje,
`AgentComposer` llama a `POST /api/designs/parse`, la respuesta se convierte
en tarjetas y el campo se vacía. No hay memoria, no hay vuelta atrás y no hay
manera de corregir al agente sin volver a pegarlo todo.

Dos consecuencias concretas:

1. **Cuando el agente se equivoca o le falta un dato, el arreglo es manual.**
   Deja un ⚠ en la tarjeta y te toca abrirla y teclear. No puedes decirle
   «esas tres son para el viernes» ni «la 2 la lleva Lorenzo».
2. **No hay conversación posible.** Si el mensaje de WhatsApp es ambiguo (dos
   fechas candidatas, un apodo que no casa con ningún jugador), el agente
   adivina en silencio en vez de preguntar.

Aparte, en móvil el diálogo de creación **aparece en el centro con una
animación de escala**, mientras que el detalle de un diseño **sube desde
abajo**. Dos superficies del mismo tamaño percibido entrando de formas
distintas: incoherencia con el idioma iOS 26 que persigue el rediseño en
curso.

## Estado actual verificado (2026-08-11)

- `components/features/designs/cards/agent-composer.tsx` (210 líneas):
  textarea auto-creciente + botón de envío. Estado local `Status` de cuatro
  ramas (`idle`/`loading`/`success`/`fallback`), sin historial. Aborta la
  petición en vuelo al desmontarse.
- `app/api/designs/parse/route.ts` (161 líneas): auth → diseñadores →
  Claude Haiku 4.5 con `tool_choice` **forzado** a `propose_designs` →
  normalización. Timeout de 15 s, tope de 20 diseños. Cualquier fallo tras
  auth cae a `{ fallback: true, reason }` con **200** para que la UI nunca vea
  un error de servidor.
- `lib/services/designs/parse-message.ts` (177 líneas): lógica pura — prompt
  de sistema, `PROPOSE_DESIGNS_TOOL`, `normalizeCandidate()` (valida tipo
  contra `DESIGN_TYPES`, casa el nombre del diseñador contra la plantilla real,
  valida la fecha). Tiene tests en `parse-message.test.ts`.
- `components/features/designs/dialogs/create-design-dialog.tsx` (374 líneas):
  concentra estado de tarjetas, submit, aviso de semana visible y layout.
  Usa `fullscreenOnMobile` en modo creación.
- `components/ui/dialog.tsx`: ya tiene dos variantes móviles —
  `fullscreenOnMobile` (100dvh, entra con escala) y `mobileSheet` (entra con
  `y: '100%'` → `0` y `SPRINGS.smooth`, asa de arrastre con `dragControls`,
  swipe-para-cerrar, tope `max-h-[88dvh]`).
- `lib/utils/design-cards.ts`: `DesignCard` tiene **`id` estable**
  (`generateId()`), `source: 'manual' | 'ia'` y `warnings: string[]`. Ambos
  campos se introdujeron pensando en el agente y hoy se usan poco.
- Ya existen `components/ui/tabs.tsx` y `components/ui/collapse.tsx`: no hay
  que construir primitivas nuevas.
- `useConfirm` + `ConfirmDialog` ya están montados en este mismo diálogo.

## Decisiones tomadas

1. **Conversación bidireccional**: el agente pregunta cuando le falta algo Y
   el usuario puede darle órdenes sobre tarjetas ya creadas. El taller de
   tarjetas es el estado compartido y visible entre ambos.
2. **Dos pestañas — «Tarjetas» y «Chat»** — en vez del composer colgando al
   final de la lista. Cumple mejor la decisión 4 de la spec del 2026-07-02
   («dos acciones de entrada igual de visibles; la IA quita fricción, no
   sustituye al manual») y evita que la información se solape.
3. **Se abre en «Tarjetas»**, no en «Chat»: no se cambia el hábito de nadie.
   La pestaña Chat se anuncia con un halo suave que **se apaga tras el primer
   uso** (recordado en `localStorage`). Invitación, no reclamo permanente.
4. **Eco en el hilo, no duplicado**: cuando el agente crea o toca una tarjeta,
   en la conversación aparece su **fila resumen de una línea**, no la tarjeta
   editable. El detalle vive en un solo sitio (la pestaña Tarjetas).
5. **El pie es común a las dos pestañas**: contador (`N diseños · peso X`) y
   CTA siempre visibles, se cree desde donde se esté.
6. **El agente nunca escribe en la base de datos.** Propone y edita el
   borrador; el único que crea diseños es el CTA que pulsa el usuario.
7. **Ante una duda, crea la tarjeta igual** con lo que sepa y su ⚠, y pregunta
   después. Nunca se pierde el progreso por una ambigüedad.
8. **Las dudas se agrupan en una sola pregunta con chips de respuesta**
   (`[Sí, viernes] [Una a una] [Lo hago yo]`), no un interrogatorio turno a
   turno.
9. **El borrador entero sobrevive al cierre** — tarjetas y conversación — en
   `localStorage`, con un botón **«Empezar de cero»** con confirmación. La
   caducidad automática de borradores queda **fuera de alcance**, a decidir más
   adelante.
10. **Hoja a pantalla completa**: en móvil el diálogo de creación entra desde
    abajo con el muelle del detalle de diseño, ocupando `100dvh` con esquinas
    rectas. Sin asa (no hay fondo asomando que la justifique): cierre por ✕ y
    arrastre desde la cabecera. En escritorio no cambia nada.

## Arquitectura

### 1. Ruta de chat — `POST /api/designs/chat`

Sustituye a `POST /api/designs/parse`, que se retira junto con
`AgentComposer`. La lógica pura de `parse-message.ts` **se conserva entera**:
es la que impide que el modelo invente tipos de pieza o diseñadores.

**Petición:**

```ts
{
  messages: ChatTurn[],        // historial del hilo, ya recortado por el cliente
  cards: CardSnapshot[],       // foto del taller tal y como está AHORA
}
```

`CardSnapshot` es un subconjunto de `DesignCard` — `id`, `type`, `player`,
`match_home`, `match_away`, `deadline_at` (ISO), `designer_id`, `details`,
`warnings` — sin campos de UI (`titleEdited`, `folder_url`, `source`). Incluye
las tarjetas creadas a mano y las editadas por el usuario: el agente ve el
taller completo, no solo lo suyo.

**El servidor sigue sin estado.** No hay tabla de borradores ni sesiones: cada
turno llega autocontenido. Esto mantiene la ruta igual de barata de operar que
la actual y encaja con que el borrador viva en el navegador.

**Herramientas** (el `tool_choice` pasa de forzado a `auto`, para que el agente
pueda limitarse a responder con texto):

| Herramienta | Entrada | Efecto en el cliente |
|---|---|---|
| `add_designs` | `{ designs: RawModelDesign[] }` — el schema actual de `propose_designs`, sin cambios | Añade tarjetas nuevas (`source: 'ia'`) |
| `update_designs` | `{ updates: { id, ...campos parciales }[] }` | Aplica el parche a las tarjetas por id |
| `remove_designs` | `{ ids: string[] }` | Elimina esas tarjetas del borrador |
| `ask` | `{ question: string, options?: { label, value }[] }` | Pinta la pregunta con sus chips |

El modelo puede combinarlas en un turno: lo habitual será `add_designs` +
`ask` («he creado ocho; me faltan tres fechas»).

**Un turno de usuario = una llamada al modelo.** El servidor no re-llama al
modelo tras aplicar herramientas: devuelve los bloques al cliente, que los
aplica. En el turno siguiente el cliente reconstruye el historial incluyendo
los `tool_result` sintéticos correspondientes (`"aplicado: 2 tarjetas
añadidas, ids a1b2, c3d4"`), como exige la API de Anthropic. Latencia y coste
acotados y predecibles; nada de bucles de agente.

**Validación de entrada** con zod en `lib/api/schemas.ts`, como el resto de
rutas: `parseMessageSchema` se sustituye por `designChatSchema`.

**Normalización**: `add_designs` reutiliza `normalizeCandidate()` sin tocarla.
`update_designs` pasa por una función nueva, `normalizeUpdate()`, con las
mismas garantías (tipo válido, diseñador existente, fecha parseable) aplicadas
a campos opcionales, y **descarta silenciosamente los ids que no existen** en
el snapshot recibido.

**Prompt de sistema**: el actual más (a) el estado de las tarjetas serializado
de forma compacta, (b) instrucción de agrupar dudas en un solo `ask` con
opciones cuando la duda sea la misma para varias tarjetas, y (c) prohibición
explícita de prometer que ha creado nada en el sistema — solo prepara el
borrador.

**Degradación**: sin `ANTHROPIC_API_KEY` o ante cualquier error, respuesta 200
con `{ fallback: true, reason }`. El hilo lo muestra como aviso y — solo en el
primer mensaje de la conversación — vuelca el texto del usuario en una tarjeta,
igual que hoy. En turnos posteriores no se crea tarjeta de rescate: el mensaje
ya no es «el mensaje a parsear».

**Tope de historial**: el cliente recorta a los últimos 20 turnos o ~24 000
caracteres (lo que se alcance antes), conservando siempre el primer mensaje del
usuario, que suele ser el volcado de WhatsApp con toda la información.

### 2. Estado del borrador — `use-design-draft`

Hook nuevo que se lleva el estado que hoy vive suelto en el diálogo:
`cards`, `openId` y las operaciones (`addCard`, `updateCard`, `removeCard`,
`applyToolCalls`, `reset`).

Persiste en `localStorage` bajo `phsport:design-draft:v1` el objeto
`{ cards, messages, updatedAt }`, con las fechas serializadas a ISO y
rehidratadas a `Date` al leer. Escritura *debounced* (~400 ms) para no
castigar el hilo principal mientras se teclea.

**Solo aplica al modo creación.** El modo edición del diálogo (una sola
tarjeta, cargada de un diseño existente) no persiste nada ni tiene chat: sería
absurdo revivir el borrador de una edición ajena.

Un borrador ilegible o de versión desconocida se descarta sin ruido y se
empieza limpio.

### 3. Conversación — `use-design-chat`

Hook nuevo con el hilo (`messages`), el estado de envío y `send(text)`.
Recibe del diálogo la foto de tarjetas y le devuelve las llamadas a
herramientas para que `use-design-draft` las aplique. Aborta la petición en
vuelo al desmontarse, como ya hace `AgentComposer`.

Tipos del hilo:

```ts
type ChatMessage =
  | { role: 'user'; text: string }
  | { role: 'assistant'; text: string; receipts: CardReceipt[]; ask?: Ask }
  | { role: 'system'; kind: 'fallback' | 'cleared'; text: string };
```

`receipts` son los ecos de las tarjetas tocadas en ese turno (id + acción), lo
que permite pintar la fila resumen sin duplicar datos: se lee de la tarjeta
viva. Si la tarjeta se borró después, el eco se muestra atenuado.

### 4. Componentes

```
dialogs/create-design-dialog.tsx   orquestador: cabecera, pestañas, pie
  cards/cards-panel.tsx            lista de tarjetas + «Añadir diseño»
  chat/chat-panel.tsx              hilo + composer
    chat/chat-thread.tsx           mensajes, ecos y chips
    chat/chat-composer.tsx         textarea auto-creciente (heredado de AgentComposer)
  cards/card-summary-row.tsx       fila resumen extraída de DesignCardItem
```

`DesignCardItem` pasa a **usar** `card-summary-row.tsx` en su cabecera, en vez
de tener el resumen embebido: mismo pixel en los dos sitios, un solo sitio
donde cambiarlo. Es la única modificación estructural que se le hace.

El diálogo baja de 374 líneas a un orquestador delgado; el estado se va a los
hooks y el layout a los paneles.

### 5. Interacción y movimiento

- **Pestañas**: `Tabs` de `components/ui/tabs.tsx`. Etiquetas `Tarjetas · 3`
  (el número es el total de tarjetas) y `Chat`. Cuando el agente toca el
  taller estando el usuario en Chat, la pestaña Tarjetas **destella una vez**
  (no queda encendida).
- **Halo de invitación**: la pestaña Chat lleva un `ring-primary/20` que
  respira en bucle lento hasta el primer uso; después, nunca más
  (`phsport:chat-discovered` en `localStorage`).
- **Aparición escalonada**: las tarjetas de un mismo turno entran con 80 ms de
  desfase entre ellas, reutilizando `SPRINGS.smooth` y el `AnimatePresence` que
  ya envuelve la lista. No es *streaming* real — el modelo responde de golpe —
  pero convierte «aparecieron» en «se están creando».
- **Chips de respuesta**: botones de 44 px de alto. Al pulsar uno se envía su
  `value` como turno del usuario y **todos los chips de ese mensaje quedan
  desactivados**, para que el hilo no invite a responder dos veces a lo mismo.
- **Saltar del eco a la tarjeta**: tocar una fila resumen del hilo cambia a la
  pestaña Tarjetas, abre esa tarjeta y la desplaza a la vista.
- **Teclado en iOS**: el panel de chat se ancla al viewport visible
  (`100dvh` + `env(safe-area-inset-*)`, y `visualViewport` para el composer),
  de modo que el campo de texto y el último mensaje nunca queden bajo el
  teclado. Es el riesgo ergonómico principal de esta pantalla.
- **«Empezar de cero»**: acción discreta en la cabecera del diálogo (solo en
  modo creación y solo si hay algo que borrar). Pasa por `useConfirm` y limpia
  tarjetas, hilo y `localStorage` de una vez.

### 6. Hoja a pantalla completa — `dialog.tsx`

No se añade una bandera nueva: `fullscreenOnMobile` **pasa a entrar desde
abajo**. Su único consumidor en todo el repo es este diálogo
(`create-design-dialog.tsx:176`), así que cambiar su comportamiento no
arrastra a nadie más y evita acumular tres banderas casi iguales. En móvil:

- entra con `y: '100%'` → `0` y `SPRINGS.smooth` (idéntico al detalle);
- ocupa `100dvh`, esquinas rectas, sin bordes laterales;
- cierre por ✕ en la cabecera; arrastre hacia abajo desde la zona del título
  como atajo (mismo `dragControls`, mismo umbral de 100 px / 500 px·s⁻¹);
- respeta `safe-area-inset` arriba y abajo.

En escritorio, el modal centrado se comporta exactamente como hoy.

## Casos borde

| Caso | Comportamiento |
|---|---|
| El agente devuelve un `id` que ya no existe | Se descarta esa actualización en silencio; el eco no se pinta |
| El usuario borra a mano una tarjeta que el agente acaba de crear | El eco del hilo se muestra atenuado, sin enlace |
| Respuesta con más de 20 tarjetas | Se cortan a 20 (tope actual) y el hilo lo dice |
| `ANTHROPIC_API_KEY` ausente | Primer turno → tarjeta de rescate con el texto; siguientes → solo aviso |
| Borrador de una versión anterior en `localStorage` | Se descarta sin ruido |
| Modo edición del diálogo | Sin pestañas, sin chat, sin persistencia: idéntico a hoy |
| Petición en vuelo y el usuario cierra | Se aborta; el hilo conserva su mensaje y se puede reenviar |

## Pruebas

Todo lógica pura, sin navegador, en el estilo que ya usa el repo
(`*.test.ts` junto al código):

- `applyToolCalls` sobre un juego de tarjetas: alta, parche por id, borrado,
  id inexistente, combinación de varias en un turno.
- `normalizeUpdate()`: tipo inválido → se ignora ese campo; diseñador que no
  está en plantilla → `null`; fecha basura → se descarta.
- Serialización y rehidratación del borrador, incluidas fechas y un payload
  corrupto.
- Recorte del historial: conserva el primer mensaje del usuario y respeta los
  dos topes.
- Reconstrucción del historial con `tool_result` sintéticos en el formato que
  espera la API de Anthropic.

## Fuera de alcance

- Preguntas generales al agente («¿quién va más cargado?»), consulta de
  diseños existentes o cualquier escritura suya en la base de datos.
- *Streaming* real token a token de la respuesta del modelo.
- Caducidad automática de borradores.
- Historial de conversaciones entre sesiones o compartido entre dispositivos.
- La Fase 5 pendiente del rediseño (`InfoTip`), que sigue siendo iniciativa
  aparte.
