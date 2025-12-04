'use client';

// lib/hooks/useStudentDashboard.ts
// Custom hook for fetching student dashboard data

import { useAuthenticatedFetch } from './useAuthenticatedFetch';
import { apiClient } from '@/lib/api/client';
import type { Student, Application, SupervisorCardData } from '@/types/database';

interface StudentDashboardData {
  profile: Student | null;
  applications: Application[];
  supervisors: SupervisorCardData[];
}

/**
 * Hook for fetching student dashboard data
 * Fetches profile, applications, and available supervisors in parallel
 * 
 * @param userId - The student's user ID
 * @returns Dashboard data with loading and error states
 */
export function useStudentDashboard(userId: string | null) {
  return useAuthenticatedFetch<StudentDashboardData>(
    async (token) => {
      if (!userId) {
        return { profile: null, applications: [], supervisors: [] };
      }

      // Fetch all dashboard data in parallel
      const [profileResponse, applicationsResponse, supervisorsResponse] = await Promise.all([
        apiClient.getStudentById(userId, token),
        apiClient.getStudentApplications(userId, token),
        apiClient.getSupervisors(token, { available: true }),
      ]);

      return {
        profile: profileResponse.data,
        applications: applicationsResponse.data || [],
        supervisors: supervisorsResponse.data || [],
      };
    },
    [userId]
  );
}

