'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Edit, Save, Layers, Loader2, Info } from 'lucide-react';
import { useDesigners } from '@/lib/hooks/use-designers';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { SPRINGS } from '@/components/ui/animations';

import type { Design } from '@/lib/types/design';
import { isOutsideWeek } from '@/lib/utils/design-form';
import {
  type DesignCard,
  createEmptyCard,
  designToCard,
  isCardValid,
  isCardEmpty,
  cardsWeight,
} from '@/lib/utils/design-cards';
import { DesignCardItem } from '@/components/features/designs/cards/design-card-item';
import { AgentComposer } from '@/components/features/designs/cards/agent-composer';
import { useDesignSubmit } from '@/lib/hooks/use-design-submit';
import { useConfirm } from '@/lib/hooks/use-confirm';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface CreateDesignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDesignCreated: () => void;
  design?: Design | null;
  /** Start of the week currently visible in the designs page. When provided, the dialog
   * warns if a deadline falls outside this range (design would be created but not appear
   * in the active view). */
  activeWeekStart?: Date;
  /** End of the week currently visible in the designs page. */
  activeWeekEnd?: Date;
}

export function CreateDesignDialog({
  open,
  onOpenChange,
  onDesignCreated,
  design,
  activeWeekStart,
  activeWeekEnd,
}: CreateDesignDialogProps) {
  const { designers, loading: loadingDesigners } = useDesigners();
  const isEditMode = !!design;

  // Taller de tarjetas: N tarjetas en creación, 1 sola (no removible) en edición.
  const [cards, setCards] = useState<DesignCard[]>(() => [createEmptyCard()]);
  // Solo una tarjeta abierta a la vez; togglear la abierta la cierra.
  const [openId, setOpenId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (design) {
      const card = designToCard(design);
      setCards([card]);
      setOpenId(card.id);
    } else {
      const card = createEmptyCard();
      setCards([card]);
      setOpenId(card.id);
    }
  }, [design, open]);

  const addCard = () => {
    const card = createEmptyCard();
    setCards((prev) => [...prev, card]);
    setOpenId(card.id);
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
    });
  };

  const updateCard = (id: string, patch: Partial<DesignCard>) => {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  // Tarjetas propuestas por el agente (F4): si la única tarjeta es la vacía inicial,
  // la reemplaza; si no, las añade al final. Colapsadas salvo que llegue solo 1.
  const appendCards = (newCards: DesignCard[]) => {
    if (newCards.length === 0) return;
    setCards((prev) => {
      const shouldReplace = prev.length === 1 && isCardEmpty(prev[0]);
      return shouldReplace ? newCards : [...prev, ...newCards];
    });
    if (newCards.length === 1) {
      setOpenId(newCards[0].id);
    }
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
    });
  };

  const removeCard = (id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
    setOpenId((prev) => (prev === id ? null : prev));
  };

  const toggleCard = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  const { confirm, isOpen: confirmOpen, options: confirmOptions, handleConfirm, handleCancel } = useConfirm();

  const { loading, submit } = useDesignSubmit({
    design,
    cards,
    onSuccess: () => {
      const card = createEmptyCard();
      setCards([card]);
      setOpenId(card.id);
      onDesignCreated();
      onOpenChange(false);
    },
  });

  const validCount = cards.filter(isCardValid).length;
  const incompleteCount = cards.filter((c) => !isCardValid(c) && !isCardEmpty(c)).length;

  // Toda creación/edición pasa por una confirmación antes de impactar la base.
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditMode) {
      const ok = await confirm({
        title: 'Guardar cambios',
        description: `¿Guardar los cambios en «${design?.title ?? 'este diseño'}»?`,
        confirmText: 'Guardar cambios',
        cancelText: 'Cancelar',
        variant: 'info',
      });
      if (!ok) return;
    } else {
      if (validCount === 0) return;
      const plural = validCount !== 1;
      const ok = await confirm({
        title: 'Confirmar creación',
        description: `Se ${plural ? 'crearán' : 'creará'} ${validCount} diseño${plural ? 's' : ''}. ¿Continuar?`,
        confirmText: `Crear ${validCount} diseño${plural ? 's' : ''}`,
        cancelText: 'Cancelar',
        variant: 'info',
      });
      if (!ok) return;
    }
    await submit();
  };

  const weekRangeLabel = (activeWeekStart && activeWeekEnd)
    ? `${activeWeekStart.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} – ${activeWeekEnd.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}`
    : null;

  // Banner agregado: cuántas tarjetas válidas caen fuera de la semana visible.
  const outsideWeekCount = useMemo(() => {
    if (!activeWeekStart || !activeWeekEnd) return 0;
    return cards.filter(
      (c) => isCardValid(c) && isOutsideWeek(c.deadline_at, activeWeekStart, activeWeekEnd)
    ).length;
  }, [cards, activeWeekStart, activeWeekEnd]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={cn(
          "max-h-[90dvh]",
          isEditMode
            ? "max-w-2xl overflow-y-auto"
            : "w-full h-[85dvh] max-w-[920px] overflow-hidden flex flex-col md:w-[92vw] md:h-[80vh] md:max-h-[780px]"
        )}>
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-3">
              {isEditMode ? (
                <>
                  <Edit className="h-6 w-6 text-primary" />
                  Editar Diseño
                </>
              ) : (
                <>
                  <Plus className="h-6 w-6 text-primary" />
                  Crear Diseños
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {isEditMode ? 'Modifica los datos del diseño.' : 'Añade uno o varios diseños al equipo.'}
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleFormSubmit}
            className={cn(!isEditMode && "mt-4 flex flex-1 min-h-0 flex-col")}
          >
            <div className={cn("mt-4", !isEditMode && "mt-0 flex flex-1 min-h-0 flex-col gap-3")}>
              {outsideWeekCount > 0 && weekRangeLabel && (
                <div className="flex shrink-0 items-start gap-2 rounded-md border border-status-warning/30 bg-status-warning/5 p-3 text-sm text-status-warning">
                  <Info className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">
                      {outsideWeekCount} diseño{outsideWeekCount !== 1 ? 's' : ''}
                    </span>{' '}
                    con fecha fuera de la semana visible ({weekRangeLabel}).{' '}
                    <span className="text-status-warning/90">
                      Se crearán correctamente, pero no aparecerán en la vista actual hasta que cambies el filtro de semana.
                    </span>
                  </div>
                </div>
              )}

              <div
                ref={listRef}
                className={cn(
                  "space-y-3",
                  !isEditMode && "flex-1 min-h-0 overflow-y-auto pr-1 [scrollbar-gutter:stable]"
                )}
              >
                <AnimatePresence initial={false}>
                  {cards.map((card, index) => (
                    <motion.div
                      key={card.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={SPRINGS.smooth}
                    >
                      <DesignCardItem
                        card={card}
                        index={index + 1}
                        open={openId === card.id}
                        onToggle={() => toggleCard(card.id)}
                        onChange={(patch) => updateCard(card.id, patch)}
                        onRemove={() => removeCard(card.id)}
                        canRemove={!isEditMode && cards.length > 1}
                        designers={designers}
                        loadingDesigners={loadingDesigners}
                        outsideWeek={isOutsideWeek(card.deadline_at, activeWeekStart, activeWeekEnd)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>

                {!isEditMode && (
                  <button
                    type="button"
                    onClick={addCard}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                  >
                    <Plus className="h-4 w-4" />
                    Añadir diseño
                  </button>
                )}
              </div>

              {!isEditMode && <AgentComposer onCards={appendCards} disabled={loading} />}
            </div>

            <DialogFooter
              className={cn(
                'mt-6 shrink-0',
                !isEditMode && 'border-t border-border bg-card pt-4 sm:justify-between sm:space-x-0'
              )}
            >
              {isEditMode ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Guardar Cambios
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                    <span>
                      <span className="font-mono">{cards.length}</span> diseño{cards.length !== 1 ? 's' : ''} · peso{' '}
                      <span className="font-mono">{cardsWeight(cards)}</span>
                    </span>
                    {incompleteCount > 0 && (
                      <span className="text-status-warning">
                        · <span className="font-mono">{incompleteCount}</span> incompleto{incompleteCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading || validCount === 0}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Layers className="mr-2 h-4 w-4" />
                          Crear {validCount} Diseño{validCount !== 1 ? 's' : ''}
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {confirmOptions && (
        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={handleCancel}
          onConfirm={handleConfirm}
          title={confirmOptions.title}
          description={confirmOptions.description}
          confirmLabel={confirmOptions.confirmText || 'Confirmar'}
          cancelLabel={confirmOptions.cancelText || 'Cancelar'}
          variant={confirmOptions.variant || 'info'}
        />
      )}
    </>
  );
}
