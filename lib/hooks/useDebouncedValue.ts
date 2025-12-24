/**
 * lib/hooks/useDebouncedValue.ts
 * Generic debounce hook for any value type
 */

import { useState, useEffect, useRef } from 'react';

/**
 * Hook that debounces a value
 * 
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 300)
 * @returns Tuple of [debouncedValue, setValue]
 *   - `debouncedValue`: The debounced value that updates after the delay
 *   - `setValue`: A function that immediately updates the debounced value (bypasses debounce delay)
 * 
 * @remarks
 * The `setValue` function is useful for controlled components where you need immediate updates
 * (e.g., when clearing a search field or programmatically setting a value). For normal user input,
 * let the hook debounce naturally by updating the `value` prop.
 * 
 * @example
 * ```typescript
 * // Normal usage - debounced updates
 * const [searchValue, setSearchValue] = useState('');
 * const [debouncedSearch] = useDebouncedValue(searchValue, 300);
 * 
 * // Use debouncedSearch in effects or filters
 * useEffect(() => {
 *   // This only runs after user stops typing for 300ms
 *   performSearch(debouncedSearch);
 * }, [debouncedSearch]);
 * ```
 * 
 * @example
 * ```typescript
 * // Using setValue for immediate updates
 * const [debouncedSearch, setDebouncedSearch] = useDebouncedValue('', 300);
 * 
 * const handleClear = () => {
 *   setDebouncedSearch(''); // Updates immediately, bypasses debounce
 * };
 * ```
 */
export function useDebouncedValue<T>(
  value: T,
  delay: number = 300
): [T, (newValue: T) => void] {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  /**
   * Immediate setter that bypasses debounce delay
   * Useful for programmatic updates (e.g., clearing a field, resetting to default)
   * 
   * @param newValue - The new value to set immediately
   */
  const setValue = (newValue: T) => {
    // Clear any pending debounced update
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    // Update immediately, bypassing the debounce delay
    setDebouncedValue(newValue);
  };

  return [debouncedValue, setValue];
}

