// lib/hooks/useEmailVerification.ts
// Custom hook for email verification status checking and polling

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { auth } from '@/lib/firebase';
import { EMAIL_VERIFICATION } from '@/lib/constants';

interface UseEmailVerificationReturn {
  isVerified: boolean;
  isChecking: boolean;
  userEmail: string | null;
  checkStatus: () => Promise<void>;
}

/**
 * Custom hook for managing email verification status
 * Handles status checking, polling with exponential backoff, and real-time updates via auth state changes
 * 
 * Features:
 * - Exponential backoff: Polling interval increases over time (5s → 10s → 20s → 40s)
 * - Timeout: Stops polling after MAX_POLLING_DURATION_MS (5 minutes)
 * - Memory leak prevention: Uses refs to avoid unnecessary re-renders
 * 
 * @param pollInterval - Optional initial polling interval in milliseconds (defaults to EMAIL_VERIFICATION.STATUS_CHECK_INTERVAL)
 * @returns Object with verification status, checking state, user email, and checkStatus function
 * 
 * @example
 * const { isVerified, isChecking, userEmail, checkStatus } = useEmailVerification();
 * 
 * if (isChecking) {
 *   return <LoadingSpinner />;
 * }
 * 
 * if (isVerified) {
 *   return <SuccessMessage />;
 * }
 */
export function useEmailVerification(
  pollInterval?: number
): UseEmailVerificationReturn {
  const [isVerified, setIsVerified] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Use refs to track polling state without causing re-renders
  const isVerifiedRef = useRef(false);
  const pollingStartTimeRef = useRef<number | null>(null);
  const currentIntervalRef = useRef<number>(pollInterval ?? EMAIL_VERIFICATION.STATUS_CHECK_INTERVAL);
  const attemptCountRef = useRef(0);
  const pollingIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check verification status
  const checkStatus = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setIsChecking(false);
      return;
    }

    try {
      await currentUser.reload();
      const verified = currentUser.emailVerified;
      
      // Update ref and state
      isVerifiedRef.current = verified;
      setIsVerified(verified);
      setUserEmail(currentUser.email || null);
      
      // Stop polling if verified
      if (verified && pollingIntervalRef.current) {
        clearTimeout(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    } catch (error: unknown) {
      console.error('Error checking verification status:', error);
    } finally {
      setIsChecking(false);
    }
  }, []);

  // Initial check and setup polling with exponential backoff
  useEffect(() => {
    // Reset polling state
    pollingStartTimeRef.current = Date.now();
    attemptCountRef.current = 0;
    currentIntervalRef.current = pollInterval ?? EMAIL_VERIFICATION.STATUS_CHECK_INTERVAL;
    isVerifiedRef.current = false;

    // Initial check
    checkStatus();

    // Setup polling with exponential backoff
    const scheduleNextPoll = () => {
      // Check if we should stop polling
      if (isVerifiedRef.current) {
        return;
      }

      const startTime = pollingStartTimeRef.current;
      if (startTime && Date.now() - startTime > EMAIL_VERIFICATION.MAX_POLLING_DURATION_MS) {
        // Timeout reached - stop polling
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        return;
      }

      // Calculate next interval with exponential backoff
      attemptCountRef.current += 1;
      const nextInterval = Math.min(
        currentIntervalRef.current * EMAIL_VERIFICATION.POLLING_BACKOFF_MULTIPLIER,
        EMAIL_VERIFICATION.MAX_POLLING_INTERVAL_MS
      );
      currentIntervalRef.current = nextInterval;

      // Schedule next poll
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      
      pollingIntervalRef.current = setTimeout(() => {
        if (!isVerifiedRef.current) {
          checkStatus();
          scheduleNextPoll();
        }
      }, currentIntervalRef.current);
    };

    // Start polling
    scheduleNextPoll();

    // Listen for auth state changes (token refresh, etc.)
    const unsubscribe = auth.onIdTokenChanged(() => {
      if (!isVerifiedRef.current) {
        checkStatus();
      }
    });

    return () => {
      if (pollingIntervalRef.current) {
        clearTimeout(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      unsubscribe();
    };
  }, [checkStatus, pollInterval]);

  return {
    isVerified,
    isChecking,
    userEmail,
    checkStatus,
  };
}

