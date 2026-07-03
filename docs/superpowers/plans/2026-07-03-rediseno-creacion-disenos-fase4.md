# Rediseño de creación de diseños — Fase 4: agente de parseo + compositor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir al taller de tarjetas (Fase 3) la barra del agente: un compositor claro e integrado bajo la lista donde se escribe una instrucción o se pega un mensaje de WhatsApp; el texto va a `POST /api/designs/parse` (Claude Haiku), y las propuestas caen como tarjetas con sello "Agente" y avisos — nada se persiste hasta confirmar. Si el agente falla o no hay API key, el texto cae íntegro en una tarjeta (campo detalles): no se pierde nada y no hay error de cara al usuario.

**Architecture:** La lógica pura (prompt, normalización de la salida del modelo, matching de diseñadores, validación de fechas) vive en `lib/services/designs/parse-message.ts`, testeada con Vitest con respuestas simuladas. La ruta `app/api/designs/parse/route.ts` solo orquesta: auth → fetch de diseñadores → llamada HTTP directa a la API de Anthropic (sin SDK) con salida forzada vía tool_use → normalización → respuesta. El cliente (`agent-composer.tsx`) convierte candidatos en `DesignCard`s (`source: 'ia'`) y los delega al diálogo.

**Tech Stack:** Fetch nativo a `https://api.anthropic.com/v1/messages` (modelo `claude-haiku-4-5-20251001`), Zod, Vitest, React/framer-motion.

## Global Constraints

- **Modelo y llamada:** `claude-haiku-4-5-20251001` vía `fetch` directo (NO añadir `@anthropic-ai/sdk`). Headers: `x-api-key: process.env.ANTHROPIC_API_KEY`, `anthropic-version: 2023-06-01`, `content-type: application/json`. `temperature: 0`, `max_tokens: 1500`, timeout de 15s con `AbortController`.
- **Salida forzada:** `tools: [PROPOSE_DESIGNS_TOOL]` + `tool_choice: { type: 'tool', name: 'propose_designs' }`. Nunca parsear texto libre del modelo.
- **El servidor NUNCA persiste** en esta ruta; devuelve candidatos. Auth requerida (patrón de las otras rutas: `createClient` + `getUser` + `unauthorizedResponse`).
- **Diseñadores:** solo match EXACTO normalizado (minúsculas, sin tildes) contra `display_name` o el primer token de `full_name` de perfiles con rol DESIGNER. Sin match → `designer_id: null` + warning `disenador_no_encontrado`. Nunca adivinar por parecido.
- **Fechas:** el modelo devuelve `YYYY-MM-DDTHH:mm` (hora local). El prompt incluye la fecha de HOY (Europe/Madrid) y las reglas de inferencia. El servidor valida formato y `Date` real; pasada >1h → se conserva + warning `fecha_pasada`; inválida → `null` + warning `fecha_no_reconocida`.
- **Fallback sin fricción:** sin `ANTHROPIC_API_KEY`, error HTTP, timeout o respuesta no válida → **HTTP 200** `{ fallback: true, reason }` (con `logger.serverError`/`warn`). El cliente crea UNA tarjeta con el texto íntegro en `details` + warning `agente_no_disponible`, y el status del compositor lo explica. Jamás un 500 al usuario por esto.
- **Compositor claro e integrado** (decisión del usuario 2026-07-03): contenedor `rounded-2xl border border-border bg-card shadow-sm` con `focus-within:` ring dorado suave — como la entrada de ChatGPT en iOS. NADA de glass charcoal. Icono `Sparkles` en `text-primary`, botón de enviar `bg-primary` cuadrado-redondeado. Solo visible en modo creación.
- **Sin memoria conversacional:** cada envío es independiente (YAGNI). El compositor no guarda historial.
- **Vitest solo para `parse-message.ts`** (normalización/matching/fechas con datos simulados). La llamada HTTP y la ruta no se testean (convención del repo).
- Commits en español, staging explícito. Misma rama/worktree que la Fase 3 (`worktree-rediseno-creacion-disenos-fase3-4`).

## File Map

