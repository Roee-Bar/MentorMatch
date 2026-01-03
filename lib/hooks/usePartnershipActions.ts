'use client';

import { useActionHandler, type ActionConfig } from './useActionHandler';
import { apiClient } from '@/lib/api/client';

export interface PartnershipActionsConfig extends ActionConfig {}

/**
 * Hook for managing partnership actions (request, accept, reject, cancel, unpair)
 * Provides loading states per action and callbacks for success/error handling
 * 
 * @param config - Configuration with userId and callback functions
 * @returns Action functions and loading state checker
 */
export function usePartnershipActions(config: PartnershipActionsConfig) {
  return useActionHandler(config, {
    requestPartnership: {
      key: (targetStudentId: string) => `partnership-${targetStudentId}`,
      handler: async (targetStudentId: string, token: string) => {
        await apiClient.createPartnershipRequest({ targetStudentId }, token);
      },
      successMessage: 'Partnership request sent successfully!',
    },
    acceptPartnership: {
      key: (requestId: string) => `accept-${requestId}`,
      handler: async (requestId: string, token: string) => {
        await apiClient.respondToPartnershipRequest(requestId, 'accept', token);
      },
      successMessage: 'Partnership request accepted!',
      requiresUserId: false, // Only needs token
    },
    rejectPartnership: {
      key: (requestId: string) => `reject-${requestId}`,
      handler: async (requestId: string, token: string) => {
        await apiClient.respondToPartnershipRequest(requestId, 'reject', token);
      },
      successMessage: 'Partnership request rejected',
      requiresUserId: false,
    },
    cancelRequest: {
      key: (requestId: string) => `cancel-${requestId}`,
      handler: async (requestId: string, token: string) => {
        await apiClient.cancelPartnershipRequest(requestId, token);
      },
      successMessage: 'Partnership request cancelled',
      requiresUserId: false,
    },
    unpair: {
      key: 'unpair',
      handler: async (_params: {}, token: string) => {
        await apiClient.unpairFromPartner(token);
      },
      successMessage: 'Successfully unpaired from partner',
      requiresUserId: false,
    },
  });
}
