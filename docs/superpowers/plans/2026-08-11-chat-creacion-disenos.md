# Chat en la creación de diseños + hoja a pantalla completa — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir el asistente *one-shot* de alta de diseños en una conversación de ida y vuelta con el taller de tarjetas como estado compartido, y hacer que el diálogo de creación entre desde abajo a pantalla completa en móvil.

**Architecture:** El servidor sigue sin estado: cada turno lleva el hilo (texto plano) y una foto de las tarjetas actuales. Claude Haiku 4.5 elige entre cuatro herramientas (`add_designs`, `update_designs`, `remove_designs`, `ask`) que el cliente aplica sobre el borrador. El borrador (tarjetas + hilo) vive en `localStorage`. La UI pasa a dos pestañas — Tarjetas y Chat — con pie común.

**Tech Stack:** Next.js App Router, React 19, TypeScript, zod, framer-motion, Radix (Dialog/Tabs), Tailwind, vitest.

## Global Constraints

- **Idioma:** todo el código, comentarios, commits y copy de UI en español, con acentuación correcta. Los identificadores siguen el estilo del repo (inglés en campos de dominio: `deadline_at`, `designer_id`).
- **Modelo:** `claude-haiku-4-5-20251001`, `anthropic-version: 2023-06-01`, timeout 15 s, máximo 20 diseños por respuesta.
- **La ruta de chat nunca devuelve error de servidor tras autenticar:** todo fallo cae a `200 { fallback: true, reason }`.
- **El agente jamás escribe en la base de datos.** Solo propone cambios en el borrador del cliente.
- **Táctil:** cualquier control nuevo pulsable mide ≥44 px de alto en móvil (`md:` puede reducirlo).
- **Tests:** vitest, ficheros `*.test.ts` junto al código, `describe`/`it` con descripciones en español.
- **Comandos de verificación:** `npm run test`, `npm run type-check`, `npm run lint`.
- **Commits:** mensaje en español, minúscula tras el tipo, y siempre con el pie:
  ```
  Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_012oArwGemBLE13Koo3GSoeZ
  ```
- **Staging por rutas explícitas:** nunca `git add -A` (riesgo de commits concurrentes en este repo).

## Estructura de ficheros

**Crear:**

| Fichero | Responsabilidad |
|---|---|
| `lib/services/designs/chat-agent.ts` | Lógica pura del agente conversacional: schemas de las 4 herramientas, prompt de sistema, `normalizeUpdate()`, serialización del snapshot, recorte del historial |
| `lib/services/designs/chat-agent.test.ts` | Tests de lo anterior |
| `lib/utils/design-draft.ts` | Aplicación de las llamadas a herramientas sobre las tarjetas (`applyToolCalls`) + serializar/rehidratar el borrador |
| `lib/utils/design-draft.test.ts` | Tests de lo anterior |
| `app/api/designs/chat/route.ts` | Orquestación HTTP: auth → diseñadores → Anthropic → normalización |
| `lib/hooks/use-design-draft.ts` | Estado del borrador + persistencia en `localStorage` |
| `lib/hooks/use-design-chat.ts` | Estado del hilo + envío |
| `components/features/designs/cards/card-summary-row.tsx` | Fila resumen de una tarjeta, compartida por la tarjeta y el hilo |
| `components/features/designs/cards/cards-panel.tsx` | Panel de la pestaña Tarjetas |
| `components/features/designs/chat/chat-panel.tsx` | Panel de la pestaña Chat (hilo + composer) |
| `components/features/designs/chat/chat-thread.tsx` | Mensajes, ecos y chips |
| `components/features/designs/chat/chat-composer.tsx` | Campo de texto auto-creciente |

**Modificar:**

| Fichero | Cambio |
|---|---|
| `components/ui/dialog.tsx:42-104` | `fullscreenOnMobile` pasa a entrar desde abajo a `100dvh` |
| `lib/api/schemas.ts:90-93` | `parseMessageSchema` → `designChatSchema` |
| `components/features/designs/cards/design-card-item.tsx:~100-151` | Su cabecera pasa a usar `card-summary-row.tsx` |
| `components/features/designs/dialogs/create-design-dialog.tsx` | Pasa a orquestador: cabecera, pestañas, pie |

**Borrar:** `app/api/designs/parse/route.ts`, `components/features/designs/cards/agent-composer.tsx`.

**Se conserva sin tocar:** `lib/services/designs/parse-message.ts` (y sus tests) — `normalizeCandidate`, `matchDesigner`, `PROPOSE_DESIGNS_TOOL` se reutilizan tal cual.

---

### Task 1: La hoja sube desde abajo

Entrega independiente y visible: el diálogo de creación entra desde abajo a pantalla completa. No depende de nada del chat.

**Files:**
- Modify: `components/ui/dialog.tsx:42-104`

**Interfaces:**
- Consumes: nada.
- Produces: `fullscreenOnMobile?: boolean` en `DialogContent` — mismo nombre y tipo que hoy, comportamiento nuevo en móvil.

- [ ] **Step 1: Cambiar el wrapper y la animación**

En `dialog.tsx`, dentro de `DialogContent`, añadir junto a `sheetMode`:

```tsx
const fullMode = fullscreenOnMobile && isMobile;
```

El `div` wrapper: cuando `fullMode`, alinear abajo igual que la hoja, para que el `y: 100%` salga del borde inferior:

```tsx
sheetMode || fullMode
  ? 'items-end justify-center'
  : 'items-center justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]'
```

(la rama intermedia de `fullscreenOnMobile` desaparece: ya no necesita `md:p-4`, lo cubre la rama centrada en escritorio).

El `motion.div`: `fullMode` comparte entrada con la hoja y añade su propio bloque de clases tras `className`:

```tsx
initial={sheetMode || fullMode ? { y: '100%' } : contentAnimation.initial}
animate={sheetMode || fullMode ? { y: 0 } : contentAnimation.animate}
exit={sheetMode || fullMode ? { y: '100%' } : contentAnimation.exit}
transition={sheetMode || fullMode ? SPRINGS.smooth : TRANSITIONS.modal}
```

```tsx
fullMode && 'h-[100dvh] max-h-none w-full max-w-none rounded-none border-0'
```

- [ ] **Step 2: Arrastre desde la cabecera, sin asa**

`fullMode` no pinta asa (decisión: sin fondo asomando, el asa no se justifica) pero conserva el gesto. Habilitar el drag y exponer el arranque del gesto a la cabecera vía `data-drag-handle`:

```tsx
drag={sheetMode || fullMode ? 'y' : false}
onDragEnd={sheetMode || fullMode ? handleDragEnd : undefined}
onPointerDown={
  fullMode
    ? (e) => {
        const target = e.target as HTMLElement;
        if (target.closest('[data-drag-handle]')) dragControls.start(e);
      }
    : undefined
}
```

`fullMode` mantiene la ✕ (la rama `sheetMode ? ... : <Close/>` ya lo hace: `fullMode` cae en el `else`).

- [ ] **Step 3: Marcar la cabecera como zona de arrastre**

En `create-design-dialog.tsx`, añadir `data-drag-handle` al `DialogHeader` (solo creación):

```tsx
<DialogHeader {...(!isEditMode && { 'data-drag-handle': '' })}>
```

- [ ] **Step 4: Verificar**

Run: `npm run type-check && npm run lint`
Expected: sin errores.

Comprobación manual en el navegador con DevTools en modo móvil (`npm run dev` → `/disenos` → «Crear Diseños»): la hoja sube desde abajo, ocupa toda la pantalla, la ✕ cierra, arrastrar el título hacia abajo cierra, y el detalle de un diseño sigue comportándose como antes.

- [ ] **Step 5: Commit**

```bash
git add components/ui/dialog.tsx components/features/designs/dialogs/create-design-dialog.tsx
git commit -m "$(cat <<'EOF'
feat(dialogo): la hoja de creacion sube desde abajo a pantalla completa

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012oArwGemBLE13Koo3GSoeZ
EOF
)"
```

---

### Task 2: Herramientas del agente (lógica pura)

**Files:**
- Create: `lib/services/designs/chat-agent.ts`
- Test: `lib/services/designs/chat-agent.test.ts`

**Interfaces:**
- Consumes: `normalizeCandidate`, `matchDesigner`, `ParseDesigner`, `ParsedDesignCandidate`, `RawModelDesign`, `PROPOSE_DESIGNS_TOOL` de `./parse-message`; `DESIGN_TYPES`, `DesignType` de `@/lib/types/design`.
- Produces:
  ```ts
  export interface ChatTurn { role: 'user' | 'assistant'; text: string }
  export interface CardSnapshot {
    id: string; type: string | null; player: string;
    match_home: string; match_away: string;
    deadline_at: string | null; designer_name: string | null;
    details: string; warnings: string[];
  }
  export interface NormalizedUpdate {
    id: string;
    type?: DesignType; player?: string; match_home?: string; match_away?: string;
    deadline_at?: string | null; designer_id?: string | null; details?: string;
    warnings: string[];
  }
  export type ToolCall =
    | { tool: 'add_designs'; designs: ParsedDesignCandidate[] }
    | { tool: 'update_designs'; updates: NormalizedUpdate[] }
    | { tool: 'remove_designs'; ids: string[] }
    | { tool: 'ask'; question: string; options: { label: string; value: string }[] };
  export const CHAT_TOOLS: readonly unknown[];
  export function buildChatSystemPrompt(opts: { today: string; designerNames: string[]; cards: CardSnapshot[] }): string;
  export function serializeCards(cards: CardSnapshot[]): string;
  export function normalizeUpdate(raw: RawModelUpdate, known: Set<string>, designers: ParseDesigner[], now: Date): NormalizedUpdate | null;
  export function trimHistory(turns: ChatTurn[]): ChatTurn[];
  ```

- [ ] **Step 1: Escribir los tests que fallan**

