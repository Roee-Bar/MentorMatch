'use client';

// lib/hooks/useAdminDashboard.ts
// Custom hook for fetching admin dashboard data

import { useAuthenticatedFetch } from './useAuthenticatedFetch';
import { apiClient } from '@/lib/api/client';
import type { Supervisor, DashboardStats } from '@/types/database';

interface AdminDashboardData {
  stats: DashboardStats | null;
  supervisors: Supervisor[];
}

/**
 * Hook for fetching admin dashboard data
 * Fetches admin stats and supervisors list
 * 
 * @returns Dashboard data with loading and error states
 */
export function useAdminDashboard() {
  return useAuthenticatedFetch<AdminDashboardData>(
    async (token) => {
      // Fetch admin stats and supervisors in parallel
      const [statsResponse, supervisorsResponse] = await Promise.all([
        apiClient.getAdminStats(token),
        apiClient.getAdminSupervisors(token),
      ]);

      return {
        stats: statsResponse.data || null,
        supervisors: supervisorsResponse.data || [],
      };
    },
    []
  );
}







