'use client';

// lib/hooks/useStudentDashboard.ts
// Custom hook for fetching student dashboard data

import { useAuthenticatedFetch } from './useAuthenticatedFetch';
import { apiClient } from '@/lib/api/client';
import type { Student, Application, SupervisorCardData } from '@/types/database';

interface StudentDashboardData {
  profile: Student | null;
  applications: Application[];
  partnerApplications: Application[];
  supervisors: SupervisorCardData[];
}

/**
 * Hook for fetching student dashboard data
 * Fetches profile, applications, partner's applications, and available supervisors
 *
 * @param userId - The student's user ID
 * @returns Dashboard data with loading and error states
 */
export function useStudentDashboard(userId: string | null) {
  return useAuthenticatedFetch<StudentDashboardData>(
    async (token) => {
      if (!userId) {
        return { profile: null, applications: [], partnerApplications: [], supervisors: [] };
      }

      // First, fetch profile to get partnerId, along with other data
      const [profileResponse, applicationsResponse, supervisorsResponse] = await Promise.all([
        apiClient.getStudentById(userId, token),
        apiClient.getStudentApplications(userId, token),
        apiClient.getSupervisors(token, { availability: 'available' }),
      ]);

      const profile = profileResponse.data;

      // If student has a partner, fetch partner's profile and applications
      let partnerApplications: Application[] = [];
      if (profile?.partnerId) {
        try {
          const [partnerAppsResponse, partnerProfileResponse] = await Promise.all([
            apiClient.getStudentApplications(profile.partnerId, token),
            apiClient.getStudentById(profile.partnerId, token),
          ]);
          partnerApplications = partnerAppsResponse.data || [];
          // Populate partnerName from partner's profile if not already set
          if (!profile.partnerName && partnerProfileResponse.data) {
            profile.partnerName = partnerProfileResponse.data.fullName ||
              `${partnerProfileResponse.data.firstName} ${partnerProfileResponse.data.lastName}`.trim();
          }
        } catch {
          // Silently handle error - partner data is optional
        }
      }

      return {
        profile,
        applications: applicationsResponse.data || [],
        partnerApplications,
        supervisors: supervisorsResponse.data || [],
      };
    },
    [userId]
  );
}

