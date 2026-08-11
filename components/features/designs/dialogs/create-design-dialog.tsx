'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTriggerSliding } from '@/components/ui/tabs';
import { Plus, Edit, Save, Layers, Loader2, Info, RotateCcw } from 'lucide-react';
import { useDesigners } from '@/lib/hooks/use-designers';
import { cn } from '@/lib/utils';

import type { Design } from '@/lib/types/design';
import { isOutsideWeek } from '@/lib/utils/design-form';
import { isCardValid, isCardEmpty, cardsWeight } from '@/lib/utils/design-cards';
import { toSnapshots } from '@/lib/utils/design-draft';
import { DesignCardItem } from '@/components/features/designs/cards/design-card-item';
import { CardsPanel } from '@/components/features/designs/cards/cards-panel';
import { ChatPanel } from '@/components/features/designs/chat/chat-panel';
import { useDesignSubmit } from '@/lib/hooks/use-design-submit';
import { useDesignDraft } from '@/lib/hooks/use-design-draft';
import { useDesignChat, type ChatMessage } from '@/lib/hooks/use-design-chat';
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

  const {
    cards,
    cardsRef,
    openId,
    setOpenId,
    addCard,
    updateCard,
    removeCard,
    applyCalls,
    reset,
    storedMessages,
    setStoredMessages,
  } = useDesignDraft({ enabled: open, design });

  const [tab, setTab] = useState<'cards' | 'chat'>('cards');
  const [cardsFlash, setCardsFlash] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Se abre siempre en Tarjetas: el chat se ofrece, no se impone.
  useEffect(() => {
    if (!open) return;
    setTab('cards');
  }, [open]);

  useEffect(
    () => () => {
      if (flashTimer.current) clearTimeout(flashTimer.current);
    },
    []
  );

  // El hilo se guarda dentro del borrador; aquí se lee con su tipo real.
  const messages = storedMessages as ChatMessage[];
  const setMessages = useCallback(
    (updater: (prev: ChatMessage[]) => ChatMessage[]) => {
      setStoredMessages((prev) => updater(prev as ChatMessage[]));
    },
    [setStoredMessages]
  );

  const designerNameById = useCallback(
    (id: string | null) => {
      if (!id) return 'Auto';
      return designers.find((d) => d.id === id)?.displayName ?? 'Auto';
    },
    [designers]
  );

  const snapshots = useCallback(
    () => toSnapshots(cardsRef.current, (id) => designers.find((d) => d.id === id)?.displayName ?? null),
    [cardsRef, designers]
  );

  // Cuando el agente toca el taller y no lo estás mirando, la pestaña avisa.
  const handleCalls = useCallback(
    (calls: Parameters<typeof applyCalls>[0]) => {
      const receipts = applyCalls(calls);
      if (receipts.length > 0) {
        setCardsFlash(true);
        if (flashTimer.current) clearTimeout(flashTimer.current);
        flashTimer.current = setTimeout(() => setCardsFlash(false), 900);
      }
      return receipts;
    },
    [applyCalls]
  );

  const { sending, send, answerAsk } = useDesignChat({
    messages,
    setMessages,
    snapshots,
    onCalls: handleCalls,
  });

  const cardsById = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);

  const handleAddCard = () => {
    addCard();
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
    });
  };

  // Desde el eco del chat: saltar a la tarjeta, abierta y a la vista.
  const handleOpenCard = (cardId: string) => {
    setTab('cards');
    setOpenId(cardId);
    requestAnimationFrame(() => {
      listRef.current
        ?.querySelector(`[data-card-id="${cardId}"]`)
        ?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  };

  const handleTabChange = (value: string) => {
    setTab(value === 'chat' ? 'chat' : 'cards');
  };

  const {
    confirm,
    isOpen: confirmOpen,
    options: confirmOptions,
    handleConfirm,
    handleCancel,
  } = useConfirm();

  const { loading, submit } = useDesignSubmit({
    design,
    cards,
    onSuccess: () => {
      reset();
      setStoredMessages([]);
      onDesignCreated();
      onOpenChange(false);
    },
  });

  const validCount = cards.filter(isCardValid).length;
  const incompleteCount = cards.filter((c) => !isCardValid(c) && !isCardEmpty(c)).length;
  const hasDraft = cards.length > 1 || !isCardEmpty(cards[0]) || messages.length > 0;

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

  const handleReset = async () => {
    const ok = await confirm({
      title: 'Empezar de cero',
      description:
        'Se borrarán las tarjetas y la conversación de este borrador. Los diseños ya creados no se tocan.',
      confirmText: 'Borrar borrador',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!ok) return;
    reset();
    setTab('cards');
  };

  const weekRangeLabel =
    activeWeekStart && activeWeekEnd
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
        <DialogContent
          // Móvil: hoja a pantalla completa que sube desde abajo.
          fullscreenOnMobile={!isEditMode}
          // Sin esto, «Tarjetas» abre con el anillo de foco puesto.
          focusPanelOnOpen
          className={cn(
            isEditMode
              ? 'max-h-[90dvh] max-w-2xl overflow-y-auto'
              : cn(
                  'flex h-[100dvh] max-h-none w-full max-w-none flex-col overflow-hidden rounded-none border-0',
                  'p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]',
                  'md:h-[80vh] md:max-h-[780px] md:w-[92vw] md:max-w-[920px] md:rounded-2xl md:border md:p-6'
                )
          )}
        >
          {/* En creación la hoja sube desde abajo: la cabecera presta su zona
              al gesto de arrastrar para cerrar (no hay asa que agarrar). */}
          <DialogHeader {...(!isEditMode && { 'data-drag-handle': '' })}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-1.5">
                <DialogTitle className="flex items-center gap-3 text-xl md:text-2xl">
                  {isEditMode ? (
                    <>
                      <Edit className="h-5 w-5 text-primary md:h-6 md:w-6" />
                      Editar Diseño
                    </>
                  ) : (
                    <>
                      <Plus className="h-5 w-5 text-primary md:h-6 md:w-6" />
                      Crear Diseños
                    </>
                  )}
                </DialogTitle>
                {/* El subtítulo repite el título: en móvil no gana su sitio. */}
                <DialogDescription className="hidden md:block">
                  {isEditMode
                    ? 'Modifica los datos del diseño.'
                    : 'Añade uno o varios diseños al equipo.'}
                </DialogDescription>
              </div>

              {!isEditMode && hasDraft && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleReset}
                  // mr-12: deja libre la esquina donde vive la X del diálogo.
                  className="mr-12 min-h-11 shrink-0 gap-2 px-2 text-xs text-muted-foreground md:min-h-0"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Empezar de cero</span>
                </Button>
              )}
            </div>
          </DialogHeader>

          <form
            onSubmit={handleFormSubmit}
            className={cn(!isEditMode && 'mt-4 flex min-h-0 flex-1 flex-col')}
          >
            {outsideWeekCount > 0 && weekRangeLabel && (
              <div className="mb-3 flex shrink-0 items-start gap-2 rounded-md border border-status-warning/30 bg-status-warning/5 p-3 text-sm text-status-warning">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <span className="font-medium">
                    {outsideWeekCount} diseño{outsideWeekCount !== 1 ? 's' : ''}
                  </span>{' '}
                  con fecha fuera de la semana visible ({weekRangeLabel}).{' '}
                  <span className="text-status-warning/90">
                    Se crearán correctamente, pero no aparecerán en la vista actual hasta que
                    cambies el filtro de semana.
                  </span>
                </div>
              </div>
            )}

            {isEditMode ? (
              <div className="mt-4 space-y-3">
                <DesignCardItem
                  card={cards[0]}
                  index={1}
                  open={openId === cards[0].id}
                  onToggle={() => setOpenId(openId === cards[0].id ? null : cards[0].id)}
                  onChange={(patch) => updateCard(cards[0].id, patch)}
                  onRemove={() => undefined}
                  canRemove={false}
                  designers={designers}
                  loadingDesigners={loadingDesigners}
                  outsideWeek={isOutsideWeek(cards[0].deadline_at, activeWeekStart, activeWeekEnd)}
                />
              </div>
            ) : (
              <Tabs
                value={tab}
                onValueChange={handleTabChange}
                className="flex min-h-0 flex-1 flex-col"
              >
                <TabsList className="grid w-full shrink-0 grid-cols-2">
                  <TabsTriggerSliding
                    value="cards"
                    active={tab === 'cards'}
                    indicatorId="create-design-tab"
                    className={cn(
                      'transition-shadow',
                      // Destello: el agente tocó el taller mientras mirabas el chat.
                      cardsFlash && 'ring-2 ring-primary/40'
                    )}
                  >
                    Tarjetas · {cards.length}
                  </TabsTriggerSliding>
                  <TabsTriggerSliding
                    value="chat"
                    active={tab === 'chat'}
                    indicatorId="create-design-tab"
                  >
                    Chat
                  </TabsTriggerSliding>
                </TabsList>

                <TabsContent
                  value="cards"
                  ref={listRef}
                  className="min-h-0 flex-1 overflow-y-auto pr-1 [scrollbar-gutter:stable]"
                >
                  <CardsPanel
                    cards={cards}
                    openId={openId}
                    designers={designers}
                    loadingDesigners={loadingDesigners}
                    activeWeekStart={activeWeekStart}
                    activeWeekEnd={activeWeekEnd}
                    onToggle={(id) => setOpenId(openId === id ? null : id)}
                    onChange={updateCard}
                    onRemove={removeCard}
                    onAdd={handleAddCard}
                  />
                </TabsContent>

                <TabsContent value="chat" className="min-h-0 flex-1">
                  <ChatPanel
                    messages={messages}
                    cardsById={cardsById}
                    designerName={designerNameById}
                    sending={sending}
                    disabled={loading}
                    onSend={send}
                    onAnswer={answerAsk}
                    onOpenCard={handleOpenCard}
                  />
                </TabsContent>
              </Tabs>
            )}

            <DialogFooter
              className={cn(
                'mt-4 shrink-0 md:mt-6',
                // Creación: el pie no pertenece a ninguna pestaña — se crea desde donde estés.
                !isEditMode &&
                  'flex-col gap-2 border-t border-border bg-card pt-3 sm:space-x-0 md:flex-row md:items-center md:justify-between md:pt-4'
              )}
            >
              {isEditMode ? (
                <>
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading}>
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
                  <div className="flex flex-wrap items-center justify-center gap-1 text-xs text-muted-foreground md:justify-start">
                    <span>
                      <span className="font-mono">{cards.length}</span> diseño
                      {cards.length !== 1 ? 's' : ''} · peso{' '}
                      <span className="font-mono">{cardsWeight(cards)}</span>
                    </span>
                    {incompleteCount > 0 && (
                      <span className="text-status-warning">
                        · <span className="font-mono">{incompleteCount}</span> incompleto
                        {incompleteCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    {/* En móvil la salida es la X del header; un solo CTA manda. */}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                      className="hidden md:inline-flex"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading || validCount === 0}
                      className="w-full md:w-auto"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Layers className="mr-2 h-4 w-4" />
                          {/* Nunca «Crear 0»: sin válidas, el CTA descansa desactivado. */}
                          {validCount === 0
                            ? 'Crear diseños'
                            : `Crear ${validCount} diseño${validCount !== 1 ? 's' : ''}`}
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