```ts
import { describe, it, expect } from 'vitest';
import {
  serializeCards,
  normalizeUpdate,
  trimHistory,
  buildChatSystemPrompt,
  type CardSnapshot,
  type ChatTurn,
} from './chat-agent';
import type { ParseDesigner } from './parse-message';

const DESIGNERS: ParseDesigner[] = [
  { id: 'd-1', display_name: 'Lorenzo', full_name: 'Lorenzo Ruiz' },
  { id: 'd-2', display_name: 'Ana', full_name: 'Ana Pérez' },
];

function snapshot(overrides: Partial<CardSnapshot> = {}): CardSnapshot {
  return {
    id: 'c-1', type: 'matchday', player: 'Joan García',
    match_home: 'Espanyol', match_away: 'Getafe',
    deadline_at: '2026-08-14T12:00', designer_name: null,
    details: '', warnings: [], ...overrides,
  };
}

describe('serializeCards', () => {
  it('describe cada tarjeta en una línea con su id', () => {
    const out = serializeCards([snapshot()]);
    expect(out).toContain('c-1');
    expect(out).toContain('matchday');
    expect(out).toContain('Joan García');
  });

  it('omite las tarjetas vacías para no ensuciar el contexto', () => {
    const vacia = snapshot({
      id: 'c-2', type: null, player: '', match_home: '', match_away: '',
      deadline_at: null, details: '',
    });
    const out = serializeCards([snapshot(), vacia]);
    expect(out).not.toContain('c-2');
  });

  it('lo dice explícitamente cuando no hay ninguna tarjeta', () => {
    expect(serializeCards([])).toContain('ninguna');
  });
});

describe('normalizeUpdate', () => {
  const known = new Set(['c-1']);
  const now = new Date('2026-08-11T10:00:00');

  it('devuelve null si el id no existe en el taller', () => {
    expect(normalizeUpdate({ id: 'fantasma', player: 'X' }, known, DESIGNERS, now)).toBeNull();
  });

  it('aplica solo los campos presentes', () => {
    const out = normalizeUpdate({ id: 'c-1', player: 'Marín' }, known, DESIGNERS, now);
    expect(out).toEqual({ id: 'c-1', player: 'Marín', warnings: [] });
  });

  it('descarta un tipo que no existe y deja aviso', () => {
    const out = normalizeUpdate({ id: 'c-1', type: 'inventado' }, known, DESIGNERS, now);
    expect(out?.type).toBeUndefined();
    expect(out?.warnings).toContain('tipo_no_reconocido');
  });

  it('casa el diseñador por nombre ignorando tildes', () => {
    const out = normalizeUpdate({ id: 'c-1', designer_name: 'ana' }, known, DESIGNERS, now);
    expect(out?.designer_id).toBe('d-2');
  });

  it('deja aviso si el diseñador no está en plantilla', () => {
    const out = normalizeUpdate({ id: 'c-1', designer_name: 'Fulanito' }, known, DESIGNERS, now);
    expect(out?.designer_id).toBeNull();
    expect(out?.warnings).toContain('disenador_no_encontrado');
  });

  it('rechaza una fecha con formato inválido', () => {
    const out = normalizeUpdate({ id: 'c-1', deadline_at: 'el viernes' }, known, DESIGNERS, now);
    expect(out?.deadline_at).toBeUndefined();
    expect(out?.warnings).toContain('fecha_no_reconocida');
  });

  it('acepta una fecha bien formada', () => {
    const out = normalizeUpdate({ id: 'c-1', deadline_at: '2026-08-15T18:00' }, known, DESIGNERS, now);
    expect(out?.deadline_at).toBe('2026-08-15T18:00');
    expect(out?.warnings).toEqual([]);
  });

  it('permite vaciar el diseñador con designer_name vacío', () => {
    const out = normalizeUpdate({ id: 'c-1', designer_name: '' }, known, DESIGNERS, now);
    expect(out?.designer_id).toBeNull();
    expect(out?.warnings).toEqual([]);
  });
});

describe('trimHistory', () => {
  it('deja intacto un hilo corto', () => {
    const turns: ChatTurn[] = [
      { role: 'user', text: 'hola' },
      { role: 'assistant', text: 'qué tal' },
    ];
    expect(trimHistory(turns)).toEqual(turns);
  });

  it('conserva siempre el primer mensaje del usuario al recortar por número', () => {
    const turns: ChatTurn[] = [{ role: 'user', text: 'EL VOLCADO' }];
    for (let i = 0; i < 40; i++) {
      turns.push({ role: i % 2 === 0 ? 'assistant' : 'user', text: `t${i}` });
    }
    const out = trimHistory(turns);
    expect(out.length).toBeLessThanOrEqual(20);
    expect(out[0].text).toBe('EL VOLCADO');
    expect(out[out.length - 1].text).toBe('t39');
  });

  it('recorta también por tamaño total', () => {
    const gordo = 'x'.repeat(9000);
    const turns: ChatTurn[] = [
      { role: 'user', text: 'EL VOLCADO' },
      { role: 'assistant', text: gordo },
      { role: 'user', text: gordo },
      { role: 'assistant', text: gordo },
      { role: 'user', text: 'último' },
    ];
    const out = trimHistory(turns);
    const total = out.reduce((n, t) => n + t.text.length, 0);
    expect(total).toBeLessThanOrEqual(24_000);
    expect(out[0].text).toBe('EL VOLCADO');
    expect(out[out.length - 1].text).toBe('último');
  });
});

describe('buildChatSystemPrompt', () => {
  it('incluye la fecha, los diseñadores y el estado del taller', () => {
    const prompt = buildChatSystemPrompt({
      today: 'martes, 11 de agosto de 2026',
      designerNames: ['Lorenzo', 'Ana'],
      cards: [snapshot()],
    });
    expect(prompt).toContain('11 de agosto de 2026');
    expect(prompt).toContain('Lorenzo');
    expect(prompt).toContain('c-1');
    expect(prompt).toContain('add_designs');
  });
});
```

- [ ] **Step 2: Ejecutar y ver que falla**

Run: `npx vitest run lib/services/designs/chat-agent.test.ts`
Expected: FAIL — «Failed to resolve import "./chat-agent"».

- [ ] **Step 3: Implementar `chat-agent.ts`**

```ts
import { DESIGN_TYPES, type DesignType } from '@/lib/types/design';
import {
  matchDesigner,
  PROPOSE_DESIGNS_TOOL,
  type ParseDesigner,
  type ParsedDesignCandidate,
} from './parse-message';

/**
 * Lógica pura del agente conversacional de alta de diseños: herramientas que
 * puede usar, prompt de sistema (que incluye el estado del taller), y
 * normalización de las ediciones que propone. Sin HTTP y sin React: eso vive
 * en `app/api/designs/chat/route.ts` y en los hooks del diálogo.
 *
 * Extiende `parse-message.ts` (el agente one-shot original) en vez de
 * sustituirlo: `normalizeCandidate` y `matchDesigner` siguen siendo la única
 * puerta por la que un valor del modelo entra al dominio de la app.
 */

/** Turno del hilo tal y como viaja entre cliente y servidor: texto plano. */
export interface ChatTurn {
  role: 'user' | 'assistant';
  text: string;
}

/** Foto de una tarjeta del taller, sin campos de UI. */
export interface CardSnapshot {
  id: string;
  type: string | null;
  player: string;
  match_home: string;
  match_away: string;
  deadline_at: string | null;
  designer_name: string | null;
  details: string;
  warnings: string[];
}

/** Edición cruda propuesta por el modelo. */
export interface RawModelUpdate {
  id?: string;
  type?: string;
  player?: string;
  match_home?: string;
  match_away?: string;
  deadline_at?: string;
  designer_name?: string;
  details?: string;
}

/** Edición ya validada contra el dominio. Solo trae los campos a cambiar. */
export interface NormalizedUpdate {
  id: string;
  type?: DesignType;
  player?: string;
  match_home?: string;
  match_away?: string;
  deadline_at?: string | null;
  designer_id?: string | null;
  details?: string;
  warnings: string[];
}

export interface AskOption {
  label: string;
  value: string;
}

/** Lo que el modelo pide hacer en un turno, ya normalizado. */
export type ToolCall =
  | { tool: 'add_designs'; designs: ParsedDesignCandidate[] }
  | { tool: 'update_designs'; updates: NormalizedUpdate[] }
  | { tool: 'remove_designs'; ids: string[] }
  | { tool: 'ask'; question: string; options: AskOption[] };

const UPDATE_FIELDS = {
  id: { type: 'string', description: 'id de la tarjeta a modificar' },
  type: { type: 'string', description: 'slug del tipo de pieza' },
  player: { type: 'string' },
  match_home: { type: 'string' },
  match_away: { type: 'string' },
  deadline_at: { type: 'string', description: 'YYYY-MM-DDTHH:mm hora local' },
  designer_name: { type: 'string', description: 'nombre del diseñador, o cadena vacía para dejarlo automático' },
  details: { type: 'string' },
} as const;

/** Las cuatro herramientas del agente. `add_designs` reusa el schema probado. */
export const CHAT_TOOLS = [
  {
    name: 'add_designs',
    description: 'Añade tarjetas nuevas al taller a partir de lo que pide el usuario',
    input_schema: PROPOSE_DESIGNS_TOOL.input_schema,
  },
  {
    name: 'update_designs',
    description: 'Modifica tarjetas que ya existen en el taller, identificadas por su id',
    input_schema: {
      type: 'object',
      properties: {
        updates: {
          type: 'array',
          items: { type: 'object', properties: UPDATE_FIELDS, required: ['id'] },
        },
      },
      required: ['updates'],
    },
  },
  {
    name: 'remove_designs',
    description: 'Elimina tarjetas del taller por su id',
    input_schema: {
      type: 'object',
      properties: { ids: { type: 'array', items: { type: 'string' } } },
      required: ['ids'],
    },
  },
  {
    name: 'ask',
    description:
      'Pregunta al usuario UNA sola cosa, agrupando todas las dudas equivalentes, con respuestas rápidas',
    input_schema: {
      type: 'object',
      properties: {
        question: { type: 'string' },
        options: {
          type: 'array',
          description: '2-3 respuestas rápidas, textos muy cortos',
          items: {
            type: 'object',
            properties: { label: { type: 'string' }, value: { type: 'string' } },
            required: ['label', 'value'],
          },
        },
      },
      required: ['question'],
    },
  },
] as const;

/** Una tarjeta está vacía si no tiene ni tipo ni nada escrito. */
function isSnapshotEmpty(card: CardSnapshot): boolean {
  return (
    !card.type &&
    !card.player.trim() &&
    !card.match_home.trim() &&
    !card.match_away.trim() &&
    !card.deadline_at &&
    !card.details.trim()
  );
}

/** El taller en texto, una línea por tarjeta, para el prompt de sistema. */
export function serializeCards(cards: CardSnapshot[]): string {
  const utiles = cards.filter((c) => !isSnapshotEmpty(c));
  if (utiles.length === 0) return 'El taller no tiene ninguna tarjeta todavía.';

  return utiles
    .map((c, i) => {
      const partes = [
        `#${i + 1} id=${c.id}`,
        `tipo=${c.type ?? 'sin elegir'}`,
        c.player ? `jugador=${c.player}` : null,
        c.match_home || c.match_away ? `partido=${c.match_home} vs ${c.match_away}` : null,
        `entrega=${c.deadline_at ?? 'sin fecha'}`,
        c.designer_name ? `disenador=${c.designer_name}` : 'disenador=automatico',
        c.details ? `detalles=${c.details}` : null,
        c.warnings.length ? `avisos=${c.warnings.join(',')}` : null,
      ].filter(Boolean);
      return partes.join(' · ');
    })
    .join('\n');
}

