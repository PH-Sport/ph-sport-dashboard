import { describe, it, expect } from 'vitest';
import { applyToolCalls, toSnapshots, serializeDraft, deserializeDraft } from './design-draft';
import { createEmptyCard, type DesignCard } from './design-cards';
import type { ToolCall } from '@/lib/services/designs/chat-agent';
import type { ParsedDesignCandidate } from '@/lib/services/designs/parse-message';

function card(overrides: Partial<DesignCard> = {}): DesignCard {
  return { ...createEmptyCard(), ...overrides };
}

const candidato: ParsedDesignCandidate = {
  type: 'matchday',
  player: 'Joan García',
  match_home: 'Espanyol',
  match_away: 'Getafe',
  deadline_at: '2026-08-14T12:00',
  designer_id: null,
  details: '',
  warnings: [],
};

describe('applyToolCalls · add_designs', () => {
  it('reemplaza la única tarjeta si está vacía', () => {
    const { cards, receipts } = applyToolCalls(
      [card()],
      [{ tool: 'add_designs', designs: [candidato] }]
    );
    expect(cards).toHaveLength(1);
    expect(cards[0].player).toBe('Joan García');
    expect(cards[0].source).toBe('ia');
    expect(receipts).toEqual([{ id: cards[0].id, action: 'added' }]);
  });

  it('añade al final si ya hay trabajo hecho', () => {
    const { cards } = applyToolCalls(
      [card({ player: 'Marín', type: 'cumpleanos' })],
      [{ tool: 'add_designs', designs: [candidato] }]
    );
    expect(cards).toHaveLength(2);
    expect(cards[1].player).toBe('Joan García');
  });

  it('convierte la fecha ISO del candidato en Date', () => {
    const { cards } = applyToolCalls([card()], [{ tool: 'add_designs', designs: [candidato] }]);
    expect(cards[0].deadline_at).toBeInstanceOf(Date);
  });

  it('no toca nada si la propuesta viene vacía', () => {
    const inicial = [card({ player: 'Marín' })];
    const { cards, receipts } = applyToolCalls(inicial, [{ tool: 'add_designs', designs: [] }]);
    expect(cards).toEqual(inicial);
    expect(receipts).toEqual([]);
  });
});

describe('applyToolCalls · update_designs', () => {
  it('parchea solo los campos presentes', () => {
    const { cards, receipts } = applyToolCalls(
      [card({ id: 'c-1', player: 'Marín', type: 'cumpleanos' })],
      [{ tool: 'update_designs', updates: [{ id: 'c-1', player: 'Joan', warnings: [] }] }]
    );
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
    const { cards } = applyToolCalls(
      [card({ id: 'c-1', warnings: ['hora_asumida'] })],
      [
        {
          tool: 'update_designs',
          updates: [{ id: 'c-1', warnings: ['hora_asumida', 'fecha_pasada'] }],
        },
      ]
    );
    expect(cards[0].warnings).toEqual(['hora_asumida', 'fecha_pasada']);
  });

  it('vacía la fecha cuando la edición trae deadline_at null', () => {
    const { cards } = applyToolCalls(
      [card({ id: 'c-1', deadline_at: new Date('2026-08-14T12:00') })],
      [{ tool: 'update_designs', updates: [{ id: 'c-1', deadline_at: null, warnings: [] }] }]
    );
    expect(cards[0].deadline_at).toBeUndefined();
  });

  it('deja el diseñador en automático cuando la edición trae designer_id null', () => {
    const { cards } = applyToolCalls(
      [card({ id: 'c-1', designer_id: 'd-1' })],
      [{ tool: 'update_designs', updates: [{ id: 'c-1', designer_id: null, warnings: [] }] }]
    );
    expect(cards[0].designer_id).toBeNull();
  });
});

describe('applyToolCalls · remove_designs', () => {
  it('elimina por id y deja recibo', () => {
    const { cards, receipts } = applyToolCalls(
      [card({ id: 'c-1' }), card({ id: 'c-2' })],
      [{ tool: 'remove_designs', ids: ['c-1'] }]
    );
    expect(cards).toHaveLength(1);
    expect(cards[0].id).toBe('c-2');
    expect(receipts).toEqual([{ id: 'c-1', action: 'removed' }]);
  });

  it('deja siempre al menos una tarjeta en el taller', () => {
    const { cards } = applyToolCalls([card({ id: 'c-1' })], [{ tool: 'remove_designs', ids: ['c-1'] }]);
    expect(cards).toHaveLength(1);
    expect(cards[0].id).not.toBe('c-1');
  });

  it('ignora ids que no existen', () => {
    const inicial = [card({ id: 'c-1' })];
    const { cards, receipts } = applyToolCalls(inicial, [
      { tool: 'remove_designs', ids: ['fantasma'] },
    ]);
    expect(cards).toEqual(inicial);
    expect(receipts).toEqual([]);
  });
});

describe('applyToolCalls · combinaciones', () => {
  it('aplica varias herramientas en orden dentro de un turno', () => {
    const calls: ToolCall[] = [
      { tool: 'add_designs', designs: [candidato] },
      { tool: 'update_designs', updates: [{ id: 'c-1', player: 'Marín Jr', warnings: [] }] },
      { tool: 'ask', question: '¿Fecha?', options: [] },
    ];
    const { cards, receipts } = applyToolCalls(
      [card({ id: 'c-1', player: 'Marín', type: 'cumpleanos' })],
      calls
    );
    expect(cards).toHaveLength(2);
    expect(cards[0].player).toBe('Marín Jr');
    expect(receipts).toHaveLength(2); // ask no deja recibo
  });
});

describe('toSnapshots', () => {
  it('traduce el designer_id a nombre y la fecha a ISO local', () => {
    const [snap] = toSnapshots(
      [card({ id: 'c-1', designer_id: 'd-1', deadline_at: new Date(2026, 7, 14, 12, 0) })],
      (id) => (id === 'd-1' ? 'Lorenzo' : null)
    );
    expect(snap.designer_name).toBe('Lorenzo');
    expect(snap.deadline_at).toBe('2026-08-14T12:00');
  });

  it('deja el diseñador a null cuando la tarjeta es automática', () => {
    const [snap] = toSnapshots([card({ id: 'c-1' })], () => 'Lorenzo');
    expect(snap.designer_name).toBeNull();
    expect(snap.deadline_at).toBeNull();
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

  it('conserva una tarjeta sin fecha como undefined, no como null', () => {
    const vuelta = deserializeDraft(serializeDraft({ cards: [card({ id: 'c-1' })], messages: [] }));
    expect(vuelta?.cards[0].deadline_at).toBeUndefined();
  });

  it('devuelve null ante un payload corrupto', () => {
    expect(deserializeDraft('{no es json')).toBeNull();
    expect(deserializeDraft(null)).toBeNull();
  });

  it('descarta un borrador de otra versión', () => {
    expect(deserializeDraft(JSON.stringify({ version: 99, cards: [], messages: [] }))).toBeNull();
  });
});
