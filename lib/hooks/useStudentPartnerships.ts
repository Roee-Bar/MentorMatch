'use client';

// lib/hooks/useStudentPartnerships.ts
// Custom hook for fetching student partnership data

import { useAuthenticatedFetch } from './useAuthenticatedFetch';
import { apiClient } from '@/lib/api/client';
import type { Student, StudentPartnershipRequest } from '@/types/database';

interface StudentPartnershipData {
  availableStudents: Student[];
  incomingRequests: StudentPartnershipRequest[];
  outgoingRequests: StudentPartnershipRequest[];
  currentPartner: Student | null;
}

/**
 * Hook for fetching student partnership data
 * Fetches available students, partnership requests, and current partner details
 * 
 * @param userId - The student's user ID
 * @param partnerId - The student's current partner ID (if paired) - optional, will fetch if not provided
 * @returns Partnership data with loading and error states
 */
export function useStudentPartnerships(userId: string | null, partnerId?: string) {
  return useAuthenticatedFetch<StudentPartnershipData>(
    async (token) => {
      if (!userId) {
        return {
          availableStudents: [],
          incomingRequests: [],
          outgoingRequests: [],
          currentPartner: null,
        };
      }

      // If partnerId not provided, fetch student profile to get it (optimization)
      let actualPartnerId = partnerId;
      if (!actualPartnerId) {
        try {
          const studentResponse = await apiClient.getStudentById(userId, token);
          actualPartnerId = studentResponse.data?.partnerId;
        } catch (error) {
          // Silently handle error - will continue without partnerId
        }
      }

      // Skip fetching available students if student already has a partner (optimization)
      const availablePromise = actualPartnerId
        ? Promise.resolve({ success: true, data: [], count: 0 })
        : apiClient.getAvailablePartners(token);

      // Fetch partnership requests and available students in parallel
      const [availableResponse, incomingResponse, outgoingResponse] = await Promise.all([
        availablePromise,
        apiClient.getPartnershipRequests(userId, 'incoming', token),
        apiClient.getPartnershipRequests(userId, 'outgoing', token),
      ]);

      // Fetch current partner details if paired
      let currentPartner = null;
      if (actualPartnerId) {
        try {
          const partnerResponse = await apiClient.getPartnerDetails(actualPartnerId, token);
          currentPartner = partnerResponse.data;
        } catch (error) {
          // Silently handle error - will continue without partner details
        }
      }

      return {
        availableStudents: availableResponse.data || [],
        incomingRequests: incomingResponse.data || [],
        outgoingRequests: outgoingResponse.data || [],
        currentPartner,
      };
    },
    [userId, partnerId]
  );
}

