'use client';

// lib/hooks/useSupervisorDashboard.ts
// Custom hook for fetching supervisor dashboard data

import { useAuthenticatedFetch } from './useAuthenticatedFetch';
import { apiClient } from '@/lib/api/client';
import type { Supervisor, Application, Project } from '@/types/database';

interface SupervisorDashboardData {
  supervisor: Supervisor | null;
  applications: Application[];
  projects: Project[];
}

/**
 * Hook for fetching supervisor dashboard data
 * Fetches supervisor profile, applications, and projects in parallel
 * 
 * @param userId - The supervisor's user ID
 * @returns Dashboard data with loading and error states
 */
export function useSupervisorDashboard(userId: string | null) {
  return useAuthenticatedFetch<SupervisorDashboardData>(
    async (token) => {
      if (!userId) {
        return { supervisor: null, applications: [], projects: [] };
      }

      // Fetch all dashboard data in parallel
      const [supervisorResponse, applicationsResponse, projectsResponse] = await Promise.all([
        apiClient.getSupervisorById(userId, token),
        apiClient.getSupervisorApplications(userId, token),
        apiClient.getSupervisorProjects(userId, token),
      ]);

      return {
        supervisor: supervisorResponse.data,
        applications: applicationsResponse.data || [],
        projects: projectsResponse.data || [],
      };
    },
    [userId]
  );
}

