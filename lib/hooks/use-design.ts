'use client';

import useSWR from 'swr';
import type { Design } from '@/lib/types/design';

/**
 * Detalle de un diseño vía SWR (fetcher global `apiFetcher`).
 * - `designId` null o `enabled` false → no fetchea (key condicional).
 * - Cache compartida: reabrir el mismo diseño pinta al instante y revalida detrás.
 * - Sustituye al fetch manual del detail-sheet (race condition sin AbortController).
 */
export function useDesign(designId: string | null, enabled = true) {
  const { data, error, isLoading, mutate } = useSWR<Design>(
    enabled && designId ? `/api/designs/${designId}` : null
  );

  return {
    design: data ?? null,
    error,
    isLoading,
    mutate,
  };
}
