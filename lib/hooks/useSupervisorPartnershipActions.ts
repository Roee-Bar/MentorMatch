'use client';

// lib/hooks/useSupervisorPartnershipActions.ts
// Custom hook for supervisor partnership action handlers (project-based model)

import { useState } from 'react';
import { auth } from '@/lib/firebase';
import { apiClient } from '@/lib/api/client';

interface SupervisorPartnershipActionsConfig {
  userId: string | null;
  onRefresh?: () => Promise<void>;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

/**
 * Hook for managing supervisor partnership actions (request, accept, reject, cancel, remove co-supervisor)
 * Provides loading states per action and callbacks for success/error handling
 * 
 * @param config - Configuration with userId and callback functions
 * @returns Action functions and loading state checker
 */
export function useSupervisorPartnershipActions({
  userId,
  onRefresh,
  onSuccess,
  onError,
}: SupervisorPartnershipActionsConfig) {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const setLoading = (key: string, value: boolean) => {
    setLoadingStates((prev) => ({ ...prev, [key]: value }));
  };

  const requestPartnership = async (targetSupervisorId: string, projectId: string) => {
    const key = `partnership-${targetSupervisorId}-${projectId}`;
    setLoading(key, true);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token || !userId) throw new Error('Not authenticated');

      await apiClient.createSupervisorPartnershipRequest({ targetSupervisorId, projectId }, token);
      
      onSuccess?.('Partnership request sent successfully!');
      await onRefresh?.();
    } catch (error: any) {
      onError?.(error.message || 'Failed to send partnership request');
    } finally {
      setLoading(key, false);
    }
  };

  const acceptPartnership = async (requestId: string) => {
    const key = `accept-${requestId}`;
    setLoading(key, true);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');

      await apiClient.respondToSupervisorPartnershipRequest(requestId, 'accept', token);
      
      onSuccess?.('Partnership request accepted!');
      await onRefresh?.();
    } catch (error: any) {
      onError?.(error.message || 'Failed to accept partnership request');
    } finally {
      setLoading(key, false);
    }
  };

  const rejectPartnership = async (requestId: string) => {
    const key = `reject-${requestId}`;
    setLoading(key, true);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');

      await apiClient.respondToSupervisorPartnershipRequest(requestId, 'reject', token);
      
      onSuccess?.('Partnership request rejected');
      await onRefresh?.();
    } catch (error: any) {
      onError?.(error.message || 'Failed to reject partnership request');
    } finally {
      setLoading(key, false);
    }
  };

  const cancelRequest = async (requestId: string) => {
    const key = `cancel-${requestId}`;
    setLoading(key, true);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');

      await apiClient.cancelSupervisorPartnershipRequest(requestId, token);
      
      onSuccess?.('Partnership request cancelled');
      await onRefresh?.();
    } catch (error: any) {
      onError?.(error.message || 'Failed to cancel partnership request');
    } finally {
      setLoading(key, false);
    }
  };

  const removeCoSupervisor = async (projectId: string) => {
    const key = `remove-${projectId}`;
    setLoading(key, true);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');

      await apiClient.removeCoSupervisor(projectId, token);
      
      onSuccess?.('Co-supervisor removed successfully');
      await onRefresh?.();
    } catch (error: any) {
      onError?.(error.message || 'Failed to remove co-supervisor');
    } finally {
      setLoading(key, false);
    }
  };

  const isLoading = (key: string) => loadingStates[key] || false;

  return {
    requestPartnership,
    acceptPartnership,
    rejectPartnership,
    cancelRequest,
    removeCoSupervisor,
    isLoading,
  };
}
