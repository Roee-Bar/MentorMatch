/**
 * Email Verification Hook
 * 
 * Hook to manage email verification status and resend functionality
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { auth } from '@/lib/firebase';
import { apiFetch } from '@/lib/api/client';

// Constants for polling mechanism
const POLLING_INTERVAL = 2000; // 2 seconds
const MAX_POLLING_DURATION = 30000; // 30 seconds
const STATUS_REFRESH_DELAY = 1000; // 1 second

interface UseEmailVerificationReturn {
  /** Whether the user's email is verified */
  isVerified: boolean | null;
  /** Whether verification status is being checked */
  isChecking: boolean;
  /** Whether a verification email is being resent */
  isResending: boolean;
  /** Error message if any */
  error: string | null;
  /** Function to resend verification email */
  resendVerificationEmail: () => Promise<void>;
  /** Function to refresh verification status */
  refreshStatus: () => Promise<void>;
}

/**
 * Hook to manage email verification status
 * 
 * @returns Verification status and handlers
 */
export function useEmailVerification(): UseEmailVerificationReturn {
  const { userId, getToken, isAuthLoading } = useAuth();
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pollingStartTimeRef = useRef<number | null>(null);

  /**
   * Check verification status from Firebase user object
   */
  const checkVerificationStatus = useCallback(async () => {
    if (isAuthLoading || !userId) {
      return;
    }

    setIsChecking(true);
    setError(null);

    try {
      // Get current user from Firebase Auth
      const currentUser = auth.currentUser;
      
      if (currentUser) {
        // Reload user to get latest emailVerified status
        await currentUser.reload();
        const verified = currentUser.emailVerified;
        setIsVerified(verified);
      } else {
        // Fallback: check via API if Firebase user is not available
        try {
          const token = await getToken();
          const response = await apiFetch('/auth/verify-email', { token });
          
          if (response.success && response.data) {
            setIsVerified(response.data.verified || false);
          } else {
            setIsVerified(false);
          }
        } catch (apiError) {
          // Use logger if available, otherwise console.warn
          if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
            console.warn('Failed to check verification status via API:', apiError);
          }
          setIsVerified(false);
        }
      }
    } catch (error: any) {
      // Use logger if available, otherwise console.error
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
        console.error('Error checking verification status:', error);
      }
      setError(error.message || 'Failed to check verification status');
      setIsVerified(false);
    } finally {
      setIsChecking(false);
    }
  }, [userId, isAuthLoading, getToken]);

  /**
   * Poll verification status until verified or timeout
   * Uses exponential backoff for polling intervals
   */
  const pollVerificationStatus = useCallback(async (): Promise<void> => {
    if (!userId) {
      return;
    }

    const startTime = pollingStartTimeRef.current || Date.now();
    pollingStartTimeRef.current = startTime;
    const elapsed = Date.now() - startTime;

    // Stop polling if max duration reached
    if (elapsed >= MAX_POLLING_DURATION) {
      pollingStartTimeRef.current = null;
      return;
    }

    try {
      await checkVerificationStatus();
      
      // Check if verified now
      const currentUser = auth.currentUser;
      if (currentUser) {
        await currentUser.reload();
        if (currentUser.emailVerified) {
          setIsVerified(true);
          pollingStartTimeRef.current = null;
          if (pollingTimeoutRef.current) {
            clearTimeout(pollingTimeoutRef.current);
            pollingTimeoutRef.current = null;
          }
          return;
        }
      }

      // Continue polling with exponential backoff
      const attemptNumber = Math.floor(elapsed / POLLING_INTERVAL) + 1;
      const delay = Math.min(POLLING_INTERVAL * Math.pow(1.2, attemptNumber - 1), 5000);
      
      pollingTimeoutRef.current = setTimeout(() => {
        pollVerificationStatus();
      }, delay);
    } catch (error) {
      // On error, stop polling
      pollingStartTimeRef.current = null;
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
        pollingTimeoutRef.current = null;
      }
    }
  }, [userId, checkVerificationStatus]);

  /**
   * Refresh verification status
   */
  const refreshStatus = useCallback(async () => {
    await checkVerificationStatus();
  }, [checkVerificationStatus]);

  /**
   * Resend verification email
   */
  const resendVerificationEmail = useCallback(async () => {
    if (!userId) {
      setError('User not authenticated');
      return;
    }

    setIsResending(true);
    setError(null);

    try {
      const token = await getToken();
      const response = await apiFetch('/auth/resend-verification', {
        method: 'POST',
        token,
      });

      if (response.success) {
        // Start polling for verification status
        pollingStartTimeRef.current = Date.now();
        setTimeout(() => {
          pollVerificationStatus();
        }, STATUS_REFRESH_DELAY);
      } else {
        throw new Error(response.error || 'Failed to resend verification email');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to resend verification email. Please try again later.';
      setError(errorMessage);
      throw error;
    } finally {
      setIsResending(false);
    }
  }, [userId, getToken, checkVerificationStatus]);

  // Combined effect: Check verification status when user changes and listen for auth state changes
  useEffect(() => {
    if (isAuthLoading || !userId) {
      if (!userId) {
        setIsVerified(null);
        setIsChecking(false);
      }
      return;
    }

    // Initial check
    checkVerificationStatus();

    // Listen for auth state changes to refresh verification status
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user && user.uid === userId) {
        try {
          await user.reload();
          setIsVerified(user.emailVerified);
          setIsChecking(false);
        } catch (error) {
          // Use logger if available, otherwise console.error
          if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
            console.error('Error reloading user:', error);
          }
        }
      }
    });

    return () => {
      unsubscribe();
      // Cleanup polling on unmount
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
        pollingTimeoutRef.current = null;
      }
      pollingStartTimeRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, isAuthLoading]); // checkVerificationStatus is stable due to useCallback

  return {
    isVerified,
    isChecking,
    isResending,
    error,
    resendVerificationEmail,
    refreshStatus,
  };
}

