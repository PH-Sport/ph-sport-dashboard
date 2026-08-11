'use client';

import { useEffect, useState } from 'react';

import type { DesignCard } from '@/lib/utils/design-cards';
import type { ChatMessage } from '@/lib/hooks/use-design-chat';
import { ChatThread } from './chat-thread';
import { ChatComposer } from './chat-composer';

/**
 * La pestaña Chat: hilo arriba, composer abajo.
 *
 * En iOS el teclado no reduce `100dvh`, así que el composer quedaría debajo
 * de él. `visualViewport` dice cuánto tapa realmente y el panel se aparta esa
 * distancia — es el riesgo ergonómico principal de esta pantalla.
 */
export interface ChatPanelProps {
  messages: ChatMessage[];
  cardsById: Map<string, DesignCard>;
  designerName: (id: string | null) => string;
  sending: boolean;
  disabled?: boolean;
  onSend: (text: string) => void;
  onAnswer: (messageId: string, value: string) => void;
  onOpenCard: (cardId: string) => void;
}

export function ChatPanel({
  messages,
  cardsById,
  designerName,
  sending,
  disabled,
  onSend,
  onAnswer,
  onOpenCard,
}: ChatPanelProps) {
  const [keyboardInset, setKeyboardInset] = useState(0);

  useEffect(() => {
    const vv = typeof window === 'undefined' ? null : window.visualViewport;
    if (!vv) return;

    const update = () => {
      const tapado = window.innerHeight - vv.height - vv.offsetTop;
      setKeyboardInset(Math.max(0, Math.round(tapado)));
    };

    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  return (
    <div
      className="flex h-full min-h-0 flex-col gap-3"
      style={{ paddingBottom: keyboardInset || undefined }}
    >
      <div className="min-h-0 flex-1 overflow-y-auto pr-1 [scrollbar-gutter:stable]">
        <ChatThread
          messages={messages}
          cardsById={cardsById}
          designerName={designerName}
          sending={sending}
          onAnswer={onAnswer}
          onOpenCard={onOpenCard}
        />
      </div>
      <ChatComposer onSend={onSend} sending={sending} disabled={disabled} />
    </div>
  );
}
