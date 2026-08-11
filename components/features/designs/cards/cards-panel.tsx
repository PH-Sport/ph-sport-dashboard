'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';

import { SPRINGS } from '@/components/ui/animations';
import { isOutsideWeek } from '@/lib/utils/design-form';
import type { DesignCard } from '@/lib/utils/design-cards';
import type { Designer } from '@/lib/hooks/use-designers';
import { DesignCardItem } from './design-card-item';

/**
 * La pestaña Tarjetas: el taller propiamente dicho. Cada tarjeta se abre y se
 * edita aquí — el chat solo deja ecos que apuntan a este panel.
 */
export interface CardsPanelProps {
  cards: DesignCard[];
  openId: string | null;
  designers: Designer[];
  loadingDesigners: boolean;
  activeWeekStart?: Date;
  activeWeekEnd?: Date;
  onToggle: (id: string) => void;
  onChange: (id: string, patch: Partial<DesignCard>) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
}

export function CardsPanel({
  cards,
  openId,
  designers,
  loadingDesigners,
  activeWeekStart,
  activeWeekEnd,
  onToggle,
  onChange,
  onRemove,
  onAdd,
}: CardsPanelProps) {
  return (
    <div className="space-y-3">
      <AnimatePresence initial={false}>
        {cards.map((card, index) => (
          <motion.div
            key={card.id}
            // data-card-id: el eco del chat busca por aquí para desplazarse.
            data-card-id={card.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            // Escalonado: un lote del agente se lee naciendo, no apareciendo de golpe.
            transition={{ ...SPRINGS.smooth, delay: card.source === 'ia' ? index * 0.08 : 0 }}
          >
            <DesignCardItem
              card={card}
              index={index + 1}
              open={openId === card.id}
              onToggle={() => onToggle(card.id)}
              onChange={(patch) => onChange(card.id, patch)}
              onRemove={() => onRemove(card.id)}
              canRemove={cards.length > 1}
              designers={designers}
              loadingDesigners={loadingDesigners}
              outsideWeek={isOutsideWeek(card.deadline_at, activeWeekStart, activeWeekEnd)}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      <button
        type="button"
        onClick={onAdd}
        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
      >
        <Plus className="h-4 w-4" />
        Añadir diseño
      </button>
    </div>
  );
}
