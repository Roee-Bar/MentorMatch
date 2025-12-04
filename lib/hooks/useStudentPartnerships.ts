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
 * @param partnerId - The student's current partner ID (if paired)
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

      // Fetch available students and partnership requests in parallel
      const [availableResponse, incomingResponse, outgoingResponse] = await Promise.all([
        apiClient.getAvailablePartners(token),
        apiClient.getPartnershipRequests(userId, 'incoming', token),
        apiClient.getPartnershipRequests(userId, 'outgoing', token),
      ]);

      // Fetch current partner details if paired
      let currentPartner = null;
      if (partnerId) {
        try {
          const partnerResponse = await apiClient.getPartnerDetails(partnerId, token);
          currentPartner = partnerResponse.data;
        } catch (error) {
          console.error('Error fetching partner details:', error);
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

