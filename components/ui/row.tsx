'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface RowProps {
  /** Punto de urgencia, avatar o icono. */
  leading?: ReactNode;
  /** Valor, fecha o chevron. */
  trailing?: ReactNode;
  subtitle?: ReactNode;
  onClick?: () => void;
  className?: string;
  children: ReactNode;
}

/**
 * Fila de lista (spec §8.2).
 *
 * Altura minima de 44px (objetivo tactil del HIG) y la fila ENTERA es la zona
 * de toque: nada de botones diminutos dentro.
 *
 * OJO: con `onClick` la fila se renderiza como <button>, asi que ni `leading` ni
 * `trailing` pueden contener elementos interactivos (button, a, input): anidarlos
 * es HTML invalido y rompe el arbol de accesibilidad.
 */
export function Row({ leading, trailing, subtitle, onClick, className, children }: RowProps) {
  const content = (
    <>
      {leading}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{children}</span>
        {subtitle ? (
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">{subtitle}</span>
        ) : null}
      </span>
      {trailing}
    </>
  );

  const base = cn(
    'flex min-h-[44px] w-full items-center gap-3 px-md py-2 text-left transition-colors',
    'md:min-h-0 md:px-2',
    onClick && 'hover:bg-muted/40 active:bg-muted',
    className
  );

  if (!onClick) return <div className={base}>{content}</div>;

  return (
    // El foco necesita su PROPIA senal: `bg-muted/40` es identico al hover y en
    // oscuro son 2,4 puntos de luminancia sobre el lienzo — invisible con teclado.
    // Se usa el anillo que ya es convencion del repo (14 usos), con `ring-inset`
    // porque la fila vive dentro de un bloque con overflow-hidden.
    <button
      type="button"
      onClick={onClick}
      className={cn(
        base,
        'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset'
      )}
    >
      {content}
    </button>
  );
}

interface RowSeparatorProps {
  /**
   * 'text' — sangra hasta donde empieza el texto (16px).
   * 'leading' — sangra pasado el avatar o icono (44px).
   * Nunca va de borde a borde: eso encerraria en vez de separar (spec §3 R3).
   */
  inset?: 'text' | 'leading';
  className?: string;
}

export function RowSeparator({ inset = 'text', className }: RowSeparatorProps) {
  return (
    <div
      aria-hidden
      className={cn(
        'h-px bg-border',
        inset === 'leading' ? 'ml-[44px]' : 'ml-md',
        // En escritorio la separacion la siguen haciendo el hover y el espaciado.
        'md:hidden',
        className
      )}
    />
  );
}
