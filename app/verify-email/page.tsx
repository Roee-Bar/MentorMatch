'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { applyActionCode, checkActionCode } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import AuthLayout from '@/app/components/layout/AuthLayout';
import StatusMessage from '@/app/components/feedback/StatusMessage';
import { btnPrimaryFullWidth, linkPrimary, textMuted, heading2xl } from '@/lib/styles/shared-styles';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/lib/constants/error-messages';

type VerificationState = 'checking' | 'success' | 'expired' | 'invalid' | 'already-verified' | 'error';

interface VerificationResult {
  state: VerificationState;
  message: string;
  email?: string;
}

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Extract action code from URL parameters
        const mode = searchParams.get('mode');
        const oobCode = searchParams.get('oobCode');
        const continueUrl = searchParams.get('continueUrl');

        // Validate required parameters
        if (mode !== 'verifyEmail' || !oobCode) {
          // Log failure via API (client-side can't import server-only service)
          try {
            await fetch('/api/auth/verify-email-metric', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ metric: 'verification_failed', errorCode: 'invalid-parameters' }),
            }).catch(() => {}); // Ignore errors in logging
          } catch {}
          setResult({
            state: 'invalid',
            message: ERROR_MESSAGES.VERIFICATION_INVALID,
          });
          return;
        }

        // Log verification attempt via API
        try {
          await fetch('/api/auth/verify-email-metric', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ metric: 'verification_attempted' }),
          }).catch(() => {}); // Ignore errors in logging
        } catch {}

        // Check if we're in test mode
        const isTestEnv = process.env.NEXT_PUBLIC_NODE_ENV === 'test' || process.env.NEXT_PUBLIC_E2E_TEST === 'true';

        if (isTestEnv) {
          // Use test-specific verification endpoint
          try {
            const response = await fetch(`/api/auth/test-verify-email?mode=${mode}&oobCode=${encodeURIComponent(oobCode)}`);
            const data = await response.json();

            if (!response.ok) {
              // Handle error responses
              const errorMessage = data.error || 'Verification failed';
              if (errorMessage.includes('expired')) {
                setResult({
                  state: 'expired',
                  message: ERROR_MESSAGES.VERIFICATION_EXPIRED,
                  email: data.email,
                });
              } else if (errorMessage.includes('already verified') || data.alreadyVerified) {
                setResult({
                  state: 'already-verified',
                  message: ERROR_MESSAGES.VERIFICATION_ALREADY_VERIFIED,
                  email: data.email,
                });
                startCountdown(3);
              } else {
                setResult({
                  state: 'invalid',
                  message: errorMessage || ERROR_MESSAGES.VERIFICATION_INVALID,
                  email: data.email,
                });
              }
              return;
            }

            // Success
            if (data.success && data.data) {
              setResult({
                state: data.data.alreadyVerified ? 'already-verified' : 'success',
                message: data.data.alreadyVerified 
                  ? ERROR_MESSAGES.VERIFICATION_ALREADY_VERIFIED 
                  : SUCCESS_MESSAGES.EMAIL_VERIFIED,
                email: data.data.email,
              });
              startCountdown(3);
            } else {
              setResult({
                state: 'error',
                message: ERROR_MESSAGES.VERIFICATION_FAILED,
              });
            }
          } catch (error: any) {
            setResult({
              state: 'error',
              message: error.message || ERROR_MESSAGES.VERIFICATION_NETWORK_ERROR,
            });
          }
          return;
        }

        // Production flow: Use Firebase SDK
        // Check the action code to get email and verify it's valid
        let email: string | undefined;
        try {
          const actionCodeInfo = await checkActionCode(auth, oobCode);
          email = actionCodeInfo.data.email || undefined;
        } catch (checkError: any) {
          // Handle specific Firebase errors
          if (checkError.code === 'auth/expired-action-code') {
            // Log failure via API
            try {
              await fetch('/api/auth/verify-email-metric', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ metric: 'verification_failed', email, errorCode: checkError.code }),
              }).catch(() => {});
            } catch {}
            setResult({
              state: 'expired',
              message: ERROR_MESSAGES.VERIFICATION_EXPIRED,
              email,
            });
            return;
          } else if (checkError.code === 'auth/invalid-action-code') {
            // Log failure via API
            try {
              await fetch('/api/auth/verify-email-metric', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ metric: 'verification_failed', email, errorCode: checkError.code }),
              }).catch(() => {});
            } catch {}
            setResult({
              state: 'invalid',
              message: ERROR_MESSAGES.VERIFICATION_INVALID,
              email,
            });
            return;
          } else {
            // Log failure via API
            try {
              await fetch('/api/auth/verify-email-metric', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ metric: 'verification_failed', email, errorCode: checkError.code || 'unknown' }),
              }).catch(() => {});
            } catch {}
            throw checkError;
          }
        }

        // Check if email is already verified by checking current user
        const currentUser = auth.currentUser;
        if (currentUser && currentUser.email === email) {
          await currentUser.reload();
          if (currentUser.emailVerified) {
            // Log success via API
            try {
              await fetch('/api/auth/verify-email-metric', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ metric: 'verification_succeeded', email, userId: currentUser.uid }),
              }).catch(() => {});
            } catch {}
            setResult({
              state: 'already-verified',
              message: ERROR_MESSAGES.VERIFICATION_ALREADY_VERIFIED,
              email,
            });
            // Auto-redirect after 3 seconds
            startCountdown(3);
            return;
          }
        }

        // Apply the action code to verify the email
        try {
          await applyActionCode(auth, oobCode);
          
          // Reload user if signed in
          if (currentUser) {
            await currentUser.reload();
          }

          // Log success metric via API
          try {
            await fetch('/api/auth/verify-email-metric', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ metric: 'verification_succeeded', email, userId: currentUser?.uid }),
            }).catch(() => {});
          } catch {}

          setResult({
            state: 'success',
            message: SUCCESS_MESSAGES.EMAIL_VERIFIED,
            email,
          });

          // Auto-redirect to login after 3 seconds
          startCountdown(3);
        } catch (applyError: any) {
          // Log failure metric via API
          try {
            await fetch('/api/auth/verify-email-metric', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ metric: 'verification_failed', email, errorCode: applyError.code || 'unknown' }),
            }).catch(() => {});
          } catch {}

          // Handle specific Firebase errors
          if (applyError.code === 'auth/expired-action-code') {
            setResult({
              state: 'expired',
              message: ERROR_MESSAGES.VERIFICATION_EXPIRED,
              email,
            });
          } else if (applyError.code === 'auth/invalid-action-code') {
            setResult({
              state: 'invalid',
              message: ERROR_MESSAGES.VERIFICATION_INVALID,
              email,
            });
          } else if (applyError.code === 'auth/user-disabled') {
            setResult({
              state: 'error',
              message: ERROR_MESSAGES.VERIFICATION_USER_DISABLED,
              email,
            });
          } else {
            setResult({
              state: 'error',
              message: applyError.message || ERROR_MESSAGES.VERIFICATION_FAILED,
              email,
            });
          }
        }
      } catch (error: any) {
        setResult({
          state: 'error',
          message: error.message || ERROR_MESSAGES.VERIFICATION_NETWORK_ERROR,
        });
      }
    };

    verifyEmail();
  }, [searchParams]);

  const startCountdown = (seconds: number) => {
    setCountdown(seconds);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          router.push('/login?verified=true');
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleRedirect = () => {
    router.push('/login?verified=true');
  };

  // Show loading state while checking
  if (!result) {
    return (
      <AuthLayout backHref="/">
        <h1 className={`${heading2xl} mt-4 mb-2.5`}>
          Verifying Email
        </h1>
        <p className={`${textMuted} mb-8 text-sm`}>
          Please wait while we verify your email address...
        </p>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AuthLayout>
    );
  }

  // Determine message type based on state
  const messageType = result.state === 'success' || result.state === 'already-verified' 
    ? 'success' 
    : 'error';

  return (
    <AuthLayout backHref="/">
      <h1 className={`${heading2xl} mt-4 mb-2.5`}>
        {result.state === 'success' || result.state === 'already-verified' 
          ? 'Email Verified' 
          : 'Verification Failed'}
      </h1>

      <StatusMessage
        message={result.message}
        type={messageType}
      />

      {result.email && (
        <p className={`${textMuted} mt-4 text-sm`}>
          Email: {result.email}
        </p>
      )}

      {(result.state === 'success' || result.state === 'already-verified') && (
        <div className="mt-6">
          {countdown !== null && countdown > 0 && (
            <p className={`${textMuted} mb-4 text-sm text-center`}>
              Redirecting to login in {countdown} second{countdown !== 1 ? 's' : ''}...
            </p>
          )}
          <button
            onClick={handleRedirect}
            className={`${btnPrimaryFullWidth} py-3.5`}
            data-testid="go-to-login-button"
          >
            Go to Login
          </button>
        </div>
      )}

      {(result.state === 'expired' || result.state === 'invalid') && (
        <div className="mt-6">
          <p className={`${textMuted} mb-4 text-sm`}>
            You can request a new verification email from your dashboard after logging in.
          </p>
          <Link
            href="/login"
            className={`${linkPrimary} block text-center`}
          >
            Go to Login
          </Link>
        </div>
      )}

      {result.state === 'error' && (
        <div className="mt-6">
          <Link
            href="/login"
            className={`${linkPrimary} block text-center`}
          >
            Go to Login
          </Link>
        </div>
      )}
    </AuthLayout>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <AuthLayout backHref="/">
        <h1 className={`${heading2xl} mt-4 mb-2.5`}>
          Verifying Email
        </h1>
        <p className={`${textMuted} mb-8 text-sm`}>
          Loading...
        </p>
      </AuthLayout>
    }>
      <VerifyEmailForm />
    </Suspense>
  );
}

