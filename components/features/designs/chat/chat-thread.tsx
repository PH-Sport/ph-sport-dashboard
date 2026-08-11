'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Sparkles } from 'lucide-react';

import { cn } from '@/lib/utils';
import { SPRINGS } from '@/components/ui/animations';
import type { DesignCard } from '@/lib/utils/design-cards';
import type { CardReceipt } from '@/lib/utils/design-draft';
import type { ChatMessage } from '@/lib/hooks/use-design-chat';
import { CardSummaryRow } from '../cards/card-summary-row';

/**
 * El hilo de la conversación: mensajes, ecos de las tarjetas que el agente
 * toca y respuestas rápidas. No decide nada — pinta lo que le llega y avisa
 * al diálogo cuando el usuario toca un eco o responde un chip.
 */
export interface ChatThreadProps {
  messages: ChatMessage[];
  /** Tarjetas vivas, para pintar el eco con su estado actual. */
  cardsById: Map<string, DesignCard>;
  designerName: (id: string | null) => string;
  sending: boolean;
  onAnswer: (messageId: string, value: string) => void;
  onOpenCard: (cardId: string) => void;
}

const ACTION_LABELS: Record<CardReceipt['action'], string> = {
  added: 'Añadida',
  updated: 'Modificada',
  removed: 'Eliminada',
};

export function ChatThread({
  messages,
  cardsById,
  designerName,
  sending,
  onAnswer,
  onOpenCard,
}: ChatThreadProps) {
  const anchorRef = useRef<HTMLDivElement>(null);

  // El hilo siempre mira al final: lo último dicho es lo que importa.
  useEffect(() => {
    anchorRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [messages.length, sending]);

  if (messages.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <Sparkles className="h-6 w-6 text-primary" aria-hidden="true" />
        <p className="max-w-xs text-sm text-muted-foreground">
          Pega el mensaje de la semana y te preparo las tarjetas. Luego puedes pedirme cambios.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => {
        if (message.role === 'user') {
          return (
            <div key={message.id} className="flex justify-end">
              <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl bg-primary/10 px-3.5 py-2.5 text-sm">
                {message.text}
              </p>
            </div>
          );
        }

        if (message.role === 'system') {
          return (
            <p key={message.id} className="px-1 text-xs text-status-warning">
              {message.text}
            </p>
          );
        }

        return (
          <div key={message.id} className="space-y-2.5">
            {message.text && (
              <div className="flex gap-2">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <p className="min-w-0 flex-1 whitespace-pre-wrap text-sm">{message.text}</p>
              </div>
            )}

            {/* Ecos: la tarjeta de verdad vive en la otra pestaña; esto es su recibo. */}
            <AnimatePresence initial={false}>
              {message.receipts.map((receipt, i) => {
                const card = cardsById.get(receipt.id);
                const label = ACTION_LABELS[receipt.action];

                return (
                  <motion.div
                    key={receipt.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    // Escalonado: las tarjetas de un turno se leen naciendo, no apareciendo.
                    transition={{ ...SPRINGS.smooth, delay: i * 0.08 }}
                    className="ml-6"
                  >
                    {card ? (
                      <button
                        type="button"
                        onClick={() => onOpenCard(card.id)}
                        className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 text-left transition-colors hover:border-primary/50"
                      >
                        <span className="shrink-0 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          {label}
                        </span>
                        <CardSummaryRow card={card} designerName={designerName(card.designer_id)} />
                      </button>
                    ) : (
                      <div className="flex items-center gap-3 rounded-xl border border-dashed border-border px-3 py-2.5 opacity-50">
                        <span className="shrink-0 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          {label}
                        </span>
                        <span className="truncate text-sm text-muted-foreground">
                          {receipt.action === 'removed' ? 'Tarjeta eliminada' : 'Tarjeta ya no disponible'}
                        </span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {message.ask && (
              <div className="ml-6 space-y-2">
                <p className="text-sm">{message.ask.question}</p>
                {message.ask.options.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {message.ask.options.map((option) => {
                      const elegido = message.answered === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          disabled={message.answered !== undefined}
                          onClick={() => onAnswer(message.id, option.value)}
                          className={cn(
                            'min-h-11 rounded-xl border border-border px-4 text-sm transition-colors md:min-h-9',
                            'hover:border-primary/50 disabled:cursor-default',
                            elegido ? 'border-primary text-primary' : 'disabled:opacity-40'
                          )}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {sending && (
        <p className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Pensando…
        </p>
      )}

      <div ref={anchorRef} aria-hidden />
    </div>
  );
}
