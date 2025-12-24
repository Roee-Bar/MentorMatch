// lib/hooks/useEmailVerification.ts
// Custom hook for email verification status checking and polling

'use client';

import { useState, useEffect, useCallback } from 'react';
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
 * Handles status checking, polling, and real-time updates via auth state changes
 * 
 * @param pollInterval - Optional polling interval in milliseconds (defaults to EMAIL_VERIFICATION.STATUS_CHECK_INTERVAL)
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

  const interval = pollInterval ?? EMAIL_VERIFICATION.STATUS_CHECK_INTERVAL;

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
      setIsVerified(verified);
      setUserEmail(currentUser.email || null);
    } catch (error) {
      console.error('Error checking verification status:', error);
    } finally {
      setIsChecking(false);
    }
  }, []);

  // Initial check and setup polling
  useEffect(() => {
    checkStatus();

    // Poll for verification status at specified interval
    const pollingInterval = setInterval(() => {
      if (!isVerified) {
        checkStatus();
      }
    }, interval);

    // Listen for auth state changes (token refresh, etc.)
    const unsubscribe = auth.onIdTokenChanged(() => {
      if (!isVerified) {
        checkStatus();
      }
    });

    return () => {
      clearInterval(pollingInterval);
      unsubscribe();
    };
  }, [checkStatus, interval, isVerified]);

  return {
    isVerified,
    isChecking,
    userEmail,
    checkStatus,
  };
}

