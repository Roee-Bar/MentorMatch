// lib/hooks/useLoadingState.ts
// Custom hook for managing loading states across multiple actions

'use client';

import { useState, useCallback } from 'react';

/**
 * Custom hook to manage loading states for multiple concurrent actions.
 * Uses a Set to track which action keys are currently loading.
 * 
 * @returns Object with startLoading, stopLoading, and isLoading functions
 * 
 * @example
 * const { startLoading, stopLoading, isLoading } = useLoadingState();
 * 
 * const handleAction = async (id: string) => {
 *   const key = `action-${id}`;
 *   startLoading(key);
 *   try {
 *     await performAction(id);
 *   } finally {
 *     stopLoading(key);
 *   }
 * };
 * 
 * <button disabled={isLoading(`action-${id}`)}>
 *   {isLoading(`action-${id}`) ? 'Loading...' : 'Click me'}
 * </button>
 */
export function useLoadingState() {
  const [loadingActions, setLoadingActions] = useState<Set<string>>(new Set());

  const startLoading = useCallback((key: string) => {
    setLoadingActions(prev => new Set(prev).add(key));
  }, []);

  const stopLoading = useCallback((key: string) => {
    setLoadingActions(prev => {
      const updated = new Set(prev);
      updated.delete(key);
      return updated;
    });
  }, []);

  const isLoading = useCallback((key: string) => 
    loadingActions.has(key), 
    [loadingActions]
  );

  return { startLoading, stopLoading, isLoading };
}

