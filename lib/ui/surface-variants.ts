/**
 * Superficies iOS 26 — logica pura, sin React.
 *
 * Regla (spec §3 R2): en movil se agrupa por TONO, no por borde. A partir de
 * md: se restaura el aspecto de escritorio actual, que no entra en esta fase.
 */

export type SurfaceVariant = 'grouped' | 'plain';

/** Radio exterior de una superficie agrupada, en px. */
export const SURFACE_RADIUS_PX = 22;
/** Padding interior estandar de una superficie, en px. */
export const SURFACE_PADDING_PX = 16;

/**
 * Radio concentrico: el hijo comparte centro de curvatura con el padre.
 * radio_interior = radio_exterior - padding (spec §3 R4).
 */
export function concentricRadius(outer: number, padding: number, min = 4): number {
  return Math.max(min, outer - padding);
}

/** Clases que restauran el escritorio actual. Identicas para ambas variantes. */
const DESKTOP = 'md:border md:border-border md:bg-card md:rounded-2xl md:shadow-raised';

export function surfaceClasses(variant: SurfaceVariant): string {
  const mobile =
    variant === 'grouped'
      ? 'bg-card rounded-surface overflow-hidden'
      : 'bg-transparent';
  return `${mobile} ${DESKTOP}`;
}
