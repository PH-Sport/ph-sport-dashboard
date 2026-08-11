'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { Loader2, SendHorizonal, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

/**
 * Campo de entrada del chat: textarea que crece con el texto (1 → ~5 líneas)
 * y botón de envío. No sabe nada de red — solo entrega el texto.
 */
export interface ChatComposerProps {
  onSend: (text: string) => void;
  /** Mientras el agente piensa o se está creando el lote. */
  disabled?: boolean;
  sending?: boolean;
}

export function ChatComposer({ onSend, disabled, sending }: ChatComposerProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canSend = message.trim().length > 0 && !sending && !disabled;

  // Auto-crecer (1 → ~5 líneas, luego scroll interno vía max-h).
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [message]);

  const send = () => {
    const limpio = message.trim();
    if (!limpio || sending || disabled) return;
    setMessage('');
    onSend(limpio);
  };

  return (
    <div
      className={cn(
        // items-center: icono, texto y botón comparten centro (simétrico en el
        // caso de una línea, el habitual). El p-2 deja el mismo aire por los cuatro lados.
        'flex shrink-0 items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm',
        'transition-shadow focus-within:ring-2 focus-within:ring-primary/20'
      )}
    >
      <Sparkles className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
      <Textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            send();
          }
        }}
        disabled={disabled || sending}
        placeholder="Escribe o pega un mensaje…"
        rows={1}
        className={cn(
          // overflow-x-hidden: el texto envuelve hacia abajo, nunca se desliza de lado.
          'min-h-0 max-h-36 resize-none overflow-y-auto overflow-x-hidden border-0 bg-transparent px-1 py-1.5 shadow-none',
          'focus-visible:ring-0 focus-visible:ring-offset-0'
        )}
      />
      <Button
        type="button"
        onClick={send}
        disabled={!canSend}
        className="size-11 shrink-0 rounded-xl p-0 md:size-9"
        aria-label="Enviar mensaje al agente"
      >
        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizonal className="h-4 w-4" />}
      </Button>
    </div>
  );
}
