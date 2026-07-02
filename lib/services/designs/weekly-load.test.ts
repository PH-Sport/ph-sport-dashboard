import { describe, it, expect } from 'vitest';
import {
  weekKeyFor,
  buildWeeklyWeightMaps,
  loadMapForWeek,
  sumWeight,
} from './weekly-load';

describe('weekKeyFor', () => {
  it('devuelve el lunes de la semana para un día entre semana', () => {
    // Miércoles 2026-07-01 → lunes 2026-06-29
    expect(weekKeyFor('2026-07-01T12:00:00')).toBe('2026-06-29');
  });

  it('un lunes devuelve ese mismo lunes', () => {
    expect(weekKeyFor('2026-06-29T00:00:00')).toBe('2026-06-29');
  });

  it('un domingo pertenece a la semana que empezó el lunes anterior', () => {
    // Domingo 2026-07-05 → lunes 2026-06-29
    expect(weekKeyFor('2026-07-05T23:00:00')).toBe('2026-06-29');
  });

  it('acepta un Date además de string', () => {
    expect(weekKeyFor(new Date(2026, 6, 1, 12, 0, 0))).toBe('2026-06-29');
  });
});

describe('buildWeeklyWeightMaps', () => {
  const designers = ['A', 'B'];

  it('suma pesos por diseñador dentro de cada semana', () => {
    const maps = buildWeeklyWeightMaps(
      [
        { designer_id: 'A', deadline_at: '2026-06-30T10:00:00', type: 'matchday' }, // sem 06-29, peso 1
        { designer_id: 'A', deadline_at: '2026-07-01T10:00:00', type: 'cv' },       // sem 06-29, peso 4
        { designer_id: 'B', deadline_at: '2026-07-07T10:00:00', type: 'fichaje' },  // sem 07-06, peso 2
      ],
      designers,
    );
    expect(maps.get('2026-06-29')!.get('A')).toBe(5);
    expect(maps.get('2026-06-29')!.get('B')).toBe(0);
    expect(maps.get('2026-07-06')!.get('B')).toBe(2);
    expect(maps.get('2026-07-06')!.get('A')).toBe(0);
  });

  it('ignora diseños sin diseñador o con diseñador desconocido', () => {
    const maps = buildWeeklyWeightMaps(
      [
        { designer_id: null, deadline_at: '2026-06-30T10:00:00', type: 'matchday' },
        { designer_id: 'Z', deadline_at: '2026-06-30T10:00:00', type: 'matchday' },
      ],
      designers,
    );
    // La semana existe (se creó al ver el primer diseño) pero A y B siguen a 0.
    expect(maps.get('2026-06-29')!.get('A')).toBe(0);
    expect(maps.get('2026-06-29')!.get('B')).toBe(0);
    expect(maps.get('2026-06-29')!.has('Z')).toBe(false);
  });

  it('un tipo ausente cuenta como matchday (peso 1)', () => {
    const maps = buildWeeklyWeightMaps(
      [{ designer_id: 'A', deadline_at: '2026-06-30T10:00:00' }],
      designers,
    );
    expect(maps.get('2026-06-29')!.get('A')).toBe(1);
  });
});

describe('loadMapForWeek', () => {
  it('devuelve el mapa existente de una semana ya presente', () => {
    const maps = buildWeeklyWeightMaps(
      [{ designer_id: 'A', deadline_at: '2026-06-30T10:00:00', type: 'cv' }],
      ['A', 'B'],
    );
    const m = loadMapForWeek(maps, '2026-06-29', ['A', 'B']);
    expect(m.get('A')).toBe(4);
  });

  it('crea y registra un mapa a cero para una semana ausente', () => {
    const maps = new Map<string, Map<string, number>>();
    const m = loadMapForWeek(maps, '2026-06-29', ['A', 'B']);
    expect(m.get('A')).toBe(0);
    expect(m.get('B')).toBe(0);
    expect(maps.has('2026-06-29')).toBe(true);
  });
});

describe('sumWeight', () => {
  it('suma los pesos de una lista de diseños', () => {
    expect(sumWeight([{ type: 'matchday' }, { type: 'cv' }, { type: 'fichaje' }])).toBe(7);
  });

  it('lista vacía → 0', () => {
    expect(sumWeight([])).toBe(0);
  });
});
