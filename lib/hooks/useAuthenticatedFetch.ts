'use client';

import { useState, useEffect, DependencyList, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken } from '@/lib/firebase';
import { ROUTES } from '@/lib/routes';

interface RetryOptions {
  maxAttempts?: number;
  delays?: number[];
  shouldRetry?: (oldData: any, newData: any) => boolean;
}

interface UseAuthenticatedFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  isRefetching: boolean;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for authenticated data fetching
 * Handles token retrieval, error states, and loading states automatically
 * 
 * @param fetcher - Async function that receives auth token and returns data
 * @param deps - Dependencies array for re-fetching (default: [])
 * @param retryOptions - Optional retry configuration for refetch operations
 * 
 * @example
 * const { data: supervisor, loading, error } = useAuthenticatedFetch(
 *   (token) => apiClient.getSupervisorById(userId, token).then(r => r.data),
 *   [userId]
 * );
 */
export function useAuthenticatedFetch<T>(
  fetcher: (token: string) => Promise<T>,
  deps: DependencyList = [],
  retryOptions?: RetryOptions
): UseAuthenticatedFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefetching, setIsRefetching] = useState(false);
  const router = useRouter();
  const previousDataRef = useRef<T | null>(null);

  const fetchData = async (isRefetch = false) => {
    try {
      if (isRefetch) {
        setIsRefetching(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const token = await getAuthToken();
      if (!token) {
        router.push(ROUTES.LOGIN);
        return;
      }

      const result = await fetcher(token);
      setData(result);
      previousDataRef.current = result;
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
      throw err; // Re-throw for retry logic
    } finally {
      if (isRefetch) {
        setIsRefetching(false);
      } else {
        setLoading(false);
      }
    }
  };

  const refetchWithRetry = async () => {
    if (!retryOptions) {
      // No retry options, just do a simple refetch
      await fetchData(true);
      return;
    }

    const maxAttempts = retryOptions.maxAttempts ?? 3;
    const delays = retryOptions.delays ?? [0, 300, 600];
    const shouldRetry = retryOptions.shouldRetry;

    let attempts = 0;
    const initialData = previousDataRef.current;

    while (attempts < maxAttempts) {
      try {
        await fetchData(true);
        
        // If shouldRetry function is provided, check if data changed
        if (shouldRetry && initialData !== null) {
          const currentData = previousDataRef.current;
          if (!shouldRetry(initialData, currentData)) {
            // Data hasn't changed, retry if we have attempts left
            attempts++;
            if (attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, delays[attempts] || 0));
              continue;
            }
          }
        }
        
        // Success - data fetched (and changed if shouldRetry was provided)
        return;
      } catch (err: any) {
        attempts++;
        if (attempts >= maxAttempts) {
          // All attempts failed
          setError(err.message || 'Failed to refresh data after multiple attempts');
          return;
        }
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delays[attempts] || 0));
      }
    }
  };

  useEffect(() => {
    fetchData(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, isRefetching, refetch: refetchWithRetry };
}