- Create: `lib/services/designs/parse-message.ts`, `lib/services/designs/parse-message.test.ts`, `app/api/designs/parse/route.ts`, `components/features/designs/cards/agent-composer.tsx`, `docs/agente-parseo.md`
- Modify: `lib/api/schemas.ts`, `components/features/designs/dialogs/create-design-dialog.tsx`

---

### Task 1: Lógica pura del parseo (TDD)

**Files:**
- Create: `lib/services/designs/parse-message.ts`, `lib/services/designs/parse-message.test.ts`

**Interfaces:**
- Consumes: `DESIGN_TYPES`, `DESIGN_TYPE_LABELS`, `type DesignType` de `@/lib/types/design`.
- Produces (lo que consumen las Tasks 2-3):

```ts
export interface ParseDesigner { id: string; display_name: string | null; full_name: string | null; }

export interface RawModelDesign {           // lo que devuelve el tool_use (todo opcional salvo details)
  type?: string; player?: string; match_home?: string; match_away?: string;
  deadline_at?: string; designer_name?: string; details: string;
  needs_review?: string[];
}

export interface ParsedDesignCandidate {
  type: DesignType | null; player: string; match_home: string; match_away: string;
  deadline_at: string | null;               // ISO local validado, o null
  designer_id: string | null; details: string; warnings: string[];
}

export const PROPOSE_DESIGNS_TOOL: object;  // tool con input_schema (ver abajo)
export function buildSystemPrompt(opts: { today: string; designerNames: string[] }): string;
export function normalizeName(s: string): string;      // minúsculas + sin diacríticos (NFD)
export function matchDesigner(name: string, designers: ParseDesigner[]): string | null;
export function normalizeCandidate(raw: RawModelDesign, designers: ParseDesigner[], now: Date): ParsedDesignCandidate;
```

`PROPOSE_DESIGNS_TOOL` (literal):

```ts
export const PROPOSE_DESIGNS_TOOL = {
  name: 'propose_designs',
  description: 'Devuelve los diseños detectados en el mensaje',
  input_schema: {
    type: 'object',
    properties: {
      designs: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: { type: 'string', description: 'slug del tipo de pieza' },
            player: { type: 'string' },
            match_home: { type: 'string' },
            match_away: { type: 'string' },
            deadline_at: { type: 'string', description: 'YYYY-MM-DDTHH:mm hora local' },
            designer_name: { type: 'string', description: 'solo si el mensaje asigna explícitamente' },
            details: { type: 'string' },
            needs_review: { type: 'array', items: { type: 'string' } },
          },
          required: ['details'],
        },
      },
    },
    required: ['designs'],
  },
} as const;
```

`buildSystemPrompt` (contenido, interpola `{TODAY}` y la lista de nombres):

```
Eres el asistente de alta de diseños de PH Sport (agencia de representación futbolística). Extraes los diseños gráficos a crear a partir de un mensaje —a menudo pegado de WhatsApp— o de una instrucción directa.

Hoy es {TODAY} (zona horaria Europe/Madrid).

Tipos válidos (slug — cuándo usarlo): matchday — partido de un jugador; cumpleanos; convocatoria; debut; internacionalidad — convocatoria con selección; fichaje; cesion; firma — renovación/firma de contrato; playoff; welcome; md_conjunto — matchday de varios jugadores; md_animado — matchday animado; cv — CV/vídeo de captación; presentacion_captacion.

Diseñadores del equipo: {DESIGNERS}. Solo puedes proponer asignación a estos nombres, y SOLO si el mensaje lo pide explícitamente.

Reglas:
- Un diseño por pieza pedida. No inventes diseños ni valores que el mensaje no diga.
- deadline_at: "viernes" = el próximo viernes desde hoy; sin año, el año en curso (o el siguiente si esa fecha ya pasó); sin hora, usa 12:00 y añade "hora_asumida" a needs_review.
- matchday: rellena match_home y match_away si el mensaje los da; el equipo del jugador suele ser el local salvo que se indique lo contrario.
- md_conjunto: player admite varios nombres separados por coma.
- details: la información específica que no cabe en los otros campos (motivo, club, dorsal, selección...). Si un campo te genera duda, déjalo fuera y añade su nombre a needs_review.
```

