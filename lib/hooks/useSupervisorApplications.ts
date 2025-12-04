'use client';

// lib/hooks/useSupervisorApplications.ts
// Custom hook for fetching supervisor applications

import { useAuthenticatedFetch } from './useAuthenticatedFetch';
import { apiClient } from '@/lib/api/client';
import type { Application } from '@/types/database';

/**
 * Hook for fetching supervisor applications
 * Simplified single-endpoint hook for the applications page
 * 
 * @param userId - The supervisor's user ID
 * @returns Applications array with loading and error states
 */
export function useSupervisorApplications(userId: string | null) {
  return useAuthenticatedFetch<Application[]>(
    async (token) => {
      if (!userId) {
        return [];
      }

      const response = await apiClient.getSupervisorApplications(userId, token);
      return response.data || [];
    },
    [userId]
  );
}

