'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Hint } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface WeekNavProps {
  /** Etiqueta de la semana (p. ej. "9 de jun - 15 de jun"). */
  label: string;
  onPrev: () => void;
  onNext: () => void;
  /** Saltar a la semana actual (clic sobre la etiqueta). Si se omite, la etiqueta no es interactiva. */
  onCurrent?: () => void;
  /** Si la semana visible ya es la actual, la etiqueta queda inerte. */
  isCurrent?: boolean;
  className?: string;
}

/**
 * Navegador de semanas — placa compacta con chevrons (lenguaje del concepto D).
 * La etiqueta, cuando no es la semana actual, es un botón que regresa a hoy.
 */
export function WeekNav({ label, onPrev, onNext, onCurrent, isCurrent, className }: WeekNavProps) {
  const labelInteractive = !!onCurrent && !isCurrent;
  return (
    <div
      className={cn(
        'flex items-center gap-1 rounded-xl border border-border bg-card p-1 shadow-raised',
        className
      )}
    >
      <button
        type="button"
        onClick={onPrev}
        aria-label="Semana anterior"
        className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <Hint label={labelInteractive ? 'Ir a la semana actual' : undefined} side="top">
        <button
          type="button"
          onClick={labelInteractive ? onCurrent : undefined}
          disabled={!labelInteractive}
          className={cn(
            'rounded-lg px-2.5 py-1 font-mono tabular text-xs transition-colors',
            isCurrent
              ? 'bg-primary/15 font-medium text-primary'
              : labelInteractive
                ? 'text-foreground hover:bg-muted/60'
                : 'cursor-default text-muted-foreground'
          )}
        >
          {/* Ancho fijo: 21ch = etiqueta más larga ("22 de jun - 28 de jun"),
              centrada, para que la placa no salte al cambiar de semana. */}
          <span className="inline-block min-w-[21ch] text-center">{label}</span>
        </button>
      </Hint>
      <button
        type="button"
        onClick={onNext}
        aria-label="Semana siguiente"
        className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
