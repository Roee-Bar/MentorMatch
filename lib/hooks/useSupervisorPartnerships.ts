'use client';

// lib/hooks/useSupervisorPartnerships.ts
// Custom hook for fetching supervisor partnership data (project-based model)

import { useAuthenticatedFetch } from './useAuthenticatedFetch';
import { apiClient } from '@/lib/api/client';
import type { Supervisor, SupervisorPartnershipRequest, Project } from '@/types/database';

interface SupervisorPartnershipData {
  availableSupervisors: Supervisor[];
  incomingRequests: SupervisorPartnershipRequest[];
  outgoingRequests: SupervisorPartnershipRequest[];
  activePartnerships: Project[]; // Projects where supervisor is co-supervisor
}

/**
 * Hook for fetching supervisor partnership data
 * Fetches available supervisors, partnership requests, and active partnerships
 * 
 * @param userId - The supervisor's user ID
 * @returns Partnership data with loading and error states
 */
export function useSupervisorPartnerships(userId: string | null) {
  return useAuthenticatedFetch<SupervisorPartnershipData>(
    async (token) => {
      if (!userId) {
        return {
          availableSupervisors: [],
          incomingRequests: [],
          outgoingRequests: [],
          activePartnerships: [],
        };
      }

      // Fetch partnership requests and available supervisors in parallel
      const [availableResponse, incomingResponse, outgoingResponse, partnershipsResponse] = await Promise.all([
        apiClient.getAvailableSupervisorPartners(token),
        apiClient.getSupervisorPartnershipRequests(userId, 'incoming', token),
        apiClient.getSupervisorPartnershipRequests(userId, 'outgoing', token),
        apiClient.getSupervisorPartnerships(token), // Get active partnerships
      ]);

      return {
        availableSupervisors: availableResponse.data || [],
        incomingRequests: incomingResponse.data || [],
        outgoingRequests: outgoingResponse.data || [],
        activePartnerships: partnershipsResponse.data || [],
      };
    },
    [userId]
  );
}

/**
 * Hook for fetching partnership data for a specific project
 * 
 * @param projectId - The project ID
 * @returns Partnership request data for the project
 */
export function useProjectPartnership(projectId: string | null) {
  return useAuthenticatedFetch<{
    partnershipRequest: SupervisorPartnershipRequest | null;
  }>(
    async (token) => {
      if (!projectId) {
        return { partnershipRequest: null };
      }

      // TODO: Add API endpoint to get partnership request for a project
      // For now, return null
      return { partnershipRequest: null };
    },
    [projectId]
  );
}
