'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { generateId } from '@/lib/utils/design-form';
import type {
  AskOption,
  CardSnapshot,
  ChatTurn,
  ToolCall,
} from '@/lib/services/designs/chat-agent';
import type { CardReceipt } from '@/lib/utils/design-draft';

export interface Ask {
  question: string;
  options: AskOption[];
}

export type ChatMessage =
  | { id: string; role: 'user'; text: string }
  | {
      id: string;
      role: 'assistant';
      text: string;
      receipts: CardReceipt[];
      ask?: Ask;
      /** Valor del chip elegido: congela las respuestas rápidas de ese mensaje. */
      answered?: string;
    }
  | { id: string; role: 'system'; text: string };

interface ChatSuccess {
  fallback: false;
  text: string;
  calls: ToolCall[];
}
interface ChatFallback {
  fallback: true;
  reason: string;
}
type ChatResponse = ChatSuccess | ChatFallback;

function isChatResponse(value: unknown): value is ChatResponse {
  return !!value && typeof value === 'object' && 'fallback' in value;
}

/**
 * Recibo en texto anexado al turno del asistente. Es lo que le permite
 * recordar qué hizo sin necesidad de reenviar bloques `tool_use`/`tool_result`.
 */
function receiptLine(receipts: CardReceipt[]): string {
  if (receipts.length === 0) return '';
  const cuenta = (accion: CardReceipt['action']) =>
    receipts.filter((r) => r.action === accion).length;
  const partes = [
    cuenta('added') ? `añadidas ${cuenta('added')}` : null,
    cuenta('updated') ? `modificadas ${cuenta('updated')}` : null,
    cuenta('removed') ? `eliminadas ${cuenta('removed')}` : null,
  ].filter(Boolean);
  return partes.length ? ` [${partes.join(', ')} tarjetas]` : '';
}

/** Tarjeta de rescate cuando el agente no está disponible en el primer turno. */
function rescueCall(text: string): ToolCall {
  return {
    tool: 'add_designs',
    designs: [
      {
        type: null,
        player: '',
        match_home: '',
        match_away: '',
        deadline_at: null,
        designer_id: null,
        details: text,
        warnings: ['agente_no_disponible'],
      },
    ],
  };
}

/**
 * El hilo, el envío y la traducción de la respuesta a mensajes + herramientas.
 * No toca el taller: se lo pasa al llamador vía `onCalls`, que devuelve los
 * ecos con los que se pinta el recibo en la conversación.
 */
export function useDesignChat({
  messages,
  setMessages,
  snapshots,
  onCalls,
}: {
  messages: ChatMessage[];
  setMessages: (updater: (prev: ChatMessage[]) => ChatMessage[]) => void;
  snapshots: () => CardSnapshot[];
  onCalls: (calls: ToolCall[]) => CardReceipt[];
}) {
  const [sending, setSending] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  // Si el diálogo se cierra con una petición en vuelo, abortarla evita que
  // resuelva sobre una conversación que ya no está en pantalla.
  useEffect(() => () => abortRef.current?.abort(), []);

  const send = useCallback(
    async (text: string) => {
      const limpio = text.trim();
      if (!limpio || sending) return;

      const userMessage: ChatMessage = { id: generateId(), role: 'user', text: limpio };
      const historial = messagesRef.current;
      setMessages((prev) => [...prev, userMessage]);
      setSending(true);

      const controller = new AbortController();
      abortRef.current = controller;

      const turns: ChatTurn[] = [...historial, userMessage]
        .filter(
          (m): m is Extract<ChatMessage, { role: 'user' | 'assistant' }> => m.role !== 'system'
        )
        .map((m) =>
          m.role === 'assistant'
            ? {
                role: 'assistant' as const,
                text: `${m.text}${receiptLine(m.receipts)}`.trim() || '(sin texto)',
              }
            : { role: 'user' as const, text: m.text }
        );

      const esPrimerTurno = historial.length === 0;

      try {
        const response = await fetch('/api/designs/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: turns, cards: snapshots() }),
          signal: controller.signal,
        });

        if (!response.ok) throw new Error(`chat respondió ${response.status}`);

        const data: unknown = await response.json();
        if (!isChatResponse(data)) throw new Error('Respuesta de chat inesperada');
        if (controller.signal.aborted) return;

        if (data.fallback === true) {
          // Sin agente, el primer mensaje no se tira: queda en una tarjeta.
          if (esPrimerTurno) onCalls([rescueCall(limpio)]);
          setMessages((prev) => [
            ...prev,
            {
              id: generateId(),
              role: 'system',
              text: esPrimerTurno
                ? 'El agente no está disponible — tu texto quedó en una tarjeta.'
                : 'El agente no está disponible ahora mismo. Puedes seguir a mano en Tarjetas.',
            },
          ]);
          return;
        }

        const receipts = onCalls(data.calls);
        const ask = data.calls.find(
          (c): c is Extract<ToolCall, { tool: 'ask' }> => c.tool === 'ask'
        );

        setMessages((prev) => [
          ...prev,
          {
            id: generateId(),
            role: 'assistant',
            text: data.text,
            receipts,
            ask: ask ? { question: ask.question, options: ask.options } : undefined,
          },
        ]);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (controller.signal.aborted) return;
        setMessages((prev) => [
          ...prev,
          {
            id: generateId(),
            role: 'system',
            text: 'No he podido contactar con el agente. Inténtalo otra vez.',
          },
        ]);
      } finally {
        if (!controller.signal.aborted) setSending(false);
      }
    },
    [sending, setMessages, snapshots, onCalls]
  );

  /** Responder con un chip: marca ese mensaje como contestado y envía el valor. */
  const answerAsk = useCallback(
    async (messageId: string, value: string) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId && m.role === 'assistant' ? { ...m, answered: value } : m))
      );
      await send(value);
    },
    [send, setMessages]
  );

  return { sending, send, answerAsk };
}
