'use client';

// lib/hooks/useApplicationActions.ts
// Custom hook for application action handlers

import { useState } from 'react';
import { auth } from '@/lib/firebase';
import { apiClient } from '@/lib/api/client';

interface ApplicationActionsConfig {
  userId: string | null;
  onRefresh?: () => Promise<void>;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

/**
 * Hook for managing application actions (submit, withdraw)
 * Provides loading states per action and callbacks for success/error handling
 * 
 * @param config - Configuration with userId and callback functions
 * @returns Action functions and loading state checker
 */
export function useApplicationActions({
  userId,
  onRefresh,
  onSuccess,
  onError,
}: ApplicationActionsConfig) {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const setLoading = (key: string, value: boolean) => {
    setLoadingStates((prev) => ({ ...prev, [key]: value }));
  };

  const submitApplication = async (applicationData: any) => {
    const key = `submit-${applicationData.supervisorId}`;
    setLoading(key, true);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token || !userId) throw new Error('Not authenticated');

      await apiClient.createApplication(applicationData, token);
      
      onSuccess?.('Application submitted successfully!');
      await onRefresh?.();
    } catch (error: any) {
      onError?.(error.message || 'Failed to submit application');
      throw error; // Re-throw to allow component to handle (e.g., keep modal open)
    } finally {
      setLoading(key, false);
    }
  };

  const withdrawApplication = async (applicationId: string) => {
    const key = `withdraw-${applicationId}`;
    setLoading(key, true);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');

      await apiClient.deleteApplication(applicationId, token);
      
      onSuccess?.('Application withdrawn successfully');
      await onRefresh?.();
    } catch (error: any) {
      onError?.(error.message || 'Failed to withdraw application');
    } finally {
      setLoading(key, false);
    }
  };

  const isLoading = (key: string) => loadingStates[key] || false;

  return {
    submitApplication,
    withdrawApplication,
    isLoading,
  };
}