export function buildChatSystemPrompt(opts: {
  today: string;
  designerNames: string[];
  cards: CardSnapshot[];
}): string {
  return `Eres el asistente de alta de diseños de PHSPORT (agencia de representación futbolística). Conversas con quien da de alta los diseños gráficos de la semana y mantienes con él un taller de tarjetas: cada tarjeta es un diseño que TODAVÍA NO EXISTE en el sistema.

Hoy es ${opts.today} (zona horaria Europe/Madrid).

Tipos válidos (slug — cuándo usarlo): matchday — partido de un jugador; cumpleanos; convocatoria; debut; internacionalidad — convocatoria con selección; fichaje; cesion; firma — renovación/firma de contrato; playoff; welcome; md_conjunto — matchday de varios jugadores; md_animado — matchday animado; cv — CV/vídeo de captación; presentacion_captacion.

Diseñadores del equipo: ${opts.designerNames.join(', ')}. Solo puedes asignar a estos nombres, y SOLO si el usuario lo pide.

ESTADO ACTUAL DEL TALLER:
${serializeCards(opts.cards)}

Tus herramientas:
- add_designs — crear tarjetas nuevas.
- update_designs — modificar tarjetas existentes; identifícalas SIEMPRE por el id que ves arriba, nunca por su número de orden.
- remove_designs — eliminar tarjetas.
- ask — preguntar al usuario. AGRUPA: si a tres tarjetas les falta la fecha, es UNA pregunta con opciones ("¿Las tres para el viernes?"), no tres preguntas.

Reglas:
- Un diseño por pieza pedida. No inventes diseños ni valores que el usuario no diga.
- Si te falta un dato, CREA IGUALMENTE la tarjeta con lo que sepas, marca el campo en needs_review, y pregunta después con ask. Nunca retrases la creación por una duda.
- deadline_at: "viernes" = el próximo viernes desde hoy; sin año, el año en curso (o el siguiente si esa fecha ya pasó); sin hora, usa 12:00 y añade "hora_asumida" a needs_review.
- matchday: rellena match_home y match_away si el mensaje los da; el equipo del jugador suele ser el local salvo que se indique lo contrario.
- md_conjunto: player admite varios nombres separados por coma.
- details: la información específica que no cabe en los otros campos (motivo, club, dorsal, selección...).
- TÚ NO CREAS NADA EN EL SISTEMA: solo preparas el borrador. Quien lo confirma es la persona, con el botón de crear. Nunca digas que has creado, guardado o asignado diseños de verdad.
- Responde en español, breve y sin florituras. Una o dos frases bastan; las tarjetas ya se ven solas.`;
}

const DEADLINE_FORMAT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const ONE_HOUR_MS = 60 * 60 * 1000;

/**
 * Valida una edición del modelo contra el dominio. Devuelve `null` si la
 * tarjeta no existe (el modelo se inventó un id, o el usuario la borró
 * mientras tanto). Los campos ausentes no se tocan; los inválidos se
 * descartan dejando aviso.
 */
export function normalizeUpdate(
  raw: RawModelUpdate,
  known: Set<string>,
  designers: ParseDesigner[],
  now: Date
): NormalizedUpdate | null {
  const id = raw.id?.trim();
  if (!id || !known.has(id)) return null;

  const out: NormalizedUpdate = { id, warnings: [] };

  if (raw.type !== undefined) {
    if ((DESIGN_TYPES as readonly string[]).includes(raw.type)) {
      out.type = raw.type as DesignType;
    } else {
      out.warnings.push('tipo_no_reconocido');
    }
  }

  if (raw.player !== undefined) out.player = raw.player.trim();
  if (raw.match_home !== undefined) out.match_home = raw.match_home.trim();
  if (raw.match_away !== undefined) out.match_away = raw.match_away.trim();
  if (raw.details !== undefined) out.details = raw.details.trim();

  if (raw.designer_name !== undefined) {
    const nombre = raw.designer_name.trim();
    if (!nombre) {
      out.designer_id = null; // volver a automático
    } else {
      const encontrado = matchDesigner(nombre, designers);
      out.designer_id = encontrado;
      if (!encontrado) out.warnings.push('disenador_no_encontrado');
    }
  }

  if (raw.deadline_at !== undefined) {
    const value = raw.deadline_at.trim();
    if (!value) {
      out.deadline_at = null;
    } else {
      const date = DEADLINE_FORMAT.test(value) ? new Date(value) : null;
      if (!date || Number.isNaN(date.getTime())) {
        out.warnings.push('fecha_no_reconocida');
      } else {
        out.deadline_at = value;
        if (date.getTime() < now.getTime() - ONE_HOUR_MS) out.warnings.push('fecha_pasada');
      }
    }
  }

  return out;
}

const MAX_TURNS = 20;
const MAX_CHARS = 24_000;

/**
 * Recorta el hilo a los últimos MAX_TURNS turnos y MAX_CHARS caracteres,
 * conservando SIEMPRE el primer mensaje del usuario: suele ser el volcado de
 * WhatsApp con toda la información de la semana.
 */
export function trimHistory(turns: ChatTurn[]): ChatTurn[] {
  if (turns.length === 0) return [];

  const primero = turns[0];
  const resto = turns.slice(1);

  const porNumero = resto.slice(-(MAX_TURNS - 1));

  const conservados: ChatTurn[] = [];
  let total = primero.text.length;
  for (let i = porNumero.length - 1; i >= 0; i--) {
    const turno = porNumero[i];
    if (total + turno.text.length > MAX_CHARS) break;
    total += turno.text.length;
    conservados.unshift(turno);
  }

  return [primero, ...conservados];
}
```

- [ ] **Step 4: Ejecutar los tests**

Run: `npx vitest run lib/services/designs/chat-agent.test.ts`
Expected: PASS, todos.

- [ ] **Step 5: Commit**

```bash
git add lib/services/designs/chat-agent.ts lib/services/designs/chat-agent.test.ts
git commit -m "$(cat <<'EOF'
feat(agente): herramientas y prompt del agente conversacional

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012oArwGemBLE13Koo3GSoeZ
EOF
)"
```

---

### Task 3: Aplicar las herramientas al borrador y persistirlo

**Files:**
- Create: `lib/utils/design-draft.ts`
- Test: `lib/utils/design-draft.test.ts`

**Interfaces:**
- Consumes: `DesignCard`, `createEmptyCard`, `isCardEmpty` de `@/lib/utils/design-cards`; `ToolCall`, `CardSnapshot`, `ChatTurn` de `@/lib/services/designs/chat-agent`; `ParsedDesignCandidate` de `@/lib/services/designs/parse-message`.
- Produces:
  ```ts
  export type ReceiptAction = 'added' | 'updated' | 'removed';
  export interface CardReceipt { id: string; action: ReceiptAction }
  export interface ApplyResult { cards: DesignCard[]; receipts: CardReceipt[] }
  export function applyToolCalls(cards: DesignCard[], calls: ToolCall[]): ApplyResult;
  export function toSnapshots(cards: DesignCard[], designerNameById: (id: string) => string | null): CardSnapshot[];
  export function serializeDraft(draft: { cards: DesignCard[]; messages: unknown[] }): string;
  export function deserializeDraft(raw: string | null): { cards: DesignCard[]; messages: unknown[] } | null;
  export const DRAFT_STORAGE_KEY = 'phsport:design-draft:v1';
  ```

- [ ] **Step 1: Escribir los tests que fallan**

```ts
import { describe, it, expect } from 'vitest';
import {
  applyToolCalls,
  toSnapshots,
  serializeDraft,
  deserializeDraft,
} from './design-draft';
import { createEmptyCard, type DesignCard } from './design-cards';
import type { ToolCall } from '@/lib/services/designs/chat-agent';

function card(overrides: Partial<DesignCard> = {}): DesignCard {
  return { ...createEmptyCard(), ...overrides };
}

