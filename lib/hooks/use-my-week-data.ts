import { useMemo } from 'react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Design } from '@/lib/types/design';

export interface DeliveredWeekGroup {
  key: string;
  label: string;
  items: Design[];
}

export interface MyWeekData {
  inProgress: Design[];
  deliveredGroups: DeliveredWeekGroup[];
  deliveredCount: number;
}

/**
 * Agrupa los diseños del usuario en pendientes vs entregados,
 * y los entregados los agrupa por semana (con label legible).
 */
export function useMyWeekData(items: Design[]): MyWeekData {
  return useMemo(() => {
    const inProgress = items
      .filter((d) => d.status !== 'DELIVERED')
      .sort((a, b) => new Date(a.deadline_at).getTime() - new Date(b.deadline_at).getTime());

    const delivered = items
      .filter((d) => d.status === 'DELIVERED')
      .sort((a, b) => new Date(b.deadline_at).getTime() - new Date(a.deadline_at).getTime());

    const byWeek = delivered.reduce<Map<number, Design[]>>((acc, design) => {
      const weekStart = startOfWeek(new Date(design.deadline_at), { weekStartsOn: 1 });
      const weekKey = weekStart.getTime();
      if (!acc.has(weekKey)) acc.set(weekKey, []);
      acc.get(weekKey)!.push(design);
      return acc;
    }, new Map());

    const deliveredGroups: DeliveredWeekGroup[] = Array.from(byWeek.entries())
      .sort(([a], [b]) => b - a)
      .map(([weekStartMs, weekItems]) => {
        const weekStart = new Date(weekStartMs);
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
        return {
          key: String(weekStartMs),
          label: `${format(weekStart, "d 'de' MMM", { locale: es })} - ${format(weekEnd, "d 'de' MMM", { locale: es })}`,
          items: [...weekItems].sort(
            (a, b) => new Date(b.deadline_at).getTime() - new Date(a.deadline_at).getTime()
          ),
        };
      });

    return {
      inProgress,
      deliveredGroups,
      deliveredCount: delivered.length,
    };
  }, [items]);
}
