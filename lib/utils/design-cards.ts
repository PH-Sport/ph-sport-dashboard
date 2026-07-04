import {
  type DesignType,
  type Design,
  DESIGN_TYPE_LABELS,
  getDesignWeightValue,
} from '@/lib/types/design';
import { generateId } from '@/lib/utils/design-form';

/**
 * Modelo de tarjeta del taller de creación de diseños (Fase 3).
 * Sustituye a `BulkDesignRow` (fila de tabla) como unidad de edición: una
 * tarjeta = un diseño a crear, con su propio ciclo vida (vacía → editada →
 * válida) independiente del resto.
 */
export interface DesignCard {
  id: string;
  type: DesignType | null; // null = sin elegir (no válido para crear)
  player: string;
  match_home: string;
  match_away: string;
  deadline_at: Date | undefined;
  designer_id: string | null; // null = automático
  folder_url: string;
  details: string;
  title: string; // solo relevante cuando titleEdited
  titleEdited: boolean;
  source: 'manual' | 'ia'; // 'ia' lo usará la Fase 4
  warnings: string[]; // avisos del agente (F4); [] en manual
}

/** Tarjeta en blanco lista para el taller: manual, sin tipo, sin avisos. */
export function createEmptyCard(): DesignCard {
  return {
    id: generateId(),
    type: null,
    player: '',
    match_home: '',
    match_away: '',
    deadline_at: undefined,
    designer_id: null,
    folder_url: '',
    details: '',
    title: '',
    titleEdited: false,
    source: 'manual',
    warnings: [],
  };
}

/**
 * Título automático de una tarjeta: "Equipo vs Equipo — Jugador" en matchday
 * (o solo "Equipo vs Equipo" sin jugador), o "Etiqueta — Jugador" en el resto
 * de tipos. Cadena vacía si aún no hay tipo elegido.
 * Si matchday carece de equipos, cae al patrón de fallback: "Matchday" o "Matchday — Jugador".
 */
export function autoTitleFor(card: DesignCard): string {
  if (!card.type) return '';

  const player = card.player.trim();

  if (card.type === 'matchday') {
    const home = card.match_home.trim();
    const away = card.match_away.trim();
    const match = home && away ? `${home} vs ${away}` : '';
    if (!match) {
      // Fallback when teams incomplete: same pattern as other types
      const label = DESIGN_TYPE_LABELS[card.type];
      return player ? `${label} — ${player}` : label;
    }
    return player ? `${match} — ${player}` : match;
  }

  const label = DESIGN_TYPE_LABELS[card.type];
  return player ? `${label} — ${player}` : label;
}

/** Título efectivo: el editado a mano (si lo hay) o el automático. */
export function effectiveTitle(card: DesignCard): string {
  if (card.titleEdited && card.title.trim()) return card.title.trim();
  return autoTitleFor(card);
}

/** Sin tipo, textos vacíos (trim), sin fecha y sin edición manual de título. */
export function isCardEmpty(card: DesignCard): boolean {
  return (
    card.type === null &&
    !card.player.trim() &&
    !card.match_home.trim() &&
    !card.match_away.trim() &&
    !card.folder_url.trim() &&
    !card.details.trim() &&
    !card.deadline_at &&
    !card.titleEdited
  );
}

/** Tipo elegido + jugador + fecha; matchday exige además ambos equipos. */
export function isCardValid(card: DesignCard): boolean {
  if (!card.type) return false;
  if (!card.player.trim()) return false;
  if (!card.deadline_at) return false;
  if (card.type === 'matchday') {
    return !!(card.match_home.trim() && card.match_away.trim());
  }
  return true;
}

/** Suma de pesos de esfuerzo de las tarjetas con tipo elegido. */
export function cardsWeight(cards: DesignCard[]): number {
  return cards.reduce(
    (sum, card) => (card.type ? sum + getDesignWeightValue(card.type) : sum),
    0
  );
}

/**
 * Mapea una tarjeta al payload que espera POST /api/designs/bulk.
 * Precondición: la tarjeta debe cumplir isCardValid() (los ! assertions dependen de ello).
 */
export function cardToBulkPayload(card: DesignCard) {
  return {
    type: card.type!,
    title: effectiveTitle(card) || undefined,
    player: card.player.trim(),
    match_home: card.type === 'matchday' ? card.match_home.trim() : undefined,
    match_away: card.type === 'matchday' ? card.match_away.trim() : undefined,
    deadline_at: card.deadline_at!.toISOString(),
    designer_id: card.designer_id || undefined,
    folder_url: card.folder_url.trim() || undefined,
    details: card.details.trim() || undefined,
  };
}

/** Convierte un `Design` existente en tarjeta editable (modo edición, Task 4). */
export function designToCard(design: Design): DesignCard {
  const type = design.type ?? null;
  const card: DesignCard = {
    id: design.id,
    type,
    player: design.player ?? '',
    match_home: design.match_home ?? '',
    match_away: design.match_away ?? '',
    deadline_at: design.deadline_at ? new Date(design.deadline_at) : undefined,
    designer_id: design.designer_id ?? null,
    folder_url: design.folder_url ?? '',
    details: design.details ?? '',
    title: design.title ?? '',
    titleEdited: false,
    source: 'manual',
    warnings: [],
  };

  card.titleEdited = design.title !== autoTitleFor(card);
  return card;
}
