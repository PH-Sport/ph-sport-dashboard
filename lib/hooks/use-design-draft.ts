'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createEmptyCard, designToCard, type DesignCard } from '@/lib/utils/design-cards';
import {
  applyToolCalls,
  serializeDraft,
  deserializeDraft,
  DRAFT_STORAGE_KEY,
  type CardReceipt,
} from '@/lib/utils/design-draft';
import type { ToolCall } from '@/lib/services/designs/chat-agent';
import type { Design } from '@/lib/types/design';

const SAVE_DEBOUNCE_MS = 400;

/**
 * Estado del taller de tarjetas y su persistencia en `localStorage`.
 *
 * Solo persiste en modo creación: revivir el borrador de una edición no
 * tendría sentido (se edita un diseño concreto, que ya vive en la base).
 * El hilo del chat se guarda junto a las tarjetas porque el borrador es la
 * conversación Y su resultado: se pierden o sobreviven juntos.
 */
export function useDesignDraft({ enabled, design }: { enabled: boolean; design?: Design | null }) {
  const [cards, setCards] = useState<DesignCard[]>(() => [createEmptyCard()]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [storedMessages, setStoredMessages] = useState<unknown[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Espejo síncrono de las tarjetas: `applyCalls` necesita el estado actual
  // para devolver los recibos en el mismo tick, sin esperar al re-render.
  const cardsRef = useRef(cards);
  cardsRef.current = cards;

  // Arranque: edición carga su diseño; creación rehidrata el borrador guardado.
  useEffect(() => {
    if (design) {
      const card = designToCard(design);
      setCards([card]);
      setOpenId(card.id);
      setHydrated(true);
      return;
    }

    if (!enabled) return;

    const guardado = deserializeDraft(
      typeof window === 'undefined' ? null : window.localStorage.getItem(DRAFT_STORAGE_KEY)
    );

    if (guardado && guardado.cards.length > 0) {
      setCards(guardado.cards);
      setStoredMessages(guardado.messages);
    } else {
      setCards([createEmptyCard()]);
      setStoredMessages([]);
    }
    setOpenId(null);
    setHydrated(true);
  }, [design, enabled]);

  const persist = useCallback(
    (nextCards: DesignCard[], nextMessages: unknown[]) => {
      if (design || typeof window === 'undefined') return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        window.localStorage.setItem(
          DRAFT_STORAGE_KEY,
          serializeDraft({ cards: nextCards, messages: nextMessages })
        );
      }, SAVE_DEBOUNCE_MS);
    },
    [design]
  );

  useEffect(() => {
    if (!hydrated) return;
    persist(cards, storedMessages);
  }, [cards, storedMessages, hydrated, persist]);

  useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    },
    []
  );

  const addCard = useCallback(() => {
    setCards((prev) => [...prev, createEmptyCard()]);
  }, []);

  const updateCard = useCallback((id: string, patch: Partial<DesignCard>) => {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }, []);

  const removeCard = useCallback((id: string) => {
    setCards((prev) => {
      const next = prev.filter((c) => c.id !== id);
      return next.length > 0 ? next : [createEmptyCard()];
    });
    setOpenId((prev) => (prev === id ? null : prev));
  }, []);

  /** Aplica lo que propone el agente y devuelve los ecos para el hilo. */
  const applyCalls = useCallback((calls: ToolCall[]): CardReceipt[] => {
    const { cards: next, receipts } = applyToolCalls(cardsRef.current, calls);
    cardsRef.current = next;
    setCards(next);
    return receipts;
  }, []);

  const reset = useCallback(() => {
    const card = createEmptyCard();
    cardsRef.current = [card];
    setCards([card]);
    setOpenId(null);
    setStoredMessages([]);
    if (typeof window !== 'undefined') window.localStorage.removeItem(DRAFT_STORAGE_KEY);
  }, []);

  return {
    cards,
    cardsRef,
    openId,
    setOpenId,
    addCard,
    updateCard,
    removeCard,
    applyCalls,
    reset,
    hydrated,
    storedMessages,
    setStoredMessages,
  };
}
