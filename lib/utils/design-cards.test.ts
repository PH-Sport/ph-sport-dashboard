import { describe, it, expect } from 'vitest';
import {
  createEmptyCard,
  autoTitleFor,
  effectiveTitle,
  isCardEmpty,
  isCardValid,
  cardsWeight,
  cardToBulkPayload,
  designToCard,
  type DesignCard,
} from './design-cards';
import type { Design } from '@/lib/types/design';

function makeCard(overrides: Partial<DesignCard> = {}): DesignCard {
  return { ...createEmptyCard(), ...overrides };
}

describe('createEmptyCard', () => {
  it('crea una tarjeta vacía manual, sin tipo y sin avisos', () => {
    const card = createEmptyCard();
    expect(card.type).toBeNull();
    expect(card.source).toBe('manual');
    expect(card.warnings).toEqual([]);
    expect(card.titleEdited).toBe(false);
    expect(card.designer_id).toBeNull();
  });
});

describe('autoTitleFor', () => {
  it('matchday con equipos y jugador', () => {
    const card = makeCard({
      type: 'matchday',
      match_home: 'Espanyol',
      match_away: 'Getafe',
      player: 'Joan García',
    });
    expect(autoTitleFor(card)).toBe('Espanyol vs Getafe — Joan García');
  });

  it('matchday con equipos sin jugador', () => {
    const card = makeCard({
      type: 'matchday',
      match_home: 'Espanyol',
      match_away: 'Getafe',
      player: '',
    });
    expect(autoTitleFor(card)).toBe('Espanyol vs Getafe');
  });

  it('fichaje con jugador usa el label real de DESIGN_TYPE_LABELS', () => {
    const card = makeCard({ type: 'fichaje', player: 'Marc Bernal' });
    expect(autoTitleFor(card)).toBe('Fichajes — Marc Bernal');
  });

  it('matchday con jugador pero sin visitante cae al fallback de label', () => {
    const card = makeCard({
      type: 'matchday',
      match_home: 'Espanyol',
      match_away: '',
      player: 'Joan García',
    });
    expect(autoTitleFor(card)).toBe('Matchday — Joan García');
  });

  it('matchday sin equipos ni jugador cae al fallback de label', () => {
    const card = makeCard({
      type: 'matchday',
      match_home: '',
      match_away: '',
      player: '',
    });
    expect(autoTitleFor(card)).toBe('Matchday');
  });

  it('tipo null devuelve cadena vacía', () => {
    const card = makeCard({ type: null, player: 'Marc Bernal' });
    expect(autoTitleFor(card)).toBe('');
  });
});

describe('effectiveTitle', () => {
  it('con titleEdited y título con espacios devuelve el título editado (trim)', () => {
    const card = makeCard({
      type: 'fichaje',
      player: 'Marc Bernal',
      titleEdited: true,
      title: '  Mi título custom  ',
    });
    expect(effectiveTitle(card)).toBe('Mi título custom');
  });

  it('con titleEdited pero título en blanco cae al auto', () => {
    const card = makeCard({
      type: 'fichaje',
      player: 'Marc Bernal',
      titleEdited: true,
      title: '   ',
    });
    expect(effectiveTitle(card)).toBe('Fichajes — Marc Bernal');
  });
});

describe('isCardValid', () => {
  it('sin tipo es inválida', () => {
    const card = makeCard({
      type: null,
      player: 'Marc Bernal',
      deadline_at: new Date(),
    });
    expect(isCardValid(card)).toBe(false);
  });

  it('con tipo pero sin player es inválida', () => {
    const card = makeCard({
      type: 'cv',
      player: '',
      deadline_at: new Date(),
    });
    expect(isCardValid(card)).toBe(false);
  });

  it('matchday sin visitante es inválida', () => {
    const card = makeCard({
      type: 'matchday',
      player: 'Joan García',
      match_home: 'Espanyol',
      match_away: '',
      deadline_at: new Date(),
    });
    expect(isCardValid(card)).toBe(false);
  });

  it('matchday completo es válida', () => {
    const card = makeCard({
      type: 'matchday',
      player: 'Joan García',
      match_home: 'Espanyol',
      match_away: 'Getafe',
      deadline_at: new Date(),
    });
    expect(isCardValid(card)).toBe(true);
  });

  it('cv con player y fecha es válida (sin equipos)', () => {
    const card = makeCard({
      type: 'cv',
      player: 'Marc Bernal',
      deadline_at: new Date(),
    });
    expect(isCardValid(card)).toBe(true);
  });
});

