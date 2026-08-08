import { describe, it, expect } from 'vitest';
import {
  concentricRadius,
  surfaceClasses,
  SURFACE_RADIUS_PX,
  SURFACE_PADDING_PX,
} from './surface-variants';

describe('concentricRadius', () => {
  it('resta el padding al radio exterior', () => {
    expect(concentricRadius(22, 16)).toBe(6);
  });

  it('nunca baja del minimo, aunque el padding se coma el radio', () => {
    expect(concentricRadius(12, 16)).toBe(4);
    expect(concentricRadius(12, 16, 2)).toBe(2);
  });

  it('el radio interior por defecto del sistema es 6px', () => {
    expect(concentricRadius(SURFACE_RADIUS_PX, SURFACE_PADDING_PX)).toBe(6);
  });

  it('no devuelve nunca un hijo mas redondo que su padre', () => {
    for (let outer = 4; outer <= 40; outer += 2) {
      for (let pad = 0; pad <= 24; pad += 4) {
        expect(concentricRadius(outer, pad)).toBeLessThanOrEqual(Math.max(outer, 4));
      }
    }
  });
});

describe('surfaceClasses', () => {
  it('grouped agrupa por tono, sin borde, en movil', () => {
    const c = surfaceClasses('grouped');
    expect(c).toContain('bg-card');
    expect(c).toContain('rounded-surface');
    expect(c).not.toMatch(/(^|\s)border(\s|$)/);
    expect(c).not.toMatch(/(^|\s)shadow-raised(\s|$)/);
  });

  it('plain no pinta superficie en movil', () => {
    const c = surfaceClasses('plain');
    expect(c).toContain('bg-transparent');
    expect(c).not.toContain('rounded-surface');
  });

  it('ambas variantes restauran el escritorio actual bajo md:', () => {
    for (const v of ['grouped', 'plain'] as const) {
      const c = surfaceClasses(v);
      expect(c).toContain('md:border');
      expect(c).toContain('md:border-border');
      expect(c).toContain('md:bg-card');
      expect(c).toContain('md:rounded-lg');
      expect(c).toContain('md:shadow-raised');
    }
  });
});
