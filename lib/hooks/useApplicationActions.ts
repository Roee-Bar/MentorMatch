// lib/hooks/useApplicationActions.ts
// Custom hook for handling application actions (submit, withdraw)

'use client';

import { useLoadingState } from './useLoadingState';
import { apiClient } from '@/lib/api/client';
import { auth } from '@/lib/firebase';

interface UseApplicationActionsOptions {
  userId: string | null;
  onRefresh: () => Promise<void>;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

/**
 * Custom hook that provides application action handlers with centralized
 * error handling, loading states, and automatic data refresh.
 * 
 * @param options - Configuration object with userId, callbacks for refresh/success/error
 * @returns Application action functions and loading state checker
 * 
 * @example
 * const applicationActions = useApplicationActions({
 *   userId,
 *   onRefresh: refetchDashboard,
 *   onSuccess: (msg) => setSuccessMessage(msg),
 *   onError: (msg) => setError(msg)
 * });
 * 
 * // Use in component
 * <button onClick={() => applicationActions.withdrawApplication(appId)}>
 *   Withdraw
 * </button>
 */
export function useApplicationActions({
  userId,
  onRefresh,
  onSuccess,
  onError
}: UseApplicationActionsOptions) {
  const { startLoading, stopLoading, isLoading } = useLoadingState();

  return {
    /**
     * Submit a new application
     * Note: Throws error for modal error handling, but also calls onError
     */
    submitApplication: async (applicationData: any) => {
      startLoading('submit-application');
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) throw new Error('Not authenticated');

        await apiClient.createApplication(applicationData, token);
        await onRefresh();
        onSuccess('Application submitted successfully!');
      } catch (error: any) {
        const errorMessage = error.message || 'Failed to submit application';
        onError(errorMessage);
        throw error; // Re-throw for modal error handling
      } finally {
        stopLoading('submit-application');
      }
    },

    /**
     * Withdraw an existing application
     * Includes confirmation dialog
     */
    withdrawApplication: async (applicationId: string) => {
      if (!confirm('Are you sure you want to withdraw this application? This action cannot be undone.')) {
        return;
      }

      const loadingKey = `withdraw-${applicationId}`;
      startLoading(loadingKey);
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) throw new Error('Not authenticated');

        await apiClient.deleteApplication(applicationId, token);
        await onRefresh();
        onSuccess('Application withdrawn successfully!');
      } catch (error: any) {
        onError(error.message || 'Failed to withdraw application');
      } finally {
        stopLoading(loadingKey);
      }
    },

    /**
     * Check if a specific action is currently loading
     */
    isLoading
  };
}

