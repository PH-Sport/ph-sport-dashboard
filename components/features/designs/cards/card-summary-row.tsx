'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { cn } from '@/lib/utils';
import { effectiveTitle, type DesignCard } from '@/lib/utils/design-cards';
import { WeightChip } from './weight-chip';

/**
 * Resumen de una tarjeta del taller. Vive en dos sitios con el mismo pixel:
 * la cabecera plegada de `DesignCardItem` y el eco que el chat deja cuando el
 * agente la toca. Un solo componente para que nunca se separen.
 */

/** Etiquetas legibles para los códigos de aviso que devuelve el agente. */
const WARNING_LABELS: Record<string, string> = {
  agente_no_disponible: 'Agente no disponible',
  disenador_no_encontrado: 'Diseñador no encontrado',
  fecha_pasada: 'Fecha pasada',
  fecha_no_reconocida: 'Fecha no reconocida',
  tipo_no_reconocido: 'Tipo no reconocido',
  hora_asumida: 'Hora asumida (12:00)',
};

/** Traduce un código de aviso a texto legible; si no está mapeado, lo humaniza. */
export function warningLabel(code: string): string {
  return WARNING_LABELS[code] ?? code.replace(/_/g, ' ');
}

/** Chip discreto de aviso (fuera de semana, avisos del agente). Tono status-warning. */
export function WarningChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-status-warning/50 bg-status-warning/15 px-2 py-0.5 text-[11px] md:text-[10px] font-medium text-status-warning">
      {children}
    </span>
  );
}

export interface CardSummaryRowProps {
  card: DesignCard;
  /** 1-based; se muestra "01", "02"… en mono. El eco del chat lo omite. */
  index?: number;
  /** Nombre ya resuelto del diseñador; 'Auto' cuando la asignación es automática. */
  designerName?: string;
  outsideWeek?: boolean;
  /** Eco de una tarjeta que ya no existe: se muestra apagado. */
  muted?: boolean;
}

export function CardSummaryRow({
  card,
  index,
  designerName = 'Auto',
  outsideWeek = false,
  muted = false,
}: CardSummaryRowProps) {
  const title = effectiveTitle(card);
  const dateLabel = card.deadline_at
    ? format(card.deadline_at, 'dd MMM HH:mm', { locale: es })
    : 'sin fecha';

  return (
    <>
      {index !== undefined && (
        <span className="shrink-0 font-mono text-xs text-muted-foreground">
          {String(index).padStart(2, '0')}
        </span>
      )}
      <div className={cn('min-w-0 flex-1', muted && 'opacity-50')}>
        <p className={cn('truncate text-sm font-medium', !title && 'text-muted-foreground')}>
          {title || 'Nuevo diseño'}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <WeightChip type={card.type} />
          <span className="text-xs text-muted-foreground">{designerName}</span>
          <span className="font-mono text-xs text-muted-foreground">{dateLabel}</span>
          {card.source === 'ia' && (
            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] md:text-[10px] font-medium text-muted-foreground">
              Agente
            </span>
          )}
          {outsideWeek && <WarningChip>Fuera de semana</WarningChip>}
          {/* Los avisos son códigos únicos: no se esperan duplicados. */}
          {card.warnings.map((warning) => (
            <WarningChip key={warning}>{warningLabel(warning)}</WarningChip>
          ))}
        </div>
      </div>
    </>
  );
}