const candidato = {
  type: 'matchday' as const, player: 'Joan García',
  match_home: 'Espanyol', match_away: 'Getafe',
  deadline_at: '2026-08-14T12:00', designer_id: null,
  details: '', warnings: [],
};

describe('applyToolCalls · add_designs', () => {
  it('reemplaza la única tarjeta si está vacía', () => {
    const inicial = [card()];
    const { cards, receipts } = applyToolCalls(inicial, [
      { tool: 'add_designs', designs: [candidato] },
    ]);
    expect(cards).toHaveLength(1);
    expect(cards[0].player).toBe('Joan García');
    expect(cards[0].source).toBe('ia');
    expect(receipts).toEqual([{ id: cards[0].id, action: 'added' }]);
  });

  it('añade al final si ya hay trabajo hecho', () => {
    const inicial = [card({ player: 'Marín', type: 'cumpleanos' })];
    const { cards } = applyToolCalls(inicial, [
      { tool: 'add_designs', designs: [candidato] },
    ]);
    expect(cards).toHaveLength(2);
    expect(cards[1].player).toBe('Joan García');
  });

  it('convierte la fecha ISO del candidato en Date', () => {
    const { cards } = applyToolCalls([card()], [
      { tool: 'add_designs', designs: [candidato] },
    ]);
    expect(cards[0].deadline_at).toBeInstanceOf(Date);
  });
});

describe('applyToolCalls · update_designs', () => {
  it('parchea solo los campos presentes', () => {
    const inicial = [card({ id: 'c-1', player: 'Marín', type: 'cumpleanos' })];
    const { cards, receipts } = applyToolCalls(inicial, [
      { tool: 'update_designs', updates: [{ id: 'c-1', player: 'Joan', warnings: [] }] },
    ]);
    expect(cards[0].player).toBe('Joan');
    expect(cards[0].type).toBe('cumpleanos');
    expect(receipts).toEqual([{ id: 'c-1', action: 'updated' }]);
  });

  it('ignora un id que no existe, sin recibo', () => {
    const inicial = [card({ id: 'c-1' })];
    const { cards, receipts } = applyToolCalls(inicial, [
      { tool: 'update_designs', updates: [{ id: 'fantasma', player: 'X', warnings: [] }] },
    ]);
    expect(cards).toEqual(inicial);
    expect(receipts).toEqual([]);
  });

  it('acumula los avisos de la edición sin duplicarlos', () => {
    const inicial = [card({ id: 'c-1', warnings: ['hora_asumida'] })];
    const { cards } = applyToolCalls(inicial, [
      { tool: 'update_designs', updates: [{ id: 'c-1', warnings: ['hora_asumida', 'fecha_pasada'] }] },
    ]);
    expect(cards[0].warnings).toEqual(['hora_asumida', 'fecha_pasada']);
  });

  it('vacía la fecha cuando la edición trae deadline_at null', () => {
    const inicial = [card({ id: 'c-1', deadline_at: new Date('2026-08-14T12:00') })];
    const { cards } = applyToolCalls(inicial, [
      { tool: 'update_designs', updates: [{ id: 'c-1', deadline_at: null, warnings: [] }] },
    ]);
    expect(cards[0].deadline_at).toBeUndefined();
  });
});

describe('applyToolCalls · remove_designs', () => {
  it('elimina por id y deja recibo', () => {
    const inicial = [card({ id: 'c-1' }), card({ id: 'c-2' })];
    const { cards, receipts } = applyToolCalls(inicial, [
      { tool: 'remove_designs', ids: ['c-1'] },
    ]);
    expect(cards).toHaveLength(1);
    expect(cards[0].id).toBe('c-2');
    expect(receipts).toEqual([{ id: 'c-1', action: 'removed' }]);
  });

  it('deja siempre al menos una tarjeta en el taller', () => {
    const inicial = [card({ id: 'c-1' })];
    const { cards } = applyToolCalls(inicial, [{ tool: 'remove_designs', ids: ['c-1'] }]);
    expect(cards).toHaveLength(1);
    expect(cards[0].id).not.toBe('c-1');
  });
});

describe('applyToolCalls · combinaciones', () => {
  it('aplica varias herramientas en orden dentro de un turno', () => {
    const inicial = [card({ id: 'c-1', player: 'Marín', type: 'cumpleanos' })];
    const calls: ToolCall[] = [
      { tool: 'add_designs', designs: [candidato] },
      { tool: 'update_designs', updates: [{ id: 'c-1', player: 'Marín Jr', warnings: [] }] },
      { tool: 'ask', question: '¿Fecha?', options: [] },
    ];
    const { cards, receipts } = applyToolCalls(inicial, calls);
    expect(cards).toHaveLength(2);
    expect(cards[0].player).toBe('Marín Jr');
    expect(receipts).toHaveLength(2); // ask no deja recibo
  });
});

describe('toSnapshots', () => {
  it('traduce el designer_id a nombre y la fecha a ISO local', () => {
    const cards = [card({ id: 'c-1', designer_id: 'd-1', deadline_at: new Date('2026-08-14T12:00') })];
    const [snap] = toSnapshots(cards, (id) => (id === 'd-1' ? 'Lorenzo' : null));
    expect(snap.designer_name).toBe('Lorenzo');
    expect(snap.deadline_at).toBe('2026-08-14T12:00');
  });
});

describe('serializeDraft / deserializeDraft', () => {
  it('sobrevive a la ida y vuelta conservando la fecha como Date', () => {
    const draft = {
      cards: [card({ id: 'c-1', deadline_at: new Date('2026-08-14T12:00') })],
      messages: [{ role: 'user', text: 'hola' }],
    };
    const vuelta = deserializeDraft(serializeDraft(draft));
    expect(vuelta?.cards[0].deadline_at).toBeInstanceOf(Date);
    expect(vuelta?.cards[0].deadline_at?.getTime()).toBe(draft.cards[0].deadline_at!.getTime());
    expect(vuelta?.messages).toEqual(draft.messages);
  });

  it('devuelve null ante un payload corrupto', () => {
    expect(deserializeDraft('{no es json')).toBeNull();
    expect(deserializeDraft(null)).toBeNull();
  });

  it('descarta un borrador de otra versión', () => {
    expect(deserializeDraft(JSON.stringify({ version: 99, cards: [], messages: [] }))).toBeNull();
  });
});
```

- [ ] **Step 2: Ejecutar y ver que falla**

Run: `npx vitest run lib/utils/design-draft.test.ts`
Expected: FAIL — no resuelve `./design-draft`.

- [ ] **Step 3: Implementar `design-draft.ts`**

```ts
import { createEmptyCard, isCardEmpty, type DesignCard } from './design-cards';
import type { CardSnapshot, ToolCall } from '@/lib/services/designs/chat-agent';
import type { ParsedDesignCandidate } from '@/lib/services/designs/parse-message';

/**
 * Puente entre lo que propone el agente y el taller de tarjetas, más la
 * persistencia del borrador en `localStorage`. Todo síncrono y puro: los
 * hooks se limitan a llamar aquí.
 */

export type ReceiptAction = 'added' | 'updated' | 'removed';

/** Eco de una tarjeta tocada en un turno; el hilo lo pinta como fila resumen. */
export interface CardReceipt {
  id: string;
  action: ReceiptAction;
}

export interface ApplyResult {
  cards: DesignCard[];
  receipts: CardReceipt[];
}

export const DRAFT_STORAGE_KEY = 'phsport:design-draft:v1';
const DRAFT_VERSION = 1;

/** Fecha local "YYYY-MM-DDTHH:mm" → Date. Devuelve undefined si no cuadra. */
function isoLocalToDate(value: string | null | undefined): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

