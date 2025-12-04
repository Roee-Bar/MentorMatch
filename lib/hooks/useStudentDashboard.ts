// lib/hooks/useStudentDashboard.ts
// Custom hook for fetching student dashboard data

'use client';

import { useAuthenticatedFetch } from './useAuthenticatedFetch';
import { apiClient } from '@/lib/api/client';
import type { Student, ApplicationCardData, SupervisorCardData } from '@/types/database';

export interface StudentDashboardData {
  profile: Student | null;
  applications: ApplicationCardData[];
  supervisors: SupervisorCardData[];
}

/**
 * Custom hook that fetches all data needed for the student dashboard.
 * 
 * Fetches in parallel:
 * - Student profile
 * - Student applications
 * - Available supervisors
 * 
 * @param userId - The student's user ID
 * @returns { data, loading, error, refetch } - Dashboard data and states
 * 
 * @example
 * const { data: dashboardData, loading, error, refetch } = useStudentDashboard(userId);
 * if (loading) return <LoadingSpinner />;
 * if (error) return <ErrorMessage error={error} />;
 * // Use dashboardData.profile, dashboardData.applications, dashboardData.supervisors
 */
export function useStudentDashboard(userId: string | null) {
  return useAuthenticatedFetch<StudentDashboardData>(
    async (token) => {
      if (!userId) {
        return {
          profile: null,
          applications: [],
          supervisors: []
        };
      }

      // Parallel fetch all dashboard data
      const [profileRes, applicationsRes, supervisorsRes] = await Promise.all([
        apiClient.getStudentById(userId, token),
        apiClient.getStudentApplications(userId, token),
        apiClient.getSupervisors(token, { available: true })
      ]);

      return {
        profile: profileRes.data || null,
        applications: applicationsRes.data || [],
        supervisors: supervisorsRes.data || []
      };
    },
    [userId]
  );
}

