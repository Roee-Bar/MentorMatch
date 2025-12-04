// lib/hooks/useStudentPartnerships.ts
// Custom hook for fetching student partnership data

'use client';

import { useAuthenticatedFetch } from './useAuthenticatedFetch';
import { apiClient } from '@/lib/api/client';
import type { StudentCardData, StudentPartnershipRequest } from '@/types/database';

export interface StudentPartnershipData {
  availableStudents: StudentCardData[];
  incomingRequests: StudentPartnershipRequest[];
  outgoingRequests: StudentPartnershipRequest[];
  currentPartner: StudentCardData | null;
}

/**
 * Custom hook that fetches all partnership-related data for a student.
 * 
 * Fetches in parallel:
 * - Available students for partnership
 * - Incoming partnership requests
 * - Outgoing partnership requests
 * - Current partner details (if partnerId is provided)
 * 
 * @param userId - The student's user ID
 * @param partnerId - Optional partner ID to fetch partner details
 * @returns { data, loading, error, refetch } - Partnership data and states
 * 
 * @example
 * const { data: partnershipData, loading, refetch } = useStudentPartnerships(userId, partnerId);
 * if (loading) return <LoadingSpinner />;
 * // Use partnershipData.availableStudents, partnershipData.currentPartner, etc.
 */
export function useStudentPartnerships(
  userId: string | null, 
  partnerId?: string | null
) {
  return useAuthenticatedFetch<StudentPartnershipData>(
    async (token) => {
      if (!userId) {
        return {
          availableStudents: [],
          incomingRequests: [],
          outgoingRequests: [],
          currentPartner: null
        };
      }

      try {
        // Parallel fetch partnership data
        const [availableRes, incomingRes, outgoingRes] = await Promise.all([
          apiClient.getAvailablePartners(token),
          apiClient.getPartnershipRequests(userId, 'incoming', token),
          apiClient.getPartnershipRequests(userId, 'outgoing', token)
        ]);

        // Fetch current partner details if partnerId exists
        let currentPartner: StudentCardData | null = null;
        if (partnerId) {
          try {
            const partnerRes = await apiClient.getPartnerDetails(partnerId, token);
            currentPartner = partnerRes.data;
          } catch (partnerError) {
            console.error('Error fetching partner details:', partnerError);
            // Don't fail the entire fetch if partner details fail
            currentPartner = null;
          }
        }

        return {
          availableStudents: availableRes.data || [],
          incomingRequests: incomingRes.data || [],
          outgoingRequests: outgoingRes.data || [],
          currentPartner
        };
      } catch (error) {
        console.error('Error fetching partnership data:', error);
        // Graceful degradation: return empty data rather than failing
        return {
          availableStudents: [],
          incomingRequests: [],
          outgoingRequests: [],
          currentPartner: null
        };
      }
    },
    [userId, partnerId]
  );
}

