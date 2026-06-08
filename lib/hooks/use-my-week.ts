import useSWR from 'swr';
import { format } from 'date-fns';
import { useAuth } from '@/lib/auth/auth-context';
import { getDefaultWeekRange } from '@/lib/utils';
import type { Design } from '@/lib/types/design';
import { designsFetcher } from '@/lib/utils/api-fetcher';

interface UseMyWeekReturn {
  items: Design[];
  isLoading: boolean;
  error: Error | null;
  mutate: () => void;
}

export function useMyWeek(): UseMyWeekReturn {
  const { user, status } = useAuth();
  const { weekStart, weekEnd } = getDefaultWeekRange();

  const url = user?.id
    ? `/api/designs?${new URLSearchParams({
        weekStart: format(weekStart, 'yyyy-MM-dd'),
        weekEnd: format(weekEnd, 'yyyy-MM-dd'),
        designerId: user.id,
      }).toString()}`
    : null;

  const { data, error, isLoading, mutate } = useSWR<Design[]>(
    status === 'AUTHENTICATED' && url ? url : null,
    designsFetcher
  );

  return {
    items: data ?? [],
    isLoading,
    error: error ?? null,
    mutate,
  };
}
