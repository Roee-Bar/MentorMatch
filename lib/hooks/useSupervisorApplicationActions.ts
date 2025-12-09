'use client';

// lib/hooks/useSupervisorApplicationActions.ts
// Custom hook for supervisor application action handlers

import { useState, useRef, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { apiClient } from '@/lib/api/client';
import type { ApplicationStatus } from '@/types/database';

interface SupervisorApplicationActionsConfig {
  userId: string | null;
  onRefresh?: () => Promise<void>;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

/**
 * Hook for managing supervisor application actions (approve, reject, request revision)
 * Provides loading states per action and callbacks for success/error handling
 * 
 * @param config - Configuration with userId and callback functions
 * @returns Action functions and loading state checker
 */
export function useSupervisorApplicationActions({
  userId,
  onRefresh,
  onSuccess,
  onError,
}: SupervisorApplicationActionsConfig) {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const mountedRef = useRef(true);

  // Cleanup on unmount to prevent state updates after unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const setLoading = (key: string, value: boolean) => {
    if (mountedRef.current) {
      setLoadingStates((prev) => ({ ...prev, [key]: value }));
    }
  };

  /**
   * Update application status (approve, reject, request_revision)
   */
  const updateApplicationStatus = async (
    applicationId: string,
    status: ApplicationStatus,
    feedback?: string
  ) => {
    const key = `status-${applicationId}-${status}`;
    setLoading(key, true);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token || !userId) throw new Error('Not authenticated');

      await apiClient.updateApplicationStatus(applicationId, status, feedback || '', token);
      
      const statusMessages: Record<ApplicationStatus, string> = {
        approved: 'Application approved successfully!',
        rejected: 'Application rejected.',
        revision_requested: 'Revision requested. The student will be notified.',
        pending: 'Application status updated.',
      };
      
      onSuccess?.(statusMessages[status] || 'Application status updated.');
      await onRefresh?.();
    } catch (error: any) {
      onError?.(error.message || 'Failed to update application status');
      throw error;
    } finally {
      setLoading(key, false);
    }
  };

  /**
   * Approve an application
   */
  const approveApplication = async (applicationId: string, feedback?: string) => {
    return updateApplicationStatus(applicationId, 'approved', feedback);
  };

  /**
   * Reject an application (feedback required)
   */
  const rejectApplication = async (applicationId: string, feedback: string) => {
    if (!feedback?.trim()) {
      onError?.('Feedback is required when rejecting an application');
      throw new Error('Feedback is required when rejecting an application');
    }
    return updateApplicationStatus(applicationId, 'rejected', feedback);
  };

  /**
   * Request revision on an application (feedback required)
   */
  const requestRevision = async (applicationId: string, feedback: string) => {
    if (!feedback?.trim()) {
      onError?.('Feedback is required when requesting revision');
      throw new Error('Feedback is required when requesting revision');
    }
    return updateApplicationStatus(applicationId, 'revision_requested', feedback);
  };

  const isLoading = (key: string) => loadingStates[key] || false;
  
  const isLoadingAny = () => Object.values(loadingStates).some(v => v);

  return {
    updateApplicationStatus,
    approveApplication,
    rejectApplication,
    requestRevision,
    isLoading,
    isLoadingAny,
  };
}