describe('isCardEmpty', () => {
  it('createEmptyCard() es vacía', () => {
    expect(isCardEmpty(createEmptyCard())).toBe(true);
  });

  it('con solo type elegido ya no es vacía', () => {
    const card = makeCard({ type: 'cv' });
    expect(isCardEmpty(card)).toBe(false);
  });
});

describe('cardsWeight', () => {
  it('suma los pesos de las tarjetas con tipo, ignorando las sin tipo', () => {
    const matchday = makeCard({ type: 'matchday' }); // peso 1
    const cv = makeCard({ type: 'cv' }); // peso 4
    const sinTipo = makeCard({ type: null });
    expect(cardsWeight([matchday, cv, sinTipo])).toBe(5);
  });
});

describe('cardToBulkPayload', () => {
  it('mapea trims, ISO date, designer_id/details/title vacíos → undefined', () => {
    const card = makeCard({
      type: 'cv',
      player: '  Marc Bernal  ',
      designer_id: null,
      folder_url: '  ',
      details: '  ',
      deadline_at: new Date('2026-07-10T12:00:00.000Z'),
      titleEdited: false,
    });
    const payload = cardToBulkPayload(card) as Record<string, unknown>;
    expect(payload).toEqual({
      type: 'cv',
      title: 'CV — Marc Bernal',
      player: 'Marc Bernal',
      match_home: undefined,
      match_away: undefined,
      deadline_at: '2026-07-10T12:00:00.000Z',
      designer_id: undefined,
      folder_url: undefined,
      details: undefined,
    });
  });

  it('matchday incluye equipos, y designer_id/details con valor se conservan', () => {
    const card = makeCard({
      type: 'matchday',
      player: 'Joan García',
      match_home: ' Espanyol ',
      match_away: ' Getafe ',
      designer_id: 'designer-1',
      folder_url: 'https://drive.example.com/x',
      details: ' notas internas ',
      deadline_at: new Date('2026-07-10T12:00:00.000Z'),
      titleEdited: true,
      title: '  Título manual  ',
    });
    const payload = cardToBulkPayload(card) as Record<string, unknown>;
    expect(payload).toEqual({
      type: 'matchday',
      title: 'Título manual',
      player: 'Joan García',
      match_home: 'Espanyol',
      match_away: 'Getafe',
      deadline_at: '2026-07-10T12:00:00.000Z',
      designer_id: 'designer-1',
      folder_url: 'https://drive.example.com/x',
      details: 'notas internas',
    });
  });
});

describe('designToCard', () => {
  it('con título igual al auto, titleEdited es false', () => {
    const design: Design = {
      id: 'd1',
      title: 'Fichajes — Marc Bernal',
      type: 'fichaje',
      player: 'Marc Bernal',
      deadline_at: '2026-07-10T12:00:00.000Z',
      status: 'BACKLOG',
    };
    const card = designToCard(design);
    expect(card.titleEdited).toBe(false);
  });

  it('con título personalizado, titleEdited es true', () => {
    const design: Design = {
      id: 'd2',
      title: 'Un título muy custom',
      type: 'fichaje',
      player: 'Marc Bernal',
      deadline_at: '2026-07-10T12:00:00.000Z',
      status: 'BACKLOG',
    };
    const card = designToCard(design);
    expect(card.titleEdited).toBe(true);
    expect(card.title).toBe('Un título muy custom');
  });

  it('details ausente se convierte en cadena vacía', () => {
    const design: Design = {
      id: 'd3',
      title: 'Fichajes — Marc Bernal',
      type: 'fichaje',
      player: 'Marc Bernal',
      deadline_at: '2026-07-10T12:00:00.000Z',
      status: 'BACKLOG',
      details: undefined,
    };
    const card = designToCard(design);
    expect(card.details).toBe('');
  });
});
