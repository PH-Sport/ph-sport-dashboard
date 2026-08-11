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
  // Lo último pendiente de escribir: si el diálogo se cierra antes de que
  // venza el debounce, se vuelca aquí mismo en vez de perderse.
  const pendingSave = useRef<string | null>(null);
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

    // Reabrir antes de que venza el debounce leería una versión anterior a lo
    // que aún está en el aire: primero se vuelca, luego se lee.
    if (pendingSave.current !== null && typeof window !== 'undefined') {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      window.localStorage.setItem(DRAFT_STORAGE_KEY, pendingSave.current);
      pendingSave.current = null;
    }

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
      pendingSave.current = serializeDraft({ cards: nextCards, messages: nextMessages });
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        if (pendingSave.current === null) return;
        window.localStorage.setItem(DRAFT_STORAGE_KEY, pendingSave.current);
        pendingSave.current = null;
      }, SAVE_DEBOUNCE_MS);
    },
    [design]
  );

  useEffect(() => {
    if (!hydrated) return;
    persist(cards, storedMessages);
  }, [cards, storedMessages, hydrated, persist]);

  // Al desmontar, el debounce no se descarta: se vuelca. Cerrar el diálogo
  // justo después de teclear no puede costar el último cambio.
  useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      if (pendingSave.current !== null && typeof window !== 'undefined') {
        window.localStorage.setItem(DRAFT_STORAGE_KEY, pendingSave.current);
        pendingSave.current = null;
      }
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
