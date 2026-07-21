'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Loader2, SendHorizonal, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { createEmptyCard, type DesignCard } from '@/lib/utils/design-cards';
import type { ParsedDesignCandidate } from '@/lib/services/designs/parse-message';

/**
 * Barra de composición del agente de parseo (Fase 4, Task 3): un textarea
 * auto-creciente + botón de envío que llama a `POST /api/designs/parse` y
 * convierte la respuesta en `DesignCard`s para que el diálogo las añada al
 * taller. Nunca persiste nada por sí misma; solo propone tarjetas.
 */
export interface AgentComposerProps {
  /** El diálogo decide cómo añadirlas a la lista (reemplazar/insertar). */
  onCards: (cards: DesignCard[]) => void;
  /** p. ej. mientras se está creando el lote. */
  disabled?: boolean;
}

type Status =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'success'; count: number }
  | { kind: 'fallback' };

interface ParseSuccessResponse {
  fallback: false;
  designs: ParsedDesignCandidate[];
}

interface ParseFallbackResponse {
  fallback: true;
  reason: string;
}

type ParseResponse = ParseSuccessResponse | ParseFallbackResponse;

function isParseResponse(value: unknown): value is ParseResponse {
  return !!value && typeof value === 'object' && 'fallback' in value;
}

/** Candidato normalizado → tarjeta del taller, marcada como propuesta del agente. */
function candidateToCard(candidate: ParsedDesignCandidate): DesignCard {
  return {
    ...createEmptyCard(),
    type: candidate.type,
    player: candidate.player,
    match_home: candidate.match_home,
    match_away: candidate.match_away,
    deadline_at: candidate.deadline_at ? new Date(candidate.deadline_at) : undefined,
    designer_id: candidate.designer_id,
    details: candidate.details,
    source: 'ia',
    warnings: candidate.warnings,
  };
}

/** El mensaje original, sin tocar, cuando el agente no está disponible. */
function fallbackCard(message: string): DesignCard {
  return {
    ...createEmptyCard(),
    details: message,
    source: 'ia',
    warnings: ['agente_no_disponible'],
  };
}

export function AgentComposer({ onCards, disabled }: AgentComposerProps) {
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const loading = status.kind === 'loading';
  const canSend = message.trim().length > 0 && !loading && !disabled;

  // Auto-crecer el textarea (1 → ~5 líneas, luego scroll interno vía max-h).
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [message]);

  // El diálogo desmonta este componente al cerrarse (sin forceMount). Si hay
  // una petición en vuelo, abortarla evita que resuelva tras el desmontaje y
  // cuele tarjetas en una sesión nueva (el diálogo se reabrió mientras tanto).
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const send = async () => {
    const trimmed = message.trim();
    if (!trimmed || loading || disabled) return;

    const controller = new AbortController();
    abortRef.current = controller;

    setStatus({ kind: 'loading' });

    try {
      const response = await fetch('/api/designs/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(`parse respondió ${response.status}`);

      const data: unknown = await response.json();
      if (!isParseResponse(data)) throw new Error('Respuesta de parseo inesperada');

      if (controller.signal.aborted) return;

      if (data.fallback === true) {
        onCards([fallbackCard(trimmed)]);
        setStatus({ kind: 'fallback' });
      } else {
        const cards = data.designs.map(candidateToCard);
        onCards(cards);
        setStatus({ kind: 'success', count: cards.length });
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      if (controller.signal.aborted) return;

      onCards([fallbackCard(trimmed)]);
      setStatus({ kind: 'fallback' });
    } finally {
      if (!controller.signal.aborted) setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      void send();
    }
  };

  return (
    <div className="shrink-0 space-y-1.5">
      <div
        className={cn(
          'flex items-end gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm',
          'transition-shadow focus-within:ring-2 focus-within:ring-primary/20'
        )}
      >
        <Sparkles className="mb-2 ml-1 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            if (status.kind === 'success' || status.kind === 'fallback') {
              setStatus({ kind: 'idle' });
            }
          }}
          onKeyDown={handleKeyDown}
          disabled={disabled || loading}
          placeholder="Escribe o pega un mensaje…"
          rows={1}
          className={cn(
            'min-h-0 max-h-36 resize-none overflow-y-auto border-0 bg-transparent px-1 py-1.5 shadow-none',
            'focus-visible:ring-0 focus-visible:ring-offset-0'
          )}
        />
        <Button
          type="button"
          onClick={() => void send()}
          disabled={!canSend}
          className="mb-0.5 size-11 shrink-0 rounded-xl p-0 md:size-9"
          aria-label="Enviar mensaje al agente"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <SendHorizonal className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Solo habla cuando tiene algo que reportar (trabajando/hecho/falló).
          En reposo calla: el icono y el placeholder ya explican el campo. */}
      {status.kind !== 'idle' && (
        <p className={cn('px-1 text-xs text-muted-foreground', status.kind === 'fallback' && 'text-status-warning')}>
          {status.kind === 'loading' && (
            <span className="inline-flex items-center gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin" />
              Leyendo el mensaje…
            </span>
          )}
          {status.kind === 'success' &&
            `${status.count} tarjeta${status.count !== 1 ? 's' : ''} añadida${status.count !== 1 ? 's' : ''}.`}
          {status.kind === 'fallback' && 'El agente no está disponible — tu texto quedó en una tarjeta.'}
        </p>
      )}
    </div>
  );
}
