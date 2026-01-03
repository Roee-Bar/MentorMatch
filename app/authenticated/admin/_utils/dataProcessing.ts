'use client';

import { DateFormatter, type DateInput } from '@/lib/utils/date-formatter';

export interface SortConfig {
  column: string;
  direction: 'asc' | 'desc';
}

/**
 * Generic function to filter and sort data
 */
export function getFilteredAndSortedData<T>(
  data: T[],
  filterText: string,
  filterFn: (item: T, filter: string) => boolean,
  sortConfig: SortConfig,
  sortFn: (a: T, b: T) => number
): T[] {
  // Filter
  let filtered = data;
  if (filterText) {
    filtered = data.filter(item => filterFn(item, filterText.toLowerCase()));
  }

  // Sort
  if (sortConfig.column) {
    filtered = [...filtered].sort((a, b) => {
      const result = sortFn(a, b);
      return sortConfig.direction === 'asc' ? result : -result;
    });
  }

  return filtered;
}

/**
 * Calculate days pending for an application
 */
export function calculateDaysPending(submittedAt: DateInput): number {
  return DateFormatter.calculateDaysBetween(submittedAt);
}