`normalizeCandidate`: `type` fuera de `DESIGN_TYPES` (o ausente) → `null` + warning `tipo_no_reconocido` (solo si venía un valor); `designer_name` presente → `matchDesigner` (sin match → warning `disenador_no_encontrado`); `deadline_at` → regex `^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$` + `new Date(...)` válida (inválida → null + `fecha_no_reconocida`; anterior a `now - 1h` → se conserva + `fecha_pasada`); strings → trim con default `''`; `needs_review` se vuelca en `warnings`.

- [ ] **Step 1: Tests (RED)** — casos: `normalizeName('Álex')` → `'alex'`; `matchDesigner` con tilde/mayúsculas contra display_name y contra primer token de full_name; sin match → null; `normalizeCandidate` con tipo `'matchday'` válido; tipo `'poster'` → null + warning; designer inexistente → null + warning; fecha válida futura → ISO intacto; `'2020-01-01T10:00'` → conservada + `fecha_pasada`; `'el viernes'` → null + `fecha_no_reconocida`; `needs_review: ['hora_asumida']` → aparece en warnings; details siempre string.
- [ ] **Step 2:** `npm test` → FAIL. **Step 3:** implementar (GREEN). **Step 4:** suite + type-check + lint verdes.
- [ ] **Step 5: Commit** — `git add lib/services/designs/parse-message.ts lib/services/designs/parse-message.test.ts` → `feat(designs): normalización pura del parseo del agente`

---

### Task 2: Ruta `POST /api/designs/parse`

**Files:**
- Create: `app/api/designs/parse/route.ts`
- Modify: `lib/api/schemas.ts`

**Interfaces:**
- Consumes: Task 1 completa; patrón de rutas existente (`createClient`, `logger`, `validationErrorResponse`, `internalErrorResponse`, `unauthorizedResponse` de `@/lib/api/errors`).
- Produces: respuesta JSON `{ fallback: false, designs: ParsedDesignCandidate[] } | { fallback: true, reason: string }` (siempre 200 tras auth/validación OK).

- [ ] **Step 1: schema** — en `lib/api/schemas.ts`: `export const parseMessageSchema = z.object({ message: z.string().trim().min(1).max(4000) }).strict();`
- [ ] **Step 2: ruta.** Flujo: `reqId` → parse+validate body → auth (`getUser`) → si `!process.env.ANTHROPIC_API_KEY` → `logger.serverWarn`/`warn` + `200 { fallback: true, reason: 'sin_api_key' }` → fetch diseñadores (`profiles`, `.select('id, display_name, full_name').eq('role', 'DESIGNER')`) → `today` = fecha actual formateada `es-ES` con weekday (`new Intl.DateTimeFormat('es-ES', { dateStyle: 'full', timeZone: 'Europe/Madrid' })`) → `fetch` a Anthropic con `AbortController` (15s), body:

```ts
{
  model: 'claude-haiku-4-5-20251001',
  max_tokens: 1500,
  temperature: 0,
  system: buildSystemPrompt({ today, designerNames }),
  messages: [{ role: 'user', content: message }],
  tools: [PROPOSE_DESIGNS_TOOL],
  tool_choice: { type: 'tool', name: 'propose_designs' },
}
```

  → localizar el bloque `content` con `type === 'tool_use'` y `name === 'propose_designs'`; su `input.designs` (array, cap a 20) → `normalizeCandidate` por elemento → `200 { fallback: false, designs }`. CUALQUIER error (HTTP no-ok, abort, sin bloque tool_use, designs no-array) → `logger.serverError` + `200 { fallback: true, reason: 'error_agente' }`. Loggear `reqId`, nº de diseños y duración.
- [ ] **Step 3: Verificar** — `npm run type-check && npm run lint && npm run build`.
- [ ] **Step 4: Commit** — `git add app/api/designs/parse/route.ts lib/api/schemas.ts` → `feat(designs): endpoint de parseo del agente (Claude Haiku)`

---

### Task 3: `AgentComposer` + integración en el diálogo

**Files:**
- Create: `components/features/designs/cards/agent-composer.tsx`
- Modify: `components/features/designs/dialogs/create-design-dialog.tsx`

