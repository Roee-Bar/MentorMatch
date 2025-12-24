/**
 * lib/hooks/useFilterState.ts
 * Generic hook for managing filter state
 */

import { useState, useMemo, useCallback } from 'react';

/**
 * Hook for managing filter state with type safety
 * 
 * @param defaultFilters - Default filter values
 * @returns Filter state management object
 * 
 * @example
 * ```typescript
 * const defaultFilters = { search: '', department: 'all', skill: 'all' };
 * const { filters, updateFilter, clearFilters, hasActiveFilters } = useFilterState(defaultFilters);
 * 
 * // Update single filter
 * updateFilter('search', 'John');
 * 
 * // Update multiple filters
 * updateFilters({ department: 'CS', skill: 'all' });
 * 
 * // Clear all filters
 * clearFilters();
 * ```
 */
export function useFilterState<T extends Record<string, any>>(
  defaultFilters: T
) {
  const [filters, setFilters] = useState<T>(defaultFilters);

  /**
   * Update a single filter value
   */
  const updateFilter = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  /**
   * Update multiple filter values at once
   */
  const updateFilters = useCallback((newFilters: Partial<T>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
    }));
  }, []);

  /**
   * Clear all filters to default values
   */
  const clearFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, [defaultFilters]);

  /**
   * Reset filters to default values (alias for clearFilters)
   */
  const resetToDefaults = useCallback(() => {
    setFilters(defaultFilters);
  }, [defaultFilters]);

  /**
   * Check if any filters are active (non-default)
   */
  const hasActiveFilters = useMemo(() => {
    return Object.keys(filters).some(key => {
      return filters[key] !== defaultFilters[key];
    });
  }, [filters, defaultFilters]);

  return {
    filters,
    updateFilter,
    updateFilters,
    clearFilters,
    resetToDefaults,
    hasActiveFilters,
  };
}

