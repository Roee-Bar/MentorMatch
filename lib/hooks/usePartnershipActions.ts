'use client';

// lib/hooks/usePartnershipActions.ts
// Custom hook for partnership action handlers

import { useState } from 'react';
import { auth } from '@/lib/firebase';
import { apiClient } from '@/lib/api/client';

interface PartnershipActionsConfig {
  userId: string | null;
  onRefresh?: () => Promise<void>;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

/**
 * Hook for managing partnership actions (request, accept, reject, cancel, unpair)
 * Provides loading states per action and callbacks for success/error handling
 * 
 * @param config - Configuration with userId and callback functions
 * @returns Action functions and loading state checker
 */
export function usePartnershipActions({
  userId,
  onRefresh,
  onSuccess,
  onError,
}: PartnershipActionsConfig) {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const setLoading = (key: string, value: boolean) => {
    setLoadingStates((prev) => ({ ...prev, [key]: value }));
  };

  const requestPartnership = async (targetStudentId: string) => {
    const key = `partnership-${targetStudentId}`;
    setLoading(key, true);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token || !userId) throw new Error('Not authenticated');

      await apiClient.createPartnershipRequest({ targetStudentId }, token);
      
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

      await apiClient.respondToPartnershipRequest(requestId, 'accept', token);
      
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

      await apiClient.respondToPartnershipRequest(requestId, 'reject', token);
      
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

      await apiClient.cancelPartnershipRequest(requestId, token);
      
      onSuccess?.('Partnership request cancelled');
      await onRefresh?.();
    } catch (error: any) {
      onError?.(error.message || 'Failed to cancel partnership request');
    } finally {
      setLoading(key, false);
    }
  };

  const unpair = async () => {
    const key = 'unpair';
    setLoading(key, true);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');

      await apiClient.unpairFromPartner(token);
      
      onSuccess?.('Successfully unpaired from partner');
      await onRefresh?.();
    } catch (error: any) {
      onError?.(error.message || 'Failed to unpair from partner');
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
    unpair,
    isLoading,
  };
}