**Interfaces:**
- Consumes: `DesignCard`, `createEmptyCard` (F3); `ParsedDesignCandidate` (tipo, import type-only desde `@/lib/services/designs/parse-message`).
- Produces:

```ts
export interface AgentComposerProps {
  onCards: (cards: DesignCard[]) => void;   // el diálogo las añade a la lista
  disabled?: boolean;                        // p. ej. mientras se crea el lote
}
export function AgentComposer(props: AgentComposerProps): JSX.Element;
```

- [ ] **Step 1: componente.** Textarea auto-creciente (1 → ~5 líneas), placeholder `"Pídeselo al agente o pega el mensaje de WhatsApp…"`. Enter = salto de línea; Ctrl/Cmd+Enter = enviar; botón enviar (icono ArrowRight/SendHorizonal, `bg-primary`, `size-9 rounded-xl`) disabled si vacío o cargando. Debajo, UNA línea de estado (text-xs muted): reposo → `"El agente propone tarjetas; tú revisas y confirmas."`; cargando → spinner `Loader2` + `"El agente está leyendo el mensaje…"`; éxito → `"{n} tarjeta(s) propuesta(s) — revísalas antes de crear."`; fallback → `"El agente no está disponible — tu texto quedó en una tarjeta."` (en `text-status-warning`). Estética según Global Constraints (claro, `focus-within:ring-2 ring-primary/20`).
- [ ] **Step 2: envío.** `POST /api/designs/parse` con `{ message }`. Con `{ fallback: false, designs }`: mapear cada candidato → `{ ...createEmptyCard(), type, player, match_home, match_away, deadline_at: iso ? new Date(iso) : undefined, designer_id, details, source: 'ia', warnings }` → `onCards(cards)` y limpiar el textarea. Con `{ fallback: true }` o error de red: `onCards([{ ...createEmptyCard(), details: message, source: 'ia', warnings: ['agente_no_disponible'] }])` SIN limpiar… no: limpiar también (el texto ya vive en la tarjeta). Los warnings se muestran en la tarjeta como chips (la F3 ya los pinta).
- [ ] **Step 3: diálogo.** En modo creación, montar `<AgentComposer onCards={appendCards} />` entre la lista y el pie. `appendCards`: si la única tarjeta existente está vacía (`isCardEmpty`), reemplázala; añade las nuevas COLAPSADAS (si llega solo 1, ábrela), scroll al final. En modo edición no se monta.
- [ ] **Step 4: Verificar** — `npm run type-check && npm run lint && npm run build`.
- [ ] **Step 5: Commit** — `git add components/features/designs/cards/agent-composer.tsx components/features/designs/dialogs/create-design-dialog.tsx` → `feat(designs): compositor del agente integrado en el taller`

---

### Task 4: Verificación final de la Fase 4 + documentación

**Files:**
- Create: `docs/agente-parseo.md`

- [ ] **Step 1:** `npm test && npm run type-check && npm run lint && npm run build` — todo verde.
- [ ] **Step 2: `docs/agente-parseo.md`** — documento corto: qué hace `/api/designs/parse`, variable `ANTHROPIC_API_KEY` (dónde ponerla: `.env.local` en desarrollo y Environment Variables del proyecto en Vercel), modelo usado, comportamiento de fallback sin key, y cómo probarlo.
- [ ] **Step 3 (navegador, `npm run build && npm run start` — PRODUCCIÓN):** comprueba si `.env.local` tiene `ANTHROPIC_API_KEY`.
  - **Sin key (esperado):** en "Crear Diseños", pegar un mensaje multilínea y enviar → status de fallback + UNA tarjeta con el texto íntegro en Detalles y su chip de aviso. Cancelar sin crear. Anotar en el reporte que la validación de calidad real del parseo queda PENDIENTE de la key (gate manual de la spec).
  - **Con key:** pegar un mensaje realista de WhatsApp → tarjetas propuestas con campos rellenos y avisos; verificar match de diseñador explícito y fechas; cancelar sin crear (no ensuciar producción).
- [ ] **Step 4:** commit de docs → `git add docs/agente-parseo.md` → `docs(designs): documentación del agente de parseo` — y actualizar el ledger. Después: revisión final de rama (F3+F4 juntas), merge y push.
