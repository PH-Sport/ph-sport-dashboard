import { describe, it, expect } from 'vitest';
import { summarizeUpcoming, upcomingLabel } from './upcoming-work';
import type { Design } from '@/lib/types/design';

function design(overrides: Partial<Design> = {}): Design {
  return {
    id: 'd-1',
    title: 'COPA GRECIA',
    player: 'Dani Muñoz',
    deadline_at: '2026-08-17T18:00:00Z',
    status: 'BACKLOG',
    ...overrides,
  } as Design;
}

// Viernes 14 de agosto de 2026. Su semana va del lunes 10 al domingo 16.
const VIERNES = new Date(2026, 7, 14, 10, 0);

describe('summarizeUpcoming', () => {
  it('no cuenta nada cuando todo cae dentro de la semana visible', () => {
    const items = [
      design({ id: 'a', deadline_at: '2026-08-14T16:00:00Z' }),
      design({ id: 'b', deadline_at: '2026-08-16T22:00:00Z' }),
    ];
    expect(summarizeUpcoming(items, VIERNES)).toEqual({ count: 0, firstDeadline: null });
  });

  it('cuenta lo que entrega después del domingo y devuelve la entrega más próxima', () => {
    const items = [
      design({ id: 'dentro', deadline_at: '2026-08-14T16:00:00Z' }),
      design({ id: 'lejos', deadline_at: '2026-08-25T09:00:00Z' }),
      design({ id: 'cerca', deadline_at: '2026-08-17T16:00:00Z' }),
    ];
    const { count, firstDeadline } = summarizeUpcoming(items, VIERNES);
    expect(count).toBe(2);
    expect(firstDeadline?.toISOString()).toBe('2026-08-17T16:00:00.000Z');
  });

  it('ignora las entregadas: solo avisa de trabajo que queda por hacer', () => {
    const items = [
      design({ id: 'hecha', deadline_at: '2026-08-17T16:00:00Z', status: 'DELIVERED' }),
      design({ id: 'pendiente', deadline_at: '2026-08-18T16:00:00Z' }),
    ];
    const { count, firstDeadline } = summarizeUpcoming(items, VIERNES);
    expect(count).toBe(1);
    expect(firstDeadline?.toISOString()).toBe('2026-08-18T16:00:00.000Z');
  });

  it('descarta lo que cae más allá del techo de 8 semanas (fecha mal tecleada)', () => {
    const items = [
      design({ id: 'año-erróneo', deadline_at: '2027-03-03T16:00:00Z' }),
      design({ id: 'real', deadline_at: '2026-08-24T16:00:00Z' }),
    ];
    const { count, firstDeadline } = summarizeUpcoming(items, VIERNES);
    expect(count).toBe(1);
    expect(firstDeadline?.toISOString()).toBe('2026-08-24T16:00:00.000Z');
  });

  it('el domingo a última hora aún pertenece a la semana visible', () => {
    // Frontera: 16 ago 23:59 local es el último instante de la semana en curso.
    const items = [design({ id: 'frontera', deadline_at: new Date(2026, 7, 16, 23, 59).toISOString() })];
    expect(summarizeUpcoming(items, VIERNES).count).toBe(0);
  });
});

describe('upcomingLabel', () => {
  it('no dice nada cuando no hay trabajo posterior', () => {
    expect(upcomingLabel({ count: 0, firstDeadline: null })).toBeNull();
  });

  it('usa singular y sin «a partir» cuando solo hay uno', () => {
    expect(upcomingLabel({ count: 1, firstDeadline: new Date(2026, 7, 17, 18, 0) })).toBe(
      '1 más el lun 17 ago'
    );
  });

  it('usa plural con «a partir del» cuando hay varios', () => {
    expect(upcomingLabel({ count: 4, firstDeadline: new Date(2026, 7, 17, 18, 0) })).toBe(
      '4 más a partir del lun 17 ago'
    );
  });
});
