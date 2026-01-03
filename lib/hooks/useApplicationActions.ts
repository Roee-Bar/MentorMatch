'use client';

// lib/hooks/useApplicationActions.ts
// Custom hook for application action handlers

import { useActionHandler, type ActionConfig } from './useActionHandler';
import { apiClient } from '@/lib/api/client';

export interface ApplicationActionsConfig extends ActionConfig {}

/**
 * Hook for managing application actions (submit, withdraw)
 * Provides loading states per action and callbacks for success/error handling
 * 
 * @param config - Configuration with userId and callback functions
 * @returns Action functions and loading state checker
 */
export function useApplicationActions(config: ApplicationActionsConfig) {
  return useActionHandler(config, {
    submitApplication: {
      key: (params: any) => `submit-${params.supervisorId}`,
      handler: async (applicationData: any, token: string) => {
        await apiClient.createApplication(applicationData, token);
      },
      successMessage: 'Application submitted successfully!',
      rethrowError: true, // Keep modal open on error
    },
    withdrawApplication: {
      key: (applicationId: string) => `withdraw-${applicationId}`,
      handler: async (applicationId: string, token: string) => {
        await apiClient.deleteApplication(applicationId, token);
      },
      successMessage: 'Application withdrawn successfully',
    },
  });
}
