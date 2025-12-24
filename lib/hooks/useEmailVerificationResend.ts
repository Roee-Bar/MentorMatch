// lib/hooks/useEmailVerificationResend.ts
// Custom hook for resending email verification

'use client';

import { useCallback } from 'react';
import { signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
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
 * Security Note: When a signed-out user provides credentials to resend the verification email,
 * the user remains signed in after successful email send for better UX (allows immediate
 * verification without requiring another login). However, if the email send fails after
 * temporary sign-in, the user is automatically signed out to prevent partial state.
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

        // Sign in temporarily to send verification email
        // Note: User remains signed in after successful email send for better UX
        // This allows immediate verification without requiring another login
        try {
          await signInWithEmailAndPassword(auth, email, password);
          const result = await sendEmailVerification();

          if (result.success) {
            recordAttempt();
            // User remains signed in for better UX (can verify immediately)
            return { success: true };
          } else {
            // If email send fails, sign out to prevent partial state
            await firebaseSignOut(auth);
            return {
              success: false,
              error: result.error || 'Failed to send verification email.',
            };
          }
        } catch (signInError: unknown) {
          // Sign-in failed - ensure user is not signed in
          try {
            await firebaseSignOut(auth);
          } catch {
            // Ignore sign-out errors
          }
          return {
            success: false,
            error: 'Invalid email or password. Please try again.',
          };
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send verification email.';
      return {
        success: false,
        error: errorMessage,
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

