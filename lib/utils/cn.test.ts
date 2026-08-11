import { describe, it, expect } from 'vitest';
import { cn } from './index';

/**
 * tailwind-merge solo deshace conflictos entre clases que CONOCE. Los tokens
 * propios de este proyecto (la escala tipográfica, las sombras del modelo de
 * elevación y el radio de superficie) no vienen en su tabla, así que sin
 * configurarlos comete dos errores opuestos:
 *
 *   - borra `text-eyebrow` creyendo que es un color de texto que compite con
 *     `text-muted-foreground` (el componente Eyebrow perdía su tamaño);
 *   - NO deshace `shadow-raised` vs `shadow-none`, así que la sombra que el
 *     código creía quitada seguía pintándose (la regresión de la fase 1).
 *
 * Estos tests fijan ambos comportamientos.
 */
describe('cn — tokens propios del proyecto', () => {
  describe('escala tipográfica: tamaño y color no compiten', () => {
    it('conserva text-eyebrow junto a un color de texto', () => {
      expect(cn('text-eyebrow text-muted-foreground')).toBe('text-eyebrow text-muted-foreground');
    });

    it('deja que un color posterior gane sin llevarse el tamaño', () => {
      expect(cn('text-eyebrow text-muted-foreground', 'text-primary')).toBe(
        'text-eyebrow text-primary'
      );
    });

    it('conserva el tamaño con clases de utilidad alrededor', () => {
      expect(cn('truncate text-eyebrow text-muted-foreground')).toContain('text-eyebrow');
    });
  });

  describe('escala tipográfica: los tamaños sí compiten entre sí', () => {
    it('el último tamaño gana', () => {
      expect(cn('text-body text-caption')).toBe('text-caption');
      expect(cn('text-eyebrow', 'text-section')).toBe('text-section');
    });

    it('compite también con los tamaños nativos de Tailwind', () => {
      expect(cn('text-eyebrow text-xs')).toBe('text-xs');
    });
  });

  describe('elevación', () => {
    it('shadow-none deshace shadow-raised', () => {
      expect(cn('shadow-raised', 'shadow-none')).toBe('shadow-none');
    });

    it('las sombras propias compiten entre sí', () => {
      expect(cn('shadow-raised shadow-overlay')).toBe('shadow-overlay');
    });
  });

  describe('radio de superficie', () => {
    it('rounded-2xl deshace rounded-surface', () => {
      expect(cn('rounded-surface', 'rounded-2xl')).toBe('rounded-2xl');
    });
  });

  describe('los modificadores de viewport no se pisan', () => {
    it('conserva la contraparte md: junto a la clase base', () => {
      const result = cn('md:translate-y-0 md:opacity-100', 'translate-y-1 opacity-0');
      expect(result).toContain('md:translate-y-0');
      expect(result).toContain('md:opacity-100');
      expect(result).toContain('translate-y-1');
      expect(result).toContain('opacity-0');
    });
  });
});
