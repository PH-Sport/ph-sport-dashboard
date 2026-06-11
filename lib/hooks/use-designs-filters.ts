'use client';

import { useState } from 'react';
import { startOfWeek, endOfWeek, isSameDay } from 'date-fns';
import type { DesignStatus } from '@/lib/types/filters';
import { useDebounce } from '@/lib/hooks/use-debounce';

export interface DesignsFiltersState {
  statusFilter: DesignStatus | 'all';
  designerFilter: string | 'all';
  weekStartFilter: Date | undefined;
  weekEndFilter: Date | undefined;
  searchQuery: string;
  debouncedSearchQuery: string;
  /** True si algún filtro difiere del estado por defecto (semana actual, todos). */
  hasActiveFilters: boolean;
  setStatusFilter: (v: DesignStatus | 'all') => void;
  setDesignerFilter: (v: string | 'all') => void;
  setWeekStartFilter: (date: Date | undefined) => void;
  setWeekEndFilter: (date: Date | undefined) => void;
  setSearchQuery: (q: string) => void;
  /** Vuelve a los defaults: semana actual, sin estado/diseñador/búsqueda. */
  resetFilters: () => void;
}

function defaultWeekStart(): Date {
  return startOfWeek(new Date(), { weekStartsOn: 1 });
}

function defaultWeekEnd(): Date {
  return endOfWeek(new Date(), { weekStartsOn: 1 });
}

export function useDesignsFilters(): DesignsFiltersState {
  const [statusFilter, setStatusFilter] = useState<DesignStatus | 'all'>('all');
  const [designerFilter, setDesignerFilter] = useState<string | 'all'>('all');
  const [weekStartFilter, setWeekStartFilter] = useState<Date | undefined>(defaultWeekStart);
  const [weekEndFilter, setWeekEndFilter] = useState<Date | undefined>(defaultWeekEnd);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const weekIsDefault =
    weekStartFilter !== undefined &&
    weekEndFilter !== undefined &&
    isSameDay(weekStartFilter, defaultWeekStart()) &&
    isSameDay(weekEndFilter, defaultWeekEnd());

  const hasActiveFilters =
    statusFilter !== 'all' || designerFilter !== 'all' || searchQuery !== '' || !weekIsDefault;

  const resetFilters = () => {
    setStatusFilter('all');
    setDesignerFilter('all');
    setWeekStartFilter(defaultWeekStart());
    setWeekEndFilter(defaultWeekEnd());
    setSearchQuery('');
  };

  return {
    statusFilter,
    designerFilter,
    weekStartFilter,
    weekEndFilter,
    searchQuery,
    debouncedSearchQuery,
    hasActiveFilters,
    setStatusFilter,
    setDesignerFilter,
    setWeekStartFilter,
    setWeekEndFilter,
    setSearchQuery,
    resetFilters,
  };
}
