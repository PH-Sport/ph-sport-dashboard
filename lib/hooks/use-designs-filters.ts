'use client';

import { useState } from 'react';
import { startOfWeek, endOfWeek } from 'date-fns';
import type { DesignStatus } from '@/lib/types/filters';
import { useDebounce } from '@/lib/hooks/use-debounce';

export interface DesignsFiltersState {
  statusFilter: DesignStatus | 'all';
  designerFilter: string | 'all';
  weekStartFilter: Date | undefined;
  weekEndFilter: Date | undefined;
  searchQuery: string;
  debouncedSearchQuery: string;
  setStatusFilter: (v: DesignStatus | 'all') => void;
  setDesignerFilter: (v: string | 'all') => void;
  setWeekStartFilter: (date: Date | undefined) => void;
  setWeekEndFilter: (date: Date | undefined) => void;
  setSearchQuery: (q: string) => void;
}

export function useDesignsFilters(): DesignsFiltersState {
  const [statusFilter, setStatusFilter] = useState<DesignStatus | 'all'>('all');
  const [designerFilter, setDesignerFilter] = useState<string | 'all'>('all');
  const [weekStartFilter, setWeekStartFilter] = useState<Date | undefined>(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [weekEndFilter, setWeekEndFilter] = useState<Date | undefined>(() =>
    endOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [searchQuery, setSearchQuery] = useState<string>('');

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  return {
    statusFilter,
    designerFilter,
    weekStartFilter,
    weekEndFilter,
    searchQuery,
    debouncedSearchQuery,
    setStatusFilter,
    setDesignerFilter,
    setWeekStartFilter,
    setWeekEndFilter,
    setSearchQuery,
  };
}
