'use client';

import { useActionHandler, type ActionConfig } from './useActionHandler';
import { apiClient } from '@/lib/api/client';
import type { ApplicationStatus } from '@/types/database';

export interface SupervisorApplicationActionsConfig extends ActionConfig {}

const statusMessages: Record<ApplicationStatus, string> = {
  approved: 'Application approved successfully!',
  rejected: 'Application rejected.',
  revision_requested: 'Revision requested. The student will be notified.',
  pending: 'Application status updated.',
};

/**
 * Hook for managing supervisor application actions (approve, reject, request revision)
 * Provides loading states per action and callbacks for success/error handling
 * 
 * @param config - Configuration with userId and callback functions
 * @returns Action functions and loading state checker
 */
export function useSupervisorApplicationActions(config: SupervisorApplicationActionsConfig) {
  const handler = useActionHandler(
    { ...config, preventUnmountUpdates: true },
    {
      updateApplicationStatus: {
        key: (params: { applicationId: string; status: ApplicationStatus }) => 
          `status-${params.applicationId}-${params.status}`,
        handler: async (
          params: { applicationId: string; status: ApplicationStatus; feedback?: string },
          token: string
        ) => {
          await apiClient.updateApplicationStatus(
            params.applicationId,
            params.status,
            params.feedback || '',
            token
          );
        },
        successMessage: (params: { status: ApplicationStatus }) => 
          statusMessages[params.status] || 'Application status updated.',
        rethrowError: true,
      },
    }
  );

  /**
   * Approve an application
   */
  const approveApplication = async (applicationId: string, feedback?: string) => {
    return handler.updateApplicationStatus({ applicationId, status: 'approved', feedback });
  };

  /**
   * Reject an application (feedback required)
   */
  const rejectApplication = async (applicationId: string, feedback: string) => {
    if (!feedback?.trim()) {
      config.onError?.('Feedback is required when rejecting an application');
      throw new Error('Feedback is required when rejecting an application');
    }
    return handler.updateApplicationStatus({ applicationId, status: 'rejected', feedback });
  };

  /**
   * Request revision on an application (feedback required)
   */
  const requestRevision = async (applicationId: string, feedback: string) => {
    if (!feedback?.trim()) {
      config.onError?.('Feedback is required when requesting revision');
      throw new Error('Feedback is required when requesting revision');
    }
    return handler.updateApplicationStatus({ applicationId, status: 'revision_requested', feedback });
  };

  return {
    updateApplicationStatus: handler.updateApplicationStatus,
    approveApplication,
    rejectApplication,
    requestRevision,
    isLoading: handler.isLoading,
    isLoadingAny: handler.isLoadingAny,
  };
}
