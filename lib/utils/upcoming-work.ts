import { endOfWeek, addWeeks, format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Design } from '@/lib/types/design';

/**
 * Trabajo que espera más allá de la semana visible.
 *
 * Inicio y Diseños se ciñen a la semana en curso, así que un diseño asignado
 * para el lunes siguiente no aparece en ninguna de las dos: queda invisible
 * hasta que esa semana llega. Esto resume lo que hay al otro lado del domingo
 * para poder decirlo de pasada en el rótulo de la semana.
 */

export interface UpcomingWork {
  count: number;
  /** Entrega más próxima de las que quedan fuera. `null` si no hay ninguna. */
  firstDeadline: Date | null;
}

/** Techo del horizonte. Nadie programa más allá; recortar aquí evita que una
 *  fecha mal tecleada (un 2027 por un 2026) asome en el rótulo como si fuera
 *  trabajo real. Lo comparte el hook que pide los datos, para no pedir un rango
 *  distinto del que luego se cuenta. */
export const HORIZON_WEEKS = 8;

/**
 * @param items    diseños ya acotados a quien mira (los suyos si es diseñador,
 *                 los del equipo si es admin).
 * @param now      instante de referencia; su semana es la "visible".
 */
export function summarizeUpcoming(items: Design[], now: Date = new Date()): UpcomingWork {
  const visibleWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const horizon = addWeeks(visibleWeekEnd, HORIZON_WEEKS);

  const pending = items
    .filter((d) => d.status !== 'DELIVERED')
    .map((d) => new Date(d.deadline_at))
    .filter((deadline) => deadline > visibleWeekEnd && deadline <= horizon)
    .sort((a, b) => a.getTime() - b.getTime());

  return {
    count: pending.length,
    firstDeadline: pending[0] ?? null,
  };
}

/**
 * Coletilla para el rótulo de la semana. `null` cuando no hay nada que decir:
 * la línea se queda como estaba y la pantalla no cambia.
 *
 * Lleva fecha en vez de "la semana que viene" porque lo siguiente puede caer
 * a un mes vista, y "la semana que viene" mentiría.
 */
export function upcomingLabel({ count, firstDeadline }: UpcomingWork): string | null {
  if (count === 0 || !firstDeadline) return null;

  const when = format(firstDeadline, 'EEE d MMM', { locale: es });
  return count === 1 ? `1 más el ${when}` : `${count} más a partir del ${when}`;
}
