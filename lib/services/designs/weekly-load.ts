import { startOfWeek } from 'date-fns';
import { getDesignWeightValue, type DesignType } from '@/lib/types/design';

/** Campos de un diseño que importan para el cálculo de carga. */
export interface LoadDesign {
  designer_id: string | null;
  deadline_at: string;
  type?: DesignType;
}

/**
 * Clave de semana ISO: el lunes de la semana a la que pertenece la fecha,
 * como `yyyy-MM-dd`. Semana empieza en lunes (weekStartsOn: 1), igual que la
 * Team page. Se construye con la fecha LOCAL (no toISOString) para no
 * desplazar el día por zona horaria.
 */
export function weekKeyFor(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const monday = startOfWeek(d, { weekStartsOn: 1 });
  const y = monday.getFullYear();
  const m = String(monday.getMonth() + 1).padStart(2, '0');
  const day = String(monday.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Construye mapas de carga ponderada por semana a partir de diseños existentes.
 * Devuelve Map<weekKey, Map<designerId, pesoTotal>>. Ignora diseños sin
 * diseñador conocido. Cada semana vista arranca con todos los diseñadores a 0.
 */
export function buildWeeklyWeightMaps(
  designs: LoadDesign[],
  designerIds: string[],
): Map<string, Map<string, number>> {
  const maps = new Map<string, Map<string, number>>();
  const known = new Set(designerIds);
  for (const d of designs) {
    const wk = weekKeyFor(d.deadline_at);
    const weekMap = loadMapForWeek(maps, wk, designerIds);
    if (!d.designer_id || !known.has(d.designer_id)) continue;
    weekMap.set(d.designer_id, (weekMap.get(d.designer_id) ?? 0) + getDesignWeightValue(d.type));
  }
  return maps;
}

/**
 * Devuelve el mapa de carga de una semana. Si no existe, lo crea con todos
 * los diseñadores a 0 y lo registra en `maps`.
 */
export function loadMapForWeek(
  maps: Map<string, Map<string, number>>,
  weekKey: string,
  designerIds: string[],
): Map<string, number> {
  let m = maps.get(weekKey);
  if (!m) {
    m = new Map(designerIds.map((id) => [id, 0]));
    maps.set(weekKey, m);
  }
  return m;
}

/** Suma de pesos de una lista de diseños. */
export function sumWeight(designs: { type?: DesignType }[]): number {
  return designs.reduce((acc, d) => acc + getDesignWeightValue(d.type), 0);
}
