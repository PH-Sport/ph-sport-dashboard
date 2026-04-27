'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import type { Design } from '@/lib/types/design';
import {
  type BulkDesignRow,
  type SingleDesignFormData,
  isRowValid,
} from '@/lib/utils/design-form';

interface UseDesignSubmitParams {
  design?: Design | null;
  formData: SingleDesignFormData;
  bulkRows: BulkDesignRow[];
  /** Called after a successful create/edit. Use to refresh data and close. */
  onSuccess: () => void;
}

const ONE_HOUR_MS = 60 * 60 * 1000;

export function useDesignSubmit({
  design,
  formData,
  bulkRows,
  onSuccess,
}: UseDesignSubmitParams) {
  const [loading, setLoading] = useState(false);
  const isEditMode = !!design;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditMode && design) {
        if (!formData.deadline_at) {
          toast.error('Selecciona una fecha de entrega');
          setLoading(false);
          return;
        }

        const deadline = formData.deadline_at;

        const response = await fetch(`/api/designs/${design.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            deadline_at: deadline.toISOString(),
            designer_id: formData.designer_id || null,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Error al actualizar diseño');
        }

        toast.success('Diseño actualizado exitosamente');
      } else {
        const validRows = bulkRows.filter(isRowValid);
        if (validRows.length === 0) {
          toast.error('Añade al menos un diseño completo');
          setLoading(false);
          return;
        }

        const oneHourAgo = new Date(Date.now() - ONE_HOUR_MS);
        for (const row of validRows) {
          if (row.deadline_at && row.deadline_at < oneHourAgo) {
            toast.error(`"${row.title}": la fecha no puede ser tan antigua`);
            setLoading(false);
            return;
          }
        }

        const response = await fetch('/api/designs/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            designs: validRows.map((r) => ({
              title: r.title || undefined,
              player: r.player,
              match_home: r.match_home,
              match_away: r.match_away,
              deadline_at: r.deadline_at!.toISOString(),
              designer_id: r.designer_id || undefined,
              folder_url: r.folder_url || undefined,
              player_status: r.player_status || undefined,
            })),
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
