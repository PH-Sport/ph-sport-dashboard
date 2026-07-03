'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import type { Design } from '@/lib/types/design';
import {
  type DesignCard,
  isCardValid,
  cardToBulkPayload,
  effectiveTitle,
} from '@/lib/utils/design-cards';

interface UseDesignSubmitParams {
  design?: Design | null;
  cards: DesignCard[];
  /** Called after a successful create/edit. Use to refresh data and close. */
  onSuccess: () => void;
}

const ONE_HOUR_MS = 60 * 60 * 1000;

export function useDesignSubmit({ design, cards, onSuccess }: UseDesignSubmitParams) {
  const [loading, setLoading] = useState(false);
  const isEditMode = !!design;

  const submit = async () => {
    setLoading(true);

    try {
      if (isEditMode && design) {
        const card = cards[0];

        if (!card.deadline_at) {
          toast.error('Selecciona una fecha de entrega');
          setLoading(false);
          return;
        }

        const deadline = card.deadline_at;
        const isMatchday = card.type === 'matchday';
        const response = await fetch(`/api/designs/${design.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: card.type ?? 'matchday',
            title: effectiveTitle(card) || card.player.trim(),
            player: card.player.trim(),
            match_home: isMatchday ? card.match_home : null,
            match_away: isMatchday ? card.match_away : null,
            folder_url: card.folder_url.trim() || null,
            deadline_at: deadline.toISOString(),
            designer_id: card.designer_id || null,
            details: card.details.trim() || null,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Error al actualizar diseño');
        }

        toast.success('Diseño actualizado exitosamente');
      } else {
        const validCards = cards.filter(isCardValid);
        if (validCards.length === 0) {
          toast.error('Añade al menos un diseño completo');
          setLoading(false);
          return;
        }

        const oneHourAgo = new Date(Date.now() - ONE_HOUR_MS);
        for (const card of validCards) {
          if (card.deadline_at && card.deadline_at < oneHourAgo) {
            toast.error(`"${effectiveTitle(card) || card.player}": la fecha no puede ser tan antigua`);
            setLoading(false);
            return;
          }
        }

        const response = await fetch('/api/designs/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            designs: validCards.map(cardToBulkPayload),
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Error al crear diseños');
        }

        const result = await response.json();
        toast.success(
          `${result.created} diseño${result.created !== 1 ? 's' : ''} creado${result.created !== 1 ? 's' : ''} exitosamente`
        );
      }

      onSuccess();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error al crear diseño');
    } finally {
      setLoading(false);
    }
  };

  return { loading, submit };
}
