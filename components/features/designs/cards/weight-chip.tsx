import {
  DESIGN_TYPE_LABELS,
  DESIGN_TYPE_WEIGHT,
  getDesignWeightValue,
  type DesignType,
  type DesignWeight,
} from '@/lib/types/design';
import { cn } from '@/lib/utils';

/**
 * Colores por peso — única fuente de verdad, compartida entre la píldora de
 * abajo y el puntito de cada `SelectItem` de tipo en `DesignCardItem`.
 */
export const WEIGHT_COLORS: Record<DesignWeight, { pill: string; dot: string }> = {
  RAPIDA: { pill: 'text-status-success bg-status-success/10', dot: 'bg-status-success' },
  MEDIA: { pill: 'text-status-warning bg-status-warning/10', dot: 'bg-status-warning' },
  PESADA: { pill: 'text-status-error bg-status-error/10', dot: 'bg-status-error' },
};

/**
 * Píldora de peso de una tarjeta de diseño. Sin tipo elegido → aviso
 * punteado ("Sin tipo"); con tipo → label + peso numérico en mono,
 * coloreados según `DESIGN_TYPE_WEIGHT`.
 */
export function WeightChip({ type }: { type: DesignType | null }) {
  if (!type) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-status-warning/50 px-2.5 py-0.5 text-xs font-medium text-status-warning">
        Sin tipo
      </span>
    );
  }

  const weight = DESIGN_TYPE_WEIGHT[type];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        WEIGHT_COLORS[weight].pill
      )}
    >
      {DESIGN_TYPE_LABELS[type]}
      <span className="font-mono text-[10px]">{getDesignWeightValue(type)}</span>
    </span>
  );
}
