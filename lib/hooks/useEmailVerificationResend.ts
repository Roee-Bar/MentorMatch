// lib/hooks/useEmailVerificationResend.ts
// Custom hook for resending email verification

'use client';

import { useCallback } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { sendEmailVerification } from '@/lib/auth';
import { useLoadingState } from './useLoadingState';
import { useRateLimit } from './useRateLimit';
import { EMAIL_VERIFICATION } from '@/lib/constants';

interface UseEmailVerificationResendReturn {
  resend: (email?: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  isLoading: boolean;
}

/**
 * Custom hook for resending email verification
 * Handles rate limiting, loading states, and both signed-in/out cases
 * 
 * @returns Object with resend function and isLoading state
 * 
 * @example
 * const { resend, isLoading } = useEmailVerificationResend();
 * 
 * const handleResend = async () => {
 *   const result = await resend();
 *   if (result.success) {
 *     // Show success message
 *   } else {
 *     // Show error: result.error
 *   }
 * };
 * 
 * // For signed-out users
 * const result = await resend(email, password);
 */
export function useEmailVerificationResend(): UseEmailVerificationResendReturn {
  const { startLoading, stopLoading, isLoading } = useLoadingState();
  const { checkLimit, recordAttempt, cooldown } = useRateLimit(
    'emailVerificationResends',
    EMAIL_VERIFICATION.MAX_RESENDS,
    EMAIL_VERIFICATION.RESEND_COOLDOWN_MS
  );

  const resend = useCallback(async (
    email?: string,
    password?: string
  ): Promise<{ success: boolean; error?: string }> => {
    // Check rate limit
    if (!checkLimit()) {
      return {
        success: false,
        error: 'Too many resend attempts. Please wait before trying again.',
      };
    }

    const loadingKey = 'resend';
    startLoading(loadingKey);

    try {
      const currentUser = auth.currentUser;

      if (currentUser && currentUser.email) {
        // User is already signed in
        const result = await sendEmailVerification();
        if (result.success) {
          recordAttempt();
          return { success: true };
        } else {
          return {
            success: false,
            error: result.error || 'Failed to send verification email.',
          };
        }
      } else {
        // User not signed in - need email and password
        if (!email || !password) {
          return {
            success: false,
            error: 'Please provide your email and password to resend the verification email.',
          };
        }

        // Sign in temporarily
        try {
          await signInWithEmailAndPassword(auth, email, password);
          const result = await sendEmailVerification();

          if (result.success) {
            recordAttempt();
            return { success: true };
          } else {
            return {
              success: false,
              error: result.error || 'Failed to send verification email.',
            };
          }
        } catch (signInError: any) {
          return {
            success: false,
            error: 'Invalid email or password. Please try again.',
          };
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to send verification email.',
      };
    } finally {
      stopLoading(loadingKey);
    }
  }, [checkLimit, recordAttempt, startLoading, stopLoading]);

  return {
    resend,
    isLoading: isLoading('resend'),
  };
}

