import { differenceInCalendarDays } from 'date-fns';

export type DayGroupLabel = 'Hoy' | 'Ayer' | 'Antes';

/**
 * Agrupa notificaciones en "Hoy / Ayer / Antes" según su `created_at`, conservando
 * el orden de entrada dentro de cada grupo y devolviendo solo los grupos no vacíos
 * en orden Hoy→Ayer→Antes. `now` es inyectable para tests.
 */
export function groupNotificationsByDay<T extends { created_at: string }>(
  items: T[],
  now: Date = new Date()
): { label: DayGroupLabel; items: T[] }[] {
  const buckets: Record<DayGroupLabel, T[]> = { Hoy: [], Ayer: [], Antes: [] };

  for (const item of items) {
    const diff = differenceInCalendarDays(now, new Date(item.created_at));
    const label: DayGroupLabel = diff <= 0 ? 'Hoy' : diff === 1 ? 'Ayer' : 'Antes';
    buckets[label].push(item);
  }

  const order: DayGroupLabel[] = ['Hoy', 'Ayer', 'Antes'];
  return order
    .filter((label) => buckets[label].length > 0)
    .map((label) => ({ label, items: buckets[label] }));
}
