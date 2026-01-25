'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import AuthLayout from '@/app/components/layout/AuthLayout';
import StatusMessage from '@/app/components/feedback/StatusMessage';
import FormInput from '@/app/components/form/FormInput';
import { btnPrimaryFullWidth, heading2xl, textMuted } from '@/lib/styles/shared-styles';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'idle'>('idle');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');

    if (token) {
      verifyEmail(token);
    } else {
      setStatus('idle');
    }
  }, [searchParams]);

  const verifyEmail = async (token: string) => {
    setStatus('loading');
    try {
      const response = await apiFetch(`/auth/verify-email?token=${token}`);

      if (response.success) {
        setStatus('success');
        setMessage('Email verified successfully! Redirecting to login...');
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setStatus('error');
        setMessage(response.error || 'Verification failed');
      }
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'Verification failed');
    }
  };

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setMessage('Please enter your email address');
      return;
    }

    setResending(true);
    setMessage('');
    try {
      const response = await apiFetch('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      if (response.success) {
        setMessage('Verification email sent! Check your inbox.');
        setStatus('success');
      } else {
        setMessage(response.error || 'Failed to send email');
        setStatus('error');
      }
    } catch (error: any) {
      setMessage(error.message || 'Failed to send email');
      setStatus('error');
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout backHref="/login">
      <div className="text-center">
        <h1 className={`${heading2xl} mb-2.5`}>
          Email Verification
        </h1>

        {status === 'loading' && (
          <div className="py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className={textMuted}>Verifying your email...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-8">
            <div className="text-green-600 text-5xl mb-4">✓</div>
            <StatusMessage message={message} type="success" className="mb-6" />
          </div>
        )}

        {(status === 'error' || status === 'idle') && (
          <div className="py-8">
            {status === 'error' && (
              <>
                <div className="text-red-600 text-5xl mb-4">✗</div>
                <StatusMessage message={message} type="error" className="mb-6" />
              </>
            )}
            
            <div className="mt-8 p-6 bg-gray-50 dark:bg-slate-800 rounded-lg">
              <p className={`${textMuted} mb-4 text-sm`}>
                {status === 'idle' ? 'Enter your email to receive a new verification link:' : 'Need a new verification link?'}
              </p>
              <form onSubmit={handleResend}>
                <FormInput
                  label="Email Address"
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@braude.ac.il"
                  required
                  className="mb-4"
                />
                <button
                  type="submit"
                  disabled={resending}
                  className={btnPrimaryFullWidth}
                >
                  {resending ? 'Sending...' : 'Send Verification Email'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <AuthLayout backHref="/login">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className={textMuted}>Loading...</p>
        </div>
      </AuthLayout>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
