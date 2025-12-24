'use client';

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
export function calculateDaysPending(submittedAt: Date): number {
  const now = new Date();
  const submitted = new Date(submittedAt);
  const diffTime = now.getTime() - submitted.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}






