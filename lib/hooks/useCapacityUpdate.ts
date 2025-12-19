'use client';

// lib/hooks/useCapacityUpdate.ts
// Custom hook for managing capacity update success handling and retry logic

import { useState } from 'react';
import { UI_CONSTANTS } from '@/lib/constants';

interface UseCapacityUpdateConfig {
  refetch: () => Promise<void>;
}

interface UseCapacityUpdateReturn {
  successMessage: string | null;
  error: string | null;
  handleCapacityUpdateSuccess: () => Promise<void>;
}

// Retry configuration constants
const RETRY_CONFIG = {
  maxAttempts: 3,
  delays: [300, 600, 900], // ms - exponential backoff
  initialDelay: 150, // Wait for Firestore propagation
  stateUpdateDelay: 50, // Wait for state to update after refetch
} as const;

/**
 * Hook for managing capacity update success handling
 * Handles retry logic with exponential backoff for data refresh
 * 
 * @param config - Configuration with refetch callback
 * @returns Success/error messages and handler function
 */
export function useCapacityUpdate({ refetch }: UseCapacityUpdateConfig): UseCapacityUpdateReturn {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCapacityUpdateSuccess = async () => {
    setSuccessMessage('Supervisor capacity updated successfully!');
    setTimeout(() => setSuccessMessage(null), UI_CONSTANTS.MESSAGE_DISPLAY_DURATION);
    setError(null);

    // Wait for Firestore propagation
    await new Promise(resolve => setTimeout(resolve, RETRY_CONFIG.initialDelay));

    // Retry logic with exponential backoff
    let attempts = 0;
    while (attempts < RETRY_CONFIG.maxAttempts) {
      try {
        await refetch();
        
        // Wait a bit for state to update after refetch
        await new Promise(resolve => setTimeout(resolve, RETRY_CONFIG.stateUpdateDelay));
        
        attempts++;
        
        // If this is the last attempt, break regardless
        if (attempts >= RETRY_CONFIG.maxAttempts) {
          break;
        }
        
        // Wait before retrying with exponential backoff
        await new Promise(resolve => setTimeout(resolve, RETRY_CONFIG.delays[attempts - 1]));
      } catch (err: any) {
        attempts++;
        if (attempts >= RETRY_CONFIG.maxAttempts) {
          // All retry attempts failed
          setError('Failed to refresh statistics. Please refresh the page manually or click Retry below.');
          break;
        }
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, RETRY_CONFIG.delays[attempts - 1] || 300));
      }
    }
  };

  return { successMessage, error, handleCapacityUpdateSuccess };
}

