import { describe, it, expect } from 'vitest';
import { groupNotificationsByDay } from './group-notifications';

const mk = (id: string, iso: string) => ({
  id,
  type: 'system',
  title: id,
  message: '',
  read: false,
  created_at: iso,
});

describe('groupNotificationsByDay', () => {
  const now = new Date('2026-07-11T12:00:00Z');

  it('separa Hoy / Ayer / Antes y conserva el orden de entrada', () => {
    const groups = groupNotificationsByDay(
      [
        mk('a', '2026-07-11T09:00:00Z'),
        mk('b', '2026-07-10T20:00:00Z'),
        mk('c', '2026-07-01T10:00:00Z'),
      ],
      now
    );
    expect(groups.map((g) => g.label)).toEqual(['Hoy', 'Ayer', 'Antes']);
    expect(groups[0].items.map((i) => i.id)).toEqual(['a']);
    expect(groups[2].items.map((i) => i.id)).toEqual(['c']);
  });

  it('omite grupos vacíos', () => {
    const groups = groupNotificationsByDay([mk('a', '2026-07-11T09:00:00Z')], now);
    expect(groups.map((g) => g.label)).toEqual(['Hoy']);
  });

  it('agrupa varios del mismo día conservando el orden', () => {
    const groups = groupNotificationsByDay(
      [mk('a', '2026-07-11T09:00:00Z'), mk('b', '2026-07-11T08:00:00Z')],
      now
    );
    expect(groups).toHaveLength(1);
    expect(groups[0].items.map((i) => i.id)).toEqual(['a', 'b']);
  });
});
