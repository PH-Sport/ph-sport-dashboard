import useSWR from 'swr';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import type { Design } from '@/lib/types/design';
import { designsFetcher } from '@/lib/utils/api-fetcher';

interface UseDashboardReturn {
  items: Design[];
  isLoading: boolean;
  error: Error | null;
  mutate: () => void;
}

export function useDashboard(): UseDashboardReturn {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

  const url = `/api/designs?${new URLSearchParams({
    weekStart: format(weekStart, 'yyyy-MM-dd'),
    weekEnd: format(weekEnd, 'yyyy-MM-dd'),
  }).toString()}`;

  const { data, error, isLoading, mutate } = useSWR<Design[]>(url, designsFetcher);

  return {
    items: data ?? [],
    isLoading,
    error: error ?? null,
    mutate,
  };
}
