'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/lib/contexts/AuthContext';
import { ROUTES } from '@/lib/routes';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import VerificationBanner from '@/app/components/feedback/VerificationBanner';
import { useEmailVerification } from '@/lib/hooks/useEmailVerification';

interface AuthenticatedLayoutProps {
  children: ReactNode;
}

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const router = useRouter();
  const { user, userProfile, isLoading, error } = useAuthContext();
  
  // Email verification status
  const { isVerified, isChecking: isCheckingVerification, resendVerificationEmail, isResending } = useEmailVerification();

  // Redirect if not authenticated
  if (!isLoading && !user) {
    router.replace(ROUTES.HOME);
    return null;
  }

  // Redirect if profile fetch failed
  if (!isLoading && user && !userProfile && error) {
    router.replace(ROUTES.HOME);
    return null;
  }

  if (isLoading) {
    return <LoadingSpinner message="Loading..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Email Verification Banner - shown when user is not verified */}
      {!isCheckingVerification && !isVerified && user && (
        <div className="container mx-auto px-4 pt-4">
          <VerificationBanner
            email={user.email || undefined}
            onResend={resendVerificationEmail}
            isResending={isResending}
          />
        </div>
      )}
      {children}
    </div>
  );
}
