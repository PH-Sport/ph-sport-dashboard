'use client';

import { useMemo, useState } from 'react';
import type { Design } from '@/lib/types/design';

export type DesignSortColumn = 'title' | 'player' | 'deadline' | 'status' | null;
export type SortDirection = 'asc' | 'desc';

interface UseDesignsTableResult {
  itemsPerPage: number;
  currentPage: number;
  sortColumn: DesignSortColumn;
  sortDirection: SortDirection;
  paginatedItems: Design[];
  totalItems: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  setItemsPerPage: (n: number) => void;
  setCurrentPage: (page: number | ((prev: number) => number)) => void;
  handleSort: (column: DesignSortColumn) => void;
}

/**
 * Encapsulates sort + pagination for the designs table.
 * Resets to page 1 when the underlying item count changes (e.g. filters applied).
 */
export function useDesignsTable(items: Design[]): UseDesignsTableResult {
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<DesignSortColumn>('deadline');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const sortedItems = useMemo(() => {
    if (!sortColumn) return items;
    const copy = [...items];
    copy.sort((a, b) => {
      let comparison = 0;
      switch (sortColumn) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'player':
          comparison = a.player.localeCompare(b.player);
          break;
        case 'deadline':
          comparison = new Date(a.deadline_at).getTime() - new Date(b.deadline_at).getTime();
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    return copy;
  }, [items, sortColumn, sortDirection]);

  const totalItems = sortedItems.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = sortedItems.slice(startIndex, endIndex);

  const handleSort = (column: DesignSortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  return {
    itemsPerPage,
    currentPage,
    sortColumn,
    sortDirection,
    paginatedItems,
    totalItems,
    totalPages,
    startIndex,
    endIndex,
    setItemsPerPage,
    setCurrentPage,
    handleSort,
  };
}
