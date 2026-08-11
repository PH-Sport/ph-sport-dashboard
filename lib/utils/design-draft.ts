import { createEmptyCard, isCardEmpty, type DesignCard } from './design-cards';
import type { CardSnapshot, ToolCall } from '@/lib/services/designs/chat-agent';
import type { ParsedDesignCandidate } from '@/lib/services/designs/parse-message';

/**
 * Puente entre lo que propone el agente y el taller de tarjetas, más la
 * persistencia del borrador. Todo síncrono y puro: los hooks se limitan a
 * llamar aquí, de modo que las reglas del borrador se pueden probar sin
 * montar un componente.
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

/** "YYYY-MM-DDTHH:mm" (hora local) → Date. undefined si no cuadra. */
function isoLocalToDate(value: string | null | undefined): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

/** Date → "YYYY-MM-DDTHH:mm" en hora LOCAL: el agente razona en local, no en UTC. */
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
 * Aplica en orden las herramientas de un turno. Invariantes:
 * - `add_designs` reemplaza la tarjeta inicial si es la única y está vacía.
 * - `update_designs`/`remove_designs` ignoran en silencio los ids que ya no
 *   existen (el usuario pudo borrar la tarjeta mientras el agente pensaba).
 * - El taller nunca se queda sin tarjetas: si se borra la última, entra una vacía.
 * - `ask` no toca el taller, y por eso no deja recibo.
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
          patch.deadline_at =
            update.deadline_at === null ? undefined : isoLocalToDate(update.deadline_at);
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

/** El borrador es la conversación Y su resultado: se guardan juntos. */
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
