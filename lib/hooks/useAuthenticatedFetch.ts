'use client';

import { useState, useEffect, DependencyList } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { ROUTES } from '@/lib/routes';

interface UseAuthenticatedFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for authenticated data fetching
 * Handles token retrieval, error states, and loading states automatically
 * 
 * @param fetcher - Async function that receives auth token and returns data
 * @param deps - Dependencies array for re-fetching (default: [])
 * 
 * @example
 * const { data: supervisor, loading, error } = useAuthenticatedFetch(
 *   (token) => apiClient.getSupervisorById(userId, token).then(r => r.data),
 *   [userId]
 * );
 */
export function useAuthenticatedFetch<T>(
  fetcher: (token: string) => Promise<T>,
  deps: DependencyList = []
): UseAuthenticatedFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        router.push(ROUTES.LOGIN);
        return;
      }

      const result = await fetcher(token);
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, refetch: fetchData };
}

