'use client';

import React from 'react';

// Utility functions for data processing in admin dashboard

export type SortConfig = {
  column: string;
  direction: 'asc' | 'desc';
};

/**
 * Format a date to a localized date string
 */
export const formatDate = (date: Date | string | undefined): string => {
  if (!date) return 'N/A';
  try {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString();
  } catch {
    return 'N/A';
  }
};

/**
 * Calculate the number of days pending from a date applied
 */
export const calculateDaysPending = (dateApplied: Date | string | undefined): number => {
  if (!dateApplied) return 0;
  try {
    const applied = dateApplied instanceof Date ? dateApplied : new Date(dateApplied);
    const now = new Date();
    const diffTime = now.getTime() - applied.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
};

/**
 * Generic function to filter and sort data
 * @param data - Array of data to filter and sort
 * @param filterText - Text to filter by
 * @param filterFn - Function to determine if item matches filter
 * @param sortConfig - Sort configuration (column and direction)
 * @param sortFn - Function to compare two items for sorting
 */
export const getFilteredAndSortedData = <T,>(
  data: T[],
  filterText: string,
  filterFn: (item: T, filter: string) => boolean,
  sortConfig: SortConfig,
  sortFn: (a: T, b: T) => number
): T[] => {
  let filtered = data;
  
  // Apply filter
  if (filterText.trim()) {
    filtered = data.filter(item => filterFn(item, filterText.toLowerCase()));
  }
  
  // Apply sort
  if (sortConfig.column) {
    filtered = [...filtered].sort((a, b) => {
      const result = sortFn(a, b);
      return sortConfig.direction === 'asc' ? result : -result;
    });
  }
  
  return filtered;
};

/**
 * Sort indicator component to show sort direction
 * Note: This is a React component, but we export it from utils for convenience
 */
export const SortIndicator: React.FC<{ column: string; sortConfig: SortConfig }> = ({ column, sortConfig }) => {
  if (sortConfig.column !== column) return null;
  return (
    <span className="ml-1">
      {sortConfig.direction === 'asc' ? '↑' : '↓'}
    </span>
  );
};

