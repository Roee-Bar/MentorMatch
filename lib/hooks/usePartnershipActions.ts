// lib/hooks/usePartnershipActions.ts
// Custom hook for handling partnership actions (request, accept, reject, cancel, unpair)

'use client';

import { useLoadingState } from './useLoadingState';
import { apiClient } from '@/lib/api/client';
import { auth } from '@/lib/firebase';

interface UsePartnershipActionsOptions {
  userId: string | null;
  onRefresh: () => Promise<void>;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

/**
 * Custom hook that provides partnership action handlers with centralized
 * error handling, loading states, and automatic data refresh.
 * 
 * @param options - Configuration object with userId, callbacks for refresh/success/error
 * @returns Partnership action functions and loading state checker
 * 
 * @example
 * const partnershipActions = usePartnershipActions({
 *   userId,
 *   onRefresh: refetchPartnerships,
 *   onSuccess: (msg) => setSuccessMessage(msg),
 *   onError: (msg) => setError(msg)
 * });
 * 
 * // Use in component
 * <button onClick={() => partnershipActions.requestPartnership(studentId)}>
 *   Request Partnership
 * </button>
 */
export function usePartnershipActions({
  userId,
  onRefresh,
  onSuccess,
  onError
}: UsePartnershipActionsOptions) {
  const { startLoading, stopLoading, isLoading } = useLoadingState();

  /**
   * Generic action executor that handles token retrieval, error handling,
   * loading states, and automatic refresh after success
   */
  const executeAction = async (
    key: string,
    action: (token: string) => Promise<void>,
    successMessage: string
  ) => {
    startLoading(key);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');

      await action(token);
      await onRefresh(); // Auto-refetch after success
      onSuccess(successMessage);
    } catch (error: any) {
      onError(error.message || 'Action failed');
    } finally {
      stopLoading(key);
    }
  };

  return {
    /**
     * Request partnership with another student
     */
    requestPartnership: async (targetStudentId: string) => {
      await executeAction(
        `partnership-${targetStudentId}`,
        (token) => apiClient.createPartnershipRequest({ targetStudentId }, token),
        'Partnership request sent successfully!'
      );
    },

    /**
     * Accept an incoming partnership request
     */
    acceptPartnership: async (requestId: string) => {
      await executeAction(
        `accept-${requestId}`,
        (token) => apiClient.respondToPartnershipRequest(requestId, 'accept', token),
        'Partnership accepted! You are now paired.'
      );
    },

    /**
     * Reject an incoming partnership request
     */
    rejectPartnership: async (requestId: string) => {
      await executeAction(
        `reject-${requestId}`,
        (token) => apiClient.respondToPartnershipRequest(requestId, 'reject', token),
        'Partnership request rejected.'
      );
    },

    /**
     * Cancel an outgoing partnership request
     */
    cancelRequest: async (requestId: string) => {
      await executeAction(
        `cancel-${requestId}`,
        (token) => apiClient.cancelPartnershipRequest(requestId, token),
        'Partnership request cancelled.'
      );
    },

    /**
     * Unpair from current partner
     */
    unpair: async () => {
      if (!confirm('Are you sure you want to unpair from your partner? This action cannot be undone.')) {
        return;
      }

      await executeAction(
        'unpair',
        (token) => apiClient.unpairFromPartner(token),
        'Successfully unpaired from your partner.'
      );
    },

    /**
     * Check if a specific action is currently loading
     */
    isLoading
  };
}

