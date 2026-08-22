import { DESIGN_TYPES, type DesignType } from '@/lib/types/design';
import {
  matchDesigner,
  PROPOSE_DESIGNS_TOOL,
  type ParseDesigner,
  type ParsedDesignCandidate,
} from './parse-message';

/**
 * Lógica pura del agente conversacional de alta de diseños: las herramientas
 * que puede usar, el prompt de sistema (que le enseña el estado del taller) y
 * la normalización de las ediciones que propone. Sin HTTP y sin React: eso
 * vive en `app/api/designs/chat/route.ts` y en los hooks del diálogo.
 *
 * Extiende `parse-message.ts` (el agente one-shot original) en vez de
 * sustituirlo: `normalizeCandidate` y `matchDesigner` siguen siendo la única
 * puerta por la que un valor inventado por el modelo entra al dominio.
 */

/** Turno del hilo tal y como viaja entre cliente y servidor: texto plano. */
export interface ChatTurn {
  role: 'user' | 'assistant';
  text: string;
}

/** Foto de una tarjeta del taller, sin los campos que solo importan a la UI. */
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

/** Edición cruda propuesta por el modelo, antes de validar. */
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

/** Edición ya validada. Solo trae los campos que hay que cambiar. */
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

/** Lo que el modelo pide hacer en un turno, ya normalizado contra el dominio. */
export type ToolCall =
  | { tool: 'add_designs'; designs: ParsedDesignCandidate[] }
  | { tool: 'update_designs'; updates: NormalizedUpdate[] }
  | { tool: 'remove_designs'; ids: string[] }
  | { tool: 'ask'; question: string; options: AskOption[] };

const UPDATE_FIELDS = {
  id: { type: 'string', description: 'id de la tarjeta a modificar, tal y como aparece en el taller' },
  type: { type: 'string', description: 'slug del tipo de pieza' },
  player: { type: 'string' },
  match_home: { type: 'string' },
  match_away: { type: 'string' },
  deadline_at: { type: 'string', description: 'YYYY-MM-DDTHH:mm hora local, o cadena vacía para quitarla' },
  designer_name: {
    type: 'string',
    description: 'nombre del diseñador, o cadena vacía para dejarlo en automático',
  },
  details: { type: 'string' },
} as const;

/**
 * Las cuatro herramientas del agente. `add_designs` reutiliza el schema ya
 * probado del agente one-shot: la forma de un diseño no cambia porque ahora
 * haya conversación.
 */
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

/** Una tarjeta está vacía si no tiene tipo ni nada escrito: no aporta contexto. */
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
  // El número se fija ANTES de descartar las vacías: es el que el usuario ve
  // en el taller y con el que se refiere a las tarjetas al hablar con el
  // agente. Numerando después, una tarjeta a medias corre la cuenta y «la 8»
  // del usuario sería otra distinta para el modelo. Los huecos son correctos.
  const utiles = cards
    .map((card, i) => ({ card, numero: i + 1 }))
    .filter(({ card }) => !isSnapshotEmpty(card));
  if (utiles.length === 0) return 'El taller no tiene ninguna tarjeta todavía.';

  return utiles
    .map(({ card: c, numero }) =>
      [
        `#${numero} id=${c.id}`,
        `tipo=${c.type ?? 'sin elegir'}`,
        c.player ? `jugador=${c.player}` : null,
        c.match_home || c.match_away ? `partido=${c.match_home} vs ${c.match_away}` : null,
        `entrega=${c.deadline_at ?? 'sin fecha'}`,
        c.designer_name ? `disenador=${c.designer_name}` : 'disenador=automatico',
        c.details ? `detalles=${c.details}` : null,
        c.warnings.length ? `avisos=${c.warnings.join(',')}` : null,
      ]
        .filter(Boolean)
        .join(' · ')
    )
    .join('\n');
}

/** System prompt del turno: dominio, plantilla, estado del taller y modales. */
export function buildChatSystemPrompt(opts: {
  today: string;
  designerNames: string[];
  cards: CardSnapshot[];
}): string {
  return `Eres el asistente de alta de diseños de PHSPORT (agencia de representación futbolística). Conversas con quien da de alta los diseños gráficos de la semana y mantenéis juntos un taller de tarjetas: cada tarjeta es un diseño que TODAVÍA NO EXISTE en el sistema.

Hoy es ${opts.today} (zona horaria Europe/Madrid).

Tipos válidos (slug — cuándo usarlo): matchday — partido de un jugador; cumpleanos; convocatoria; debut; internacionalidad — convocatoria con selección; fichaje; cesion; firma — renovación/firma de contrato; playoff; welcome; md_conjunto — matchday de varios jugadores; md_animado — matchday animado; cv — CV/vídeo de captación; presentacion_captacion.

Diseñadores del equipo: ${opts.designerNames.join(', ')}. Solo puedes asignar a estos nombres, y SOLO si el usuario lo pide.

ESTADO ACTUAL DEL TALLER:
${serializeCards(opts.cards)}

Tus herramientas:
- add_designs — crear tarjetas nuevas.
- update_designs — modificar tarjetas existentes; identifícalas SIEMPRE por el id que ves arriba, nunca por su número de orden.
- remove_designs — eliminar tarjetas.
- ask — preguntar al usuario. AGRUPA: si a tres tarjetas les falta la fecha, es UNA pregunta con opciones ("¿Las tres para el viernes?"), no tres preguntas seguidas.

Reglas:
- Un diseño por pieza pedida. No inventes diseños ni valores que el usuario no diga.
- Si te falta un dato, CREA IGUALMENTE la tarjeta con lo que sepas, marca el campo en needs_review y pregunta después con ask. Nunca retrases la creación por una duda.
- deadline_at: "viernes" = el próximo viernes desde hoy; sin año, el año en curso (o el siguiente si esa fecha ya pasó); sin hora, usa 12:00 y añade "hora_asumida" a needs_review.
- matchday: rellena match_home y match_away si el mensaje los da; el equipo del jugador suele ser el local salvo que se indique lo contrario.
- md_conjunto: player admite varios nombres separados por coma.
- details: la información específica que no cabe en los otros campos (motivo, club, dorsal, selección...).
- TÚ NO CREAS NADA EN EL SISTEMA: solo preparas el borrador. Quien lo confirma es la persona, con el botón de crear. Nunca digas que has creado, guardado o asignado diseños de verdad.
- Responde en español, breve y sin florituras. Una o dos frases bastan: las tarjetas ya se ven solas.`;
}

const DEADLINE_FORMAT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const ONE_HOUR_MS = 60 * 60 * 1000;

/**
 * Valida una edición del modelo contra el dominio. Devuelve `null` si la
 * tarjeta no existe — el modelo se inventó un id, o el usuario la borró
 * mientras tanto. Los campos ausentes no se tocan; los inválidos se descartan
 * dejando aviso, nunca se escriben a medias.
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
 * WhatsApp con toda la información de la semana, y perderlo dejaría al agente
 * respondiendo a ciegas sobre tarjetas que ya no sabe de dónde salieron.
 */
export function trimHistory(turns: ChatTurn[]): ChatTurn[] {
  if (turns.length === 0) return [];

  const primero = turns[0];
  const porNumero = turns.slice(1).slice(-(MAX_TURNS - 1));

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