/** Date → "YYYY-MM-DDTHH:mm" en hora local (no UTC: el agente razona en local). */
function dateToIsoLocal(date: Date | undefined): string | null {
  if (!date) return null;
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

function candidateToCard(candidate: ParsedDesignCandidate): DesignCard {
  return {
    ...createEmptyCard(),
    type: candidate.type,
    player: candidate.player,
    match_home: candidate.match_home,
    match_away: candidate.match_away,
    deadline_at: isoLocalToDate(candidate.deadline_at),
    designer_id: candidate.designer_id,
    details: candidate.details,
    source: 'ia',
    warnings: candidate.warnings,
  };
}

/**
 * Aplica en orden las herramientas de un turno. Reglas invariantes:
 * - `add_designs` reemplaza la tarjeta inicial si es la única y está vacía.
 * - `update_designs`/`remove_designs` ignoran ids inexistentes en silencio.
 * - El taller nunca se queda sin tarjetas: si se borra la última, entra una vacía.
 * - `ask` no toca el taller (no deja recibo).
 */
export function applyToolCalls(cards: DesignCard[], calls: ToolCall[]): ApplyResult {
  let out = cards;
  const receipts: CardReceipt[] = [];

  for (const call of calls) {
    if (call.tool === 'add_designs') {
      if (call.designs.length === 0) continue;
      const nuevas = call.designs.map(candidateToCard);
      const reemplaza = out.length === 1 && isCardEmpty(out[0]);
      out = reemplaza ? nuevas : [...out, ...nuevas];
      receipts.push(...nuevas.map((c) => ({ id: c.id, action: 'added' as const })));
    }

    if (call.tool === 'update_designs') {
      for (const update of call.updates) {
        const index = out.findIndex((c) => c.id === update.id);
        if (index === -1) continue;

        const actual = out[index];
        const patch: Partial<DesignCard> = {};
        if (update.type !== undefined) patch.type = update.type;
        if (update.player !== undefined) patch.player = update.player;
        if (update.match_home !== undefined) patch.match_home = update.match_home;
        if (update.match_away !== undefined) patch.match_away = update.match_away;
        if (update.details !== undefined) patch.details = update.details;
        if (update.designer_id !== undefined) patch.designer_id = update.designer_id;
        if (update.deadline_at !== undefined) {
          patch.deadline_at = update.deadline_at === null
            ? undefined
            : isoLocalToDate(update.deadline_at);
        }
        if (update.warnings.length > 0) {
          patch.warnings = [...new Set([...actual.warnings, ...update.warnings])];
        }

        out = out.map((c, i) => (i === index ? { ...c, ...patch } : c));
        receipts.push({ id: update.id, action: 'updated' });
      }
    }

    if (call.tool === 'remove_designs') {
      for (const id of call.ids) {
        if (!out.some((c) => c.id === id)) continue;
        out = out.filter((c) => c.id !== id);
        receipts.push({ id, action: 'removed' });
      }
      if (out.length === 0) out = [createEmptyCard()];
    }
  }

  return { cards: out, receipts };
}

/** Tarjetas → foto para el agente, con el diseñador por nombre (no por id). */
export function toSnapshots(
  cards: DesignCard[],
  designerNameById: (id: string) => string | null
): CardSnapshot[] {
  return cards.map((c) => ({
    id: c.id,
    type: c.type,
    player: c.player,
    match_home: c.match_home,
    match_away: c.match_away,
    deadline_at: dateToIsoLocal(c.deadline_at),
    designer_name: c.designer_id ? designerNameById(c.designer_id) : null,
    details: c.details,
    warnings: c.warnings,
  }));
}

interface StoredDraft {
  version: number;
  cards: (Omit<DesignCard, 'deadline_at'> & { deadline_at: string | null })[];
  messages: unknown[];
}

export function serializeDraft(draft: { cards: DesignCard[]; messages: unknown[] }): string {
  const stored: StoredDraft = {
    version: DRAFT_VERSION,
    cards: draft.cards.map(({ deadline_at, ...rest }) => ({
      ...rest,
      deadline_at: deadline_at ? deadline_at.toISOString() : null,
    })),
    messages: draft.messages,
  };
  return JSON.stringify(stored);
}

/** Un borrador ilegible o de otra versión se descarta sin ruido. */
export function deserializeDraft(
  raw: string | null
): { cards: DesignCard[]; messages: unknown[] } | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as StoredDraft;
    if (parsed?.version !== DRAFT_VERSION || !Array.isArray(parsed.cards)) return null;

    return {
      cards: parsed.cards.map(({ deadline_at, ...rest }) => ({
        ...rest,
        deadline_at: deadline_at ? new Date(deadline_at) : undefined,
      })) as DesignCard[],
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
    };
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Ejecutar los tests**

Run: `npx vitest run lib/utils/design-draft.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/utils/design-draft.ts lib/utils/design-draft.test.ts
git commit -m "$(cat <<'EOF'
feat(borrador): aplicar las propuestas del agente y persistir el taller

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012oArwGemBLE13Koo3GSoeZ
EOF
)"
```

---

### Task 4: La ruta `/api/designs/chat`

**Files:**
- Create: `app/api/designs/chat/route.ts`
- Modify: `lib/api/schemas.ts:90-93`
- Delete: `app/api/designs/parse/route.ts`

**Interfaces:**
- Consumes: `CHAT_TOOLS`, `buildChatSystemPrompt`, `normalizeUpdate`, `trimHistory`, tipos de `chat-agent`; `normalizeCandidate`, `ParseDesigner` de `parse-message`.
- Produces: respuesta HTTP
  ```ts
  type ChatResponse =
    | { fallback: false; text: string; calls: ToolCall[] }
    | { fallback: true; reason: 'sin_api_key' | 'error_agente' };
  ```

- [ ] **Step 1: Sustituir el schema de zod**

En `lib/api/schemas.ts`, cambiar `parseMessageSchema` por:

```ts
export const designChatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        text: z.string().max(8000),
      })
    )
    .min(1)
    .max(40),
  cards: z
    .array(
      z.object({
        id: z.string().min(1).max(64),
        type: z.string().max(64).nullable(),
        player: z.string().max(200),
        match_home: z.string().max(200),
        match_away: z.string().max(200),
        deadline_at: z.string().max(32).nullable(),
        designer_name: z.string().max(200).nullable(),
        details: z.string().max(2000),
        warnings: z.array(z.string().max(64)).max(20),
      })
    )
    .max(40),
}).strict();
export type DesignChatInput = z.infer<typeof designChatSchema>;
```

- [ ] **Step 2: Escribir la ruta**

```ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { designChatSchema } from '@/lib/api/schemas';
import { validationErrorResponse, unauthorizedResponse } from '@/lib/api/errors';
import { normalizeCandidate, type ParseDesigner, type RawModelDesign } from '@/lib/services/designs/parse-message';
import {
  CHAT_TOOLS,
  buildChatSystemPrompt,
  normalizeUpdate,
  trimHistory,
  type RawModelUpdate,
  type ToolCall,
} from '@/lib/services/designs/chat-agent';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_MODEL = 'claude-haiku-4-5-20251001';
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_DESIGNS = 20;

type ChatResponse =
  | { fallback: false; text: string; calls: ToolCall[] }
  | { fallback: true; reason: 'sin_api_key' | 'error_agente' };

interface ToolUseBlock { type: 'tool_use'; name: string; input: unknown }
interface TextBlock { type: 'text'; text: string }

function isToolUse(block: unknown): block is ToolUseBlock {
  return !!block && typeof block === 'object' && (block as { type?: unknown }).type === 'tool_use';
}

function isText(block: unknown): block is TextBlock {
  return !!block && typeof block === 'object' && (block as { type?: unknown }).type === 'text';
}

/**
 * Turno del agente conversacional de alta de diseños. Sin estado: el hilo y
 * la foto del taller llegan en cada petición. Una sola llamada al modelo por
 * turno — las herramientas las aplica el cliente, no hay bucle de agente.
 * Cualquier fallo tras auth cae a `{ fallback: true }` con 200: el chat nunca
 * debe ver un error de servidor.
 */
export async function POST(request: Request) {
  const reqId = crypto.randomUUID();
  const startedAt = Date.now();

  const rawBody = await request.json().catch(() => ({}));
  const parsed = designChatSchema.safeParse(rawBody);
  if (!parsed.success) return validationErrorResponse(parsed.error, reqId);
  const { messages, cards } = parsed.data;

  const supabase = await createClient();
  const { data, error: userError } = await supabase.auth.getUser();
  if (userError || !data.user) return unauthorizedResponse();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    logger.serverInfo('[API Chat] Sin ANTHROPIC_API_KEY, fallback', { reqId, userId: data.user.id });
    return NextResponse.json<ChatResponse>({ fallback: true, reason: 'sin_api_key' }, { status: 200 });
  }

  try {
    const { data: designers, error: designersError } = await supabase
      .from('profiles')
      .select('id, display_name, full_name')
      .eq('role', 'DESIGNER');

    if (designersError) throw designersError;

    const parseDesigners: ParseDesigner[] = designers ?? [];
    const designerNames = parseDesigners
      .map((d) => d.display_name || d.full_name || '')
      .filter((name) => name.length > 0);

    const today = new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'full',
      timeZone: 'Europe/Madrid',
    }).format(new Date());

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(ANTHROPIC_URL, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: ANTHROPIC_MODEL,
          max_tokens: 2000,
          temperature: 0,
          system: buildChatSystemPrompt({ today, designerNames, cards }),
          messages: trimHistory(messages).map((t) => ({ role: t.role, content: t.text })),
          tools: CHAT_TOOLS,
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`Anthropic API respondió ${response.status}: ${errorText.slice(0, 500)}`);
    }

    const payload: unknown = await response.json();
    const content = (payload as { content?: unknown })?.content;
    const blocks = Array.isArray(content) ? content : [];

    const text = blocks.filter(isText).map((b) => b.text).join('\n').trim();

    const known = new Set(cards.map((c) => c.id));
    const now = new Date();
    const calls: ToolCall[] = [];

    for (const block of blocks.filter(isToolUse)) {
      const input = (block.input ?? {}) as Record<string, unknown>;

      if (block.name === 'add_designs' && Array.isArray(input.designs)) {
        const capped = (input.designs as RawModelDesign[]).slice(0, MAX_DESIGNS);
        calls.push({
          tool: 'add_designs',
          designs: capped.map((raw) => normalizeCandidate(raw, parseDesigners, now)),
        });
      }

      if (block.name === 'update_designs' && Array.isArray(input.updates)) {
        const updates = (input.updates as RawModelUpdate[])
          .map((raw) => normalizeUpdate(raw, known, parseDesigners, now))
          .filter((u): u is NonNullable<typeof u> => u !== null);
        if (updates.length > 0) calls.push({ tool: 'update_designs', updates });
      }

      if (block.name === 'remove_designs' && Array.isArray(input.ids)) {
        const ids = (input.ids as unknown[])
          .filter((id): id is string => typeof id === 'string' && known.has(id));
        if (ids.length > 0) calls.push({ tool: 'remove_designs', ids });
      }

      if (block.name === 'ask' && typeof input.question === 'string') {
        const rawOptions = Array.isArray(input.options) ? input.options : [];
        const options = rawOptions
          .filter((o): o is { label: string; value: string } =>
            !!o && typeof o === 'object' &&
            typeof (o as { label?: unknown }).label === 'string' &&
            typeof (o as { value?: unknown }).value === 'string'
          )
          .slice(0, 3);
        calls.push({ tool: 'ask', question: input.question, options });
      }
    }

    logger.serverInfo('[API Chat] Success', {
      reqId,
      userId: data.user.id,
      tools: calls.map((c) => c.tool),
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json<ChatResponse>({ fallback: false, text, calls }, { status: 200 });
  } catch (error) {
    logger.serverError('[API Chat] Fallback por error del agente', {
      reqId,
      userId: data.user.id,
      durationMs: Date.now() - startedAt,
      error,
    });
    return NextResponse.json<ChatResponse>({ fallback: true, reason: 'error_agente' }, { status: 200 });
  }
}
```

- [ ] **Step 3: Borrar la ruta vieja**

```bash
git rm app/api/designs/parse/route.ts
```

Comprobar que nadie más la llamaba: `grep -rn "designs/parse" --include="*.ts" --include="*.tsx" . --exclude-dir=node_modules` — solo debe quedar `agent-composer.tsx`, que se borra en la Task 8.

- [ ] **Step 4: Verificar**

Run: `npm run type-check`
Expected: falla **solo** en `agent-composer.tsx` (usa `parseMessageSchema` indirectamente vía la ruta borrada). Si falla en otro sitio, arreglarlo antes de seguir.

- [ ] **Step 5: Commit**

```bash
git add app/api/designs/chat/route.ts lib/api/schemas.ts app/api/designs/parse/route.ts
git commit -m "$(cat <<'EOF'
feat(api): la ruta de parseo da paso al turno de conversacion

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012oArwGemBLE13Koo3GSoeZ
EOF
)"
```

---

### Task 5: Hooks de borrador y conversación

**Files:**
- Create: `lib/hooks/use-design-draft.ts`
- Create: `lib/hooks/use-design-chat.ts`

**Interfaces:**
- Consumes: todo lo de las Tasks 2 y 3.
- Produces:
  ```ts
  // use-design-draft.ts
  export function useDesignDraft(opts: { enabled: boolean; design?: Design | null }): {
    cards: DesignCard[]; openId: string | null;
    setOpenId: (id: string | null) => void;
    addCard: () => void;
    updateCard: (id: string, patch: Partial<DesignCard>) => void;
    removeCard: (id: string) => void;
    applyCalls: (calls: ToolCall[]) => CardReceipt[];
    reset: () => void;
    hydrated: boolean;
    storedMessages: unknown[];
    setStoredMessages: (messages: unknown[]) => void;
  };

  // use-design-chat.ts
  export type ChatMessage =
    | { id: string; role: 'user'; text: string }
    | { id: string; role: 'assistant'; text: string; receipts: CardReceipt[]; ask?: Ask; answered?: string }
    | { id: string; role: 'system'; text: string };
  export interface Ask { question: string; options: AskOption[] }
  export function useDesignChat(opts: {
    messages: ChatMessage[];
    setMessages: (updater: (prev: ChatMessage[]) => ChatMessage[]) => void;
    snapshots: () => CardSnapshot[];
    onCalls: (calls: ToolCall[]) => CardReceipt[];
  }): { sending: boolean; send: (text: string) => Promise<void>; answerAsk: (messageId: string, value: string) => Promise<void> };
  ```

- [ ] **Step 1: Escribir `use-design-draft.ts`**

```ts
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createEmptyCard, designToCard, type DesignCard } from '@/lib/utils/design-cards';
import {
  applyToolCalls,
  serializeDraft,
  deserializeDraft,
  DRAFT_STORAGE_KEY,
  type CardReceipt,
} from '@/lib/utils/design-draft';
import type { ToolCall } from '@/lib/services/designs/chat-agent';
import type { Design } from '@/lib/types/design';

const SAVE_DEBOUNCE_MS = 400;

/**
 * Estado del taller de tarjetas y su persistencia. Solo persiste en modo
 * creación: revivir el borrador de una edición ajena no tendría sentido.
 * El hilo del chat se guarda junto a las tarjetas (`messages`), porque el
 * borrador es la conversación Y su resultado — se pierden o sobreviven juntos.
 */
export function useDesignDraft({ enabled, design }: { enabled: boolean; design?: Design | null }) {
  const [cards, setCards] = useState<DesignCard[]>(() => [createEmptyCard()]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [storedMessages, setStoredMessages] = useState<unknown[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Rehidratación / arranque, según el modo del diálogo.
  useEffect(() => {
    if (design) {
      const card = designToCard(design);
      setCards([card]);
      setOpenId(card.id);
      setHydrated(true);
      return;
    }

    if (!enabled) return;

    const guardado = deserializeDraft(
      typeof window === 'undefined' ? null : window.localStorage.getItem(DRAFT_STORAGE_KEY)
    );

    if (guardado && guardado.cards.length > 0) {
      setCards(guardado.cards);
      setStoredMessages(guardado.messages);
    } else {
      setCards([createEmptyCard()]);
      setStoredMessages([]);
    }
    setOpenId(null);
    setHydrated(true);
  }, [design, enabled]);

  const persist = useCallback(
    (nextCards: DesignCard[], nextMessages: unknown[]) => {
      if (design || typeof window === 'undefined') return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        window.localStorage.setItem(
          DRAFT_STORAGE_KEY,
          serializeDraft({ cards: nextCards, messages: nextMessages })
        );
      }, SAVE_DEBOUNCE_MS);
    },
    [design]
  );

  useEffect(() => {
    if (!hydrated) return;
    persist(cards, storedMessages);
  }, [cards, storedMessages, hydrated, persist]);

  useEffect(() => () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
  }, []);

  const addCard = useCallback(() => {
    const card = createEmptyCard();
    setCards((prev) => [...prev, card]);
  }, []);

  const updateCard = useCallback((id: string, patch: Partial<DesignCard>) => {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }, []);

  const removeCard = useCallback((id: string) => {
    setCards((prev) => {
      const next = prev.filter((c) => c.id !== id);
      return next.length > 0 ? next : [createEmptyCard()];
    });
    setOpenId((prev) => (prev === id ? null : prev));
  }, []);

  // Aplica lo que propone el agente y devuelve los ecos para el hilo.
  const applyCalls = useCallback((calls: ToolCall[]): CardReceipt[] => {
    let recibos: CardReceipt[] = [];
    setCards((prev) => {
      const { cards: next, receipts } = applyToolCalls(prev, calls);
      recibos = receipts;
      return next;
    });
    return recibos;
  }, []);

  const reset = useCallback(() => {
    const card = createEmptyCard();
    setCards([card]);
    setOpenId(null);
    setStoredMessages([]);
    if (typeof window !== 'undefined') window.localStorage.removeItem(DRAFT_STORAGE_KEY);
  }, []);

  return {
    cards, openId, setOpenId, addCard, updateCard, removeCard,
    applyCalls, reset, hydrated,
    storedMessages, setStoredMessages,
  };
}
```

**Nota sobre `applyCalls`:** `setCards` con actualizador es asíncrono, pero el
callback se ejecuta de forma síncrona dentro de React 19 al hacer el
*re-render*; para no depender de ese detalle, la implementación real captura
los recibos con una variable local y el llamador los usa **después** del
`await` del envío, no en la misma línea. Si al probar los recibos llegan
vacíos, mover el cálculo a `applyToolCalls(cardsRef.current, calls)` con una
ref sincronizada.

- [ ] **Step 2: Escribir `use-design-chat.ts`**

```ts
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { generateId } from '@/lib/utils/design-form';
import type { AskOption, CardSnapshot, ChatTurn, ToolCall } from '@/lib/services/designs/chat-agent';
import type { CardReceipt } from '@/lib/utils/design-draft';

export interface Ask {
  question: string;
  options: AskOption[];
}

export type ChatMessage =
  | { id: string; role: 'user'; text: string }
  | { id: string; role: 'assistant'; text: string; receipts: CardReceipt[]; ask?: Ask; answered?: string }
  | { id: string; role: 'system'; text: string };

interface ChatSuccess { fallback: false; text: string; calls: ToolCall[] }
interface ChatFallback { fallback: true; reason: string }
type ChatResponse = ChatSuccess | ChatFallback;

function isChatResponse(value: unknown): value is ChatResponse {
  return !!value && typeof value === 'object' && 'fallback' in value;
}

/** Recibo en texto para que el modelo sepa qué hizo, sin protocolo de tools. */
function receiptLine(receipts: CardReceipt[]): string {
  if (receipts.length === 0) return '';
  const cuenta = (accion: CardReceipt['action']) => receipts.filter((r) => r.action === accion).length;
  const partes = [
    cuenta('added') ? `añadidas ${cuenta('added')}` : null,
    cuenta('updated') ? `modificadas ${cuenta('updated')}` : null,
    cuenta('removed') ? `eliminadas ${cuenta('removed')}` : null,
  ].filter(Boolean);
  return partes.length ? ` [${partes.join(', ')} tarjetas]` : '';
}

/** El hilo, el envío y la traducción respuesta → mensajes + herramientas. */
export function useDesignChat({
  messages,
  setMessages,
  snapshots,
  onCalls,
}: {
  messages: ChatMessage[];
  setMessages: (updater: (prev: ChatMessage[]) => ChatMessage[]) => void;
  snapshots: () => CardSnapshot[];
  onCalls: (calls: ToolCall[]) => CardReceipt[];
}) {
  const [sending, setSending] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  useEffect(() => () => abortRef.current?.abort(), []);

  const send = useCallback(
    async (text: string) => {
      const limpio = text.trim();
      if (!limpio || sending) return;

      const userMessage: ChatMessage = { id: generateId(), role: 'user', text: limpio };
      const historial = messagesRef.current;
      setMessages((prev) => [...prev, userMessage]);
      setSending(true);

      const controller = new AbortController();
      abortRef.current = controller;

      // El hilo viaja como texto plano; los recibos van anexados al turno del
      // asistente para que el modelo recuerde qué hizo sin bloques tool_use.
      const turns: ChatTurn[] = [...historial, userMessage]
        .filter((m): m is Extract<ChatMessage, { role: 'user' | 'assistant' }> => m.role !== 'system')
        .map((m) =>
          m.role === 'assistant'
            ? { role: 'assistant' as const, text: `${m.text}${receiptLine(m.receipts)}`.trim() || '(sin texto)' }
            : { role: 'user' as const, text: m.text }
        );

      const esPrimerTurno = historial.length === 0;

      try {
        const response = await fetch('/api/designs/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: turns, cards: snapshots() }),
          signal: controller.signal,
        });

        if (!response.ok) throw new Error(`chat respondió ${response.status}`);
        const data: unknown = await response.json();
        if (!isChatResponse(data)) throw new Error('Respuesta de chat inesperada');
        if (controller.signal.aborted) return;

        if (data.fallback) {
          const receipts = esPrimerTurno
            ? onCalls([
                {
                  tool: 'add_designs',
                  designs: [
                    {
                      type: null, player: '', match_home: '', match_away: '',
                      deadline_at: null, designer_id: null,
                      details: limpio, warnings: ['agente_no_disponible'],
                    },
                  ],
                },
              ])
            : [];

          setMessages((prev) => [
            ...prev,
            {
              id: generateId(),
              role: 'system',
              text: esPrimerTurno
                ? 'El agente no está disponible — tu texto quedó en una tarjeta.'
                : 'El agente no está disponible ahora mismo. Puedes seguir a mano en Tarjetas.',
            },
          ]);
          if (receipts.length === 0) return;
          return;
        }

        const receipts = onCalls(data.calls);
        const ask = data.calls.find((c): c is Extract<ToolCall, { tool: 'ask' }> => c.tool === 'ask');

        setMessages((prev) => [
          ...prev,
          {
            id: generateId(),
            role: 'assistant',
            text: data.text,
            receipts,
            ask: ask ? { question: ask.question, options: ask.options } : undefined,
          },
        ]);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (controller.signal.aborted) return;
        setMessages((prev) => [
          ...prev,
          { id: generateId(), role: 'system', text: 'No he podido contactar con el agente. Inténtalo otra vez.' },
        ]);
      } finally {
        if (!controller.signal.aborted) setSending(false);
      }
    },
    [sending, setMessages, snapshots, onCalls]
  );

  /** Responder con un chip: marca el mensaje como contestado y envía el valor. */
  const answerAsk = useCallback(
    async (messageId: string, value: string) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId && m.role === 'assistant' ? { ...m, answered: value } : m))
      );
      await send(value);
    },
    [send, setMessages]
  );

  return { sending, send, answerAsk };
}
```

- [ ] **Step 3: Verificar**

Run: `npm run type-check`
Expected: los únicos errores restantes son de `agent-composer.tsx`.

- [ ] **Step 4: Commit**

```bash
git add lib/hooks/use-design-draft.ts lib/hooks/use-design-chat.ts
git commit -m "$(cat <<'EOF'
feat(hooks): estado del borrador persistente y del hilo con el agente

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012oArwGemBLE13Koo3GSoeZ
EOF
)"
```

---

### Task 6: Fila resumen compartida

**Files:**
- Create: `components/features/designs/cards/card-summary-row.tsx`
- Modify: `components/features/designs/cards/design-card-item.tsx`

**Interfaces:**
- Produces:
  ```tsx
  export interface CardSummaryRowProps {
    card: DesignCard; index?: number;
    variant?: 'card' | 'receipt';
    muted?: boolean;
  }
  export function CardSummaryRow(props: CardSummaryRowProps): JSX.Element;
  ```

- [ ] **Step 1: Leer la cabecera actual**

Abrir `design-card-item.tsx` y localizar el bloque de cabecera (el botón que hace `onToggle`, antes del `<Collapse open={open}>` de la línea ~151). Ese contenido — índice, etiqueta de tipo, jugador, fecha, `WeightChip`, avisos — es lo que se extrae.

- [ ] **Step 2: Crear el componente extraído**

`card-summary-row.tsx` recibe la tarjeta y pinta **solo el contenido** de la fila (sin el `<button>` ni el chevron, que son responsabilidad de quien la usa):

```tsx
'use client';

import { CalendarDays, AlertTriangle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DESIGN_TYPE_LABELS } from '@/lib/types/design';
import { effectiveTitle, type DesignCard } from '@/lib/utils/design-cards';
import { WeightChip } from './weight-chip';

/**
 * Fila resumen de una tarjeta del taller. Vive en dos sitios con el mismo
 * pixel: la cabecera de `DesignCardItem` (variante 'card') y el eco que el
 * chat deja cuando el agente la toca (variante 'receipt').
 */
export interface CardSummaryRowProps {
  card: DesignCard;
  /** Número de orden; en el eco del chat no se muestra. */
  index?: number;
  variant?: 'card' | 'receipt';
  /** Eco de una tarjeta que ya no existe: se muestra apagado. */
  muted?: boolean;
}

export function CardSummaryRow({ card, index, variant = 'card', muted = false }: CardSummaryRowProps) {
  const etiqueta = card.type ? DESIGN_TYPE_LABELS[card.type] : 'Sin tipo';
  const titulo = effectiveTitle(card) || 'Diseño sin nombre';
  const fecha = card.deadline_at
    ? card.deadline_at.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
    : null;

  return (
    <div className={cn('flex min-w-0 flex-1 items-center gap-2 text-left', muted && 'opacity-50')}>
      {index !== undefined && (
        <span className="shrink-0 font-mono text-xs text-muted-foreground">{index}</span>
      )}
      {card.source === 'ia' && variant === 'card' && (
        <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
      )}
      <span className="min-w-0 flex-1 truncate text-sm font-medium">{titulo}</span>
      {card.type && <WeightChip type={card.type} />}
      {fecha && (
        <span className="hidden shrink-0 items-center gap-1 text-xs text-muted-foreground sm:flex">
          <CalendarDays className="h-3 w-3" />
          {fecha}
        </span>
      )}
      {card.warnings.length > 0 && (
        <AlertTriangle
          className="h-3.5 w-3.5 shrink-0 text-status-warning"
          aria-label={`${card.warnings.length} aviso${card.warnings.length !== 1 ? 's' : ''}`}
        />
      )}
      <span className="sr-only">{etiqueta}</span>
    </div>
  );
}
```

Ajustar los detalles (iconos, orden, clases) a lo que ya pinta hoy la cabecera de `DesignCardItem`, para no cambiar el aspecto: la extracción no debe verse.

- [ ] **Step 3: Sustituir la cabecera en `DesignCardItem`**

Reemplazar el contenido del botón de cabecera por `<CardSummaryRow card={card} index={index} />`, dejando en el botón el `onToggle`, el chevron y las clases de altura táctil.

- [ ] **Step 4: Verificar que no cambió nada**

Run: `npm run test && npm run type-check && npm run lint`
Expected: PASS.

Comprobación visual: `/disenos` → «Crear Diseños» → las filas resumen se ven exactamente igual que antes.

- [ ] **Step 5: Commit**

```bash
git add components/features/designs/cards/card-summary-row.tsx components/features/designs/cards/design-card-item.tsx
git commit -m "$(cat <<'EOF'
refactor(tarjetas): la fila resumen sale a su propio componente

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012oArwGemBLE13Koo3GSoeZ
EOF
)"
```

---

### Task 7: El panel de chat

**Files:**
- Create: `components/features/designs/chat/chat-composer.tsx`
- Create: `components/features/designs/chat/chat-thread.tsx`
- Create: `components/features/designs/chat/chat-panel.tsx`

**Interfaces:**
- Consumes: `ChatMessage`, `Ask` de `use-design-chat`; `CardSummaryRow`; `DesignCard`.
- Produces:
  ```tsx
  export function ChatComposer(props: { onSend: (text: string) => void; disabled?: boolean }): JSX.Element;
  export function ChatThread(props: {
    messages: ChatMessage[]; cardsById: Map<string, DesignCard>;
    sending: boolean;
    onAnswer: (messageId: string, value: string) => void;
    onOpenCard: (cardId: string) => void;
  }): JSX.Element;
  export function ChatPanel(props: {
    messages: ChatMessage[]; cardsById: Map<string, DesignCard>;
    sending: boolean;
    onSend: (text: string) => void;
    onAnswer: (messageId: string, value: string) => void;
    onOpenCard: (cardId: string) => void;
  }): JSX.Element;
  ```

- [ ] **Step 1: `chat-composer.tsx`**

Es el textarea auto-creciente de `AgentComposer` (líneas 147-191 del original), sin la lógica de red: `useLayoutEffect` para crecer, `Cmd/Ctrl+Enter` para enviar, botón de 44 px (`size-11 md:size-9`), placeholder «Escribe o pega un mensaje…», icono `Sparkles`. Al enviar, limpia el campo.

- [ ] **Step 2: `chat-thread.tsx`**

Pinta la lista de mensajes con estas reglas:

- **Usuario**: burbuja alineada a la derecha, `bg-primary/10`, `rounded-2xl`, `whitespace-pre-wrap` (el volcado de WhatsApp trae saltos).
- **Asistente**: sin burbuja, texto plano con icono `Sparkles` al inicio — el agente «habla en la página», no en un bocadillo.
- **Sistema**: una línea `text-status-warning text-xs`.
- **Ecos**: bajo el texto del asistente, una lista de `CardSummaryRow` envueltos en un `<button>` que llama a `onOpenCard(id)`. Cada eco lleva su verbo delante (`Añadida` / `Modificada` / `Eliminada`). Si la tarjeta ya no está en `cardsById`, se pinta `muted` y **sin** botón.
- **Ask**: bajo el texto, los chips en `flex flex-wrap gap-2`, botones `min-h-11 rounded-xl border px-4 text-sm`. Si `answered` está puesto, todos `disabled` y el elegido marcado con `border-primary text-primary`.
- **Enviando**: `Loader2` girando con «Pensando…».
- **Vacío**: estado inicial con una frase — «Pega el mensaje de la semana y te preparo las tarjetas.» — y nada más.
- **Autoscroll**: `useEffect` con `scrollIntoView({ block: 'end' })` sobre un ancla al final, disparado al cambiar `messages.length` y `sending`.

Los ecos entran escalonados: envolver la lista en `AnimatePresence` con `motion.div` e `initial={{ opacity: 0, y: 8 }}`, `animate={{ opacity: 1, y: 0 }}`, `transition={{ ...SPRINGS.smooth, delay: i * 0.08 }}`.

- [ ] **Step 3: `chat-panel.tsx`**

Compone hilo + composer en columna:

```tsx
<div className="flex h-full min-h-0 flex-col gap-3">
  <div className="flex-1 min-h-0 overflow-y-auto pr-1 [scrollbar-gutter:stable]">
    <ChatThread ... />
  </div>
  <ChatComposer ... />
</div>
```

- [ ] **Step 4: Verificar**

Run: `npm run type-check && npm run lint`
Expected: sin errores nuevos.

- [ ] **Step 5: Commit**

```bash
git add components/features/designs/chat/
git commit -m "$(cat <<'EOF'
feat(chat): hilo, ecos de tarjetas y respuestas rapidas

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012oArwGemBLE13Koo3GSoeZ
EOF
)"
```

---

### Task 8: El diálogo con dos pestañas

**Files:**
- Create: `components/features/designs/cards/cards-panel.tsx`
- Modify: `components/features/designs/dialogs/create-design-dialog.tsx`
- Delete: `components/features/designs/cards/agent-composer.tsx`

**Interfaces:**
- Consumes: todo lo anterior.
- Produces: `CreateDesignDialog` con la misma firma pública de hoy (`open`, `onOpenChange`, `onDesignCreated`, `design`, `activeWeekStart`, `activeWeekEnd`) — los consumidores no cambian.

- [ ] **Step 1: Extraer `cards-panel.tsx`**

Mueve la lista de tarjetas del diálogo actual (líneas 227-269) a su propio componente: recibe `cards`, `openId`, `designers`, `loadingDesigners`, `activeWeekStart/End` y los callbacks (`onToggle`, `onChange`, `onRemove`, `onAdd`), y devuelve la lista con su `AnimatePresence` y el botón «Añadir diseño». Añade una `ref` opcional para poder desplazar a una tarjeta concreta.

- [ ] **Step 2: Reescribir el diálogo como orquestador**

Estructura en modo creación:

```tsx
<DialogContent fullscreenOnMobile className="flex h-[100dvh] max-h-none w-full max-w-none flex-col overflow-hidden rounded-none border-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] md:h-[80vh] md:max-h-[780px] md:w-[92vw] md:max-w-[920px] md:rounded-2xl md:border md:p-6">
  <DialogHeader data-drag-handle>…título + «Empezar de cero»…</DialogHeader>

  <Tabs value={tab} onValueChange={setTab} className="mt-4 flex flex-1 min-h-0 flex-col">
    <TabsList className="grid w-full grid-cols-2">
      <TabsTrigger value="cards">Tarjetas · {cards.length}</TabsTrigger>
      <TabsTrigger value="chat" className={cn(!chatDiscovered && 'animate-pulse-ring')}>Chat</TabsTrigger>
    </TabsList>

    <TabsContent value="cards" className="flex-1 min-h-0 overflow-y-auto pr-1 [scrollbar-gutter:stable]">
      <CardsPanel … />
    </TabsContent>
    <TabsContent value="chat" className="flex-1 min-h-0">
      <ChatPanel … />
    </TabsContent>
  </Tabs>

  <DialogFooter>…contador + CTA…</DialogFooter>
</DialogContent>
```

Reglas de cableado:

- `tab` arranca en `'cards'` (decisión: no cambiar el hábito).
- Al entrar en `'chat'` la primera vez: `setChatDiscovered(true)` + `localStorage.setItem('phsport:chat-discovered', '1')`.
- `onOpenCard(cardId)` (desde un eco): `setTab('cards')`, `setOpenId(cardId)` y `requestAnimationFrame` con `scrollIntoView` sobre esa tarjeta.
- Cuando llegan recibos y `tab === 'chat'`: destello de la pestaña Tarjetas — estado `flash` que se pone a `true` y se limpia con `setTimeout(600)`, aplicando `ring-2 ring-primary/40` mientras dure.
- **Modo edición**: sin `Tabs`, sin chat, sin persistencia. Renderiza directamente la tarjeta única, como hoy.
- El hilo se guarda en el borrador: `messages` viene de `storedMessages` del hook (casteado a `ChatMessage[]`) y cada cambio llama a `setStoredMessages`.

- [ ] **Step 3: Añadir la animación del halo**

En `tailwind.config.ts`, dentro de `theme.extend.keyframes` y `animation`:

```ts
keyframes: {
  'pulse-ring': {
    '0%, 100%': { boxShadow: '0 0 0 0 hsl(var(--primary) / 0)' },
    '50%': { boxShadow: '0 0 0 4px hsl(var(--primary) / 0.18)' },
  },
},
animation: {
  'pulse-ring': 'pulse-ring 2.4s ease-in-out infinite',
},
```

- [ ] **Step 4: «Empezar de cero»**

Botón discreto en la cabecera (`variant="ghost"`, icono `RotateCcw`, `min-h-11 md:min-h-0`), visible solo en creación y solo si `cards.length > 1 || !isCardEmpty(cards[0]) || messages.length > 0`. Al pulsar:

```tsx
const ok = await confirm({
  title: 'Empezar de cero',
  description: 'Se borrarán las tarjetas y la conversación de este borrador. Los diseños ya creados no se tocan.',
  confirmText: 'Borrar borrador',
  cancelText: 'Cancelar',
  variant: 'danger',
});
if (ok) { reset(); setMessages(() => []); }
```

(Comprobar el nombre exacto de la variante destructiva en `ConfirmDialog` antes de usarla.)

- [ ] **Step 5: Borrar `agent-composer.tsx`**

```bash
git rm components/features/designs/cards/agent-composer.tsx
```

- [ ] **Step 6: Verificar**

Run: `npm run test && npm run type-check && npm run lint`
Expected: PASS, sin referencias colgando a `AgentComposer` ni a `designs/parse`.

- [ ] **Step 7: Commit**

```bash
git add components/features/designs/cards/cards-panel.tsx components/features/designs/dialogs/create-design-dialog.tsx components/features/designs/cards/agent-composer.tsx tailwind.config.ts
git commit -m "$(cat <<'EOF'
feat(alta): el taller y el chat pasan a convivir en dos pestanas

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012oArwGemBLE13Koo3GSoeZ
EOF
)"
```

---

### Task 9: El teclado del iPhone y el remate final

**Files:**
- Modify: `components/features/designs/chat/chat-panel.tsx`
- Modify: `components/features/designs/dialogs/create-design-dialog.tsx`

- [ ] **Step 1: Anclar el composer al viewport visible**

El problema: en iOS el teclado no reduce `100dvh`, así que el composer queda debajo. Solución con `visualViewport`, dentro de `ChatPanel`:

```tsx
const [keyboardInset, setKeyboardInset] = useState(0);

useEffect(() => {
  const vv = window.visualViewport;
  if (!vv) return;
  const update = () => {
    // Cuánto del layout viewport tapa el teclado.
    const tapado = window.innerHeight - vv.height - vv.offsetTop;
    setKeyboardInset(Math.max(0, tapado));
  };
  update();
  vv.addEventListener('resize', update);
  vv.addEventListener('scroll', update);
  return () => {
    vv.removeEventListener('resize', update);
    vv.removeEventListener('scroll', update);
  };
}, []);
```

Aplicarlo como `style={{ paddingBottom: keyboardInset }}` en el contenedor del panel, y volver a hacer `scrollIntoView` del ancla del hilo cuando `keyboardInset` cambia.

- [ ] **Step 2: Probar en dispositivo real**

`npm run build && npm run start`, abrir desde el iPhone en la red local (o esperar al despliegue de preview). Comprobar: teclado abierto → se ve el campo y el último mensaje; al enviar, el hilo baja solo; al cerrar el teclado no queda hueco muerto.

- [ ] **Step 3: Verificación completa**

```bash
npm run test && npm run type-check && npm run lint && npm run build
```
Expected: los 4 en verde. Copiar el número de tests que pasan.

- [ ] **Step 4: Commit y subida**

```bash
git add components/features/designs/chat/chat-panel.tsx components/features/designs/dialogs/create-design-dialog.tsx
git commit -m "$(cat <<'EOF'
fix(chat): el teclado del iPhone deja de tapar el campo

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_012oArwGemBLE13Koo3GSoeZ
EOF
)"
git push -u origin feat/chat-creacion-disenos
```

---

## Comprobación manual final

Con `npm run dev` y DevTools en modo móvil, en `/disenos` → «Crear Diseños»:

1. La hoja sube desde abajo, ocupa toda la pantalla, la ✕ y el arrastre del título cierran.
2. Se abre en «Tarjetas»; la pestaña «Chat» respira hasta que se toca una vez.
3. Pegar un mensaje de varios diseños en Chat → las tarjetas entran escalonadas, el hilo deja sus ecos y la pestaña Tarjetas destella con el contador subido.
4. Tocar un eco lleva a la tarjeta abierta y resaltada.
5. «cambia la fecha de la 2 al viernes» modifica esa tarjeta y deja eco de modificación.
6. Una pregunta con chips: pulsar uno responde y desactiva el resto.
7. Cerrar el diálogo y reabrirlo: tarjetas y conversación siguen ahí.
8. «Empezar de cero» pide confirmación y limpia ambas cosas.
9. El CTA crea los diseños y limpia el borrador.
10. Editar un diseño existente: sin pestañas, sin chat, igual que siempre.
11. Con `ANTHROPIC_API_KEY` fuera del entorno: el primer mensaje cae a una tarjeta con aviso, los siguientes solo avisan.
