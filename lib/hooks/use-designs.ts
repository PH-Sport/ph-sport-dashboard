import useSWR, { type KeyedMutator } from 'swr';
import { format } from 'date-fns';
import type { Design } from '@/lib/types/design';
import type { DesignStatus } from '@/lib/types/filters';
import { designsFetcher } from '@/lib/utils/api-fetcher';

interface UseDesignsParams {
  weekStart: Date | undefined;
  weekEnd: Date | undefined;
  statusFilter?: DesignStatus | 'all';
  designerFilter?: string | 'all';
}

interface UseDesignsReturn {
  items: Design[];
  isLoading: boolean;
  error: Error | null;
  /** KeyedMutator real de SWR — permite updates optimistas con rollback. */
  mutate: KeyedMutator<Design[]>;
}

export function useDesigns({
  weekStart,
  weekEnd,
  statusFilter = 'all',
  designerFilter = 'all',
}: UseDesignsParams): UseDesignsReturn {
  const url =
    weekStart && weekEnd
      ? `/api/designs?${new URLSearchParams({
          weekStart: format(weekStart, 'yyyy-MM-dd'),
          weekEnd: format(weekEnd, 'yyyy-MM-dd'),
          ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
          ...(designerFilter !== 'all'
            ? designerFilter.startsWith('former:')
              ? { formerDesignerId: designerFilter.slice('former:'.length) }
              : { designerId: designerFilter }
            : {}),
        }).toString()}`
      : null;

  const { data, error, isLoading, mutate } = useSWR<Design[]>(url, designsFetcher);

  return {
    items: data ?? [],
    isLoading,
    error: error ?? null,
    mutate,
  };
}
