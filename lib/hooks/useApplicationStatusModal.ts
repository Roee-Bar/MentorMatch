'use client';

// lib/hooks/useApplicationStatusModal.ts
// Custom hook for managing application status modal state and actions

import { useState } from 'react';
import { useSupervisorApplicationActions } from './useSupervisorApplicationActions';
import { UI_CONSTANTS } from '@/lib/constants';
import type { Application, ApplicationStatus } from '@/types/database';

interface UseApplicationStatusModalConfig {
  applications: Application[];
  userId: string | null;
  onRefresh: () => Promise<void>;
}

interface UseApplicationStatusModalReturn {
  // Modal state
  selectedApplication: Application | null;
  showStatusModal: boolean;
  // Messages
  successMessage: string | null;
  errorMessage: string | null;
  // Actions
  handleReviewApplication: (applicationId: string) => void;
  handleUpdateStatus: (applicationId: string, status: ApplicationStatus, feedback?: string) => Promise<void>;
  closeModal: () => void;
  // Loading state
  isLoading: boolean;
}

/**
 * Hook for managing application status modal and its associated actions
 * Encapsulates modal state, message handling, and supervisor application actions
 * 
 * @param config - Configuration with applications array, userId, and refresh callback
 * @returns Modal state, message state, action handlers, and loading state
 */
export function useApplicationStatusModal({
  applications,
  userId,
  onRefresh,
}: UseApplicationStatusModalConfig): UseApplicationStatusModalReturn {
  // Modal state
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);

  // Message state
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Application actions hook
  const applicationActions = useSupervisorApplicationActions({
    userId,
    onRefresh,
    onSuccess: (msg) => {
      setSuccessMessage(msg);
      setTimeout(() => setSuccessMessage(null), UI_CONSTANTS.MESSAGE_DISPLAY_DURATION);
    },
    onError: (msg) => {
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(null), UI_CONSTANTS.MESSAGE_DISPLAY_DURATION);
    },
  });

  /**
   * Opens the status modal for a specific application
   */
  const handleReviewApplication = (applicationId: string) => {
    const app = applications.find(a => a.id === applicationId);
    if (app) {
      setSelectedApplication(app);
      setShowStatusModal(true);
    }
  };

  /**
   * Updates application status and closes the modal
   */
  const handleUpdateStatus = async (
    applicationId: string,
    status: ApplicationStatus,
    feedback?: string
  ) => {
    await applicationActions.updateApplicationStatus({ applicationId, status, feedback });
    setShowStatusModal(false);
    setSelectedApplication(null);
  };

  /**
   * Closes the modal and resets selection
   */
  const closeModal = () => {
    setShowStatusModal(false);
    setSelectedApplication(null);
  };

  return {
    selectedApplication,
    showStatusModal,
    successMessage,
    errorMessage,
    handleReviewApplication,
    handleUpdateStatus,
    closeModal,
    isLoading: applicationActions.isLoadingAny(),
  };
}

