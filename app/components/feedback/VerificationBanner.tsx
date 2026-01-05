import React, { useState } from 'react';

export interface VerificationBannerProps {
  /** User's email address */
  email?: string;
  /** Callback when resend button is clicked */
  onResend?: () => Promise<void>;
  /** Whether resend is in progress */
  isResending?: boolean;
  /** Callback when banner is dismissed */
  onDismiss?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Verification Banner Component
 * 
 * Displays a warning banner for unverified users with option to resend verification email
 */
const VerificationBanner: React.FC<VerificationBannerProps> = ({
  email,
  onResend,
  isResending = false,
  onDismiss,
  className = '',
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleDismiss = () => {
    setIsDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
  };

  const handleResend = async () => {
    if (!onResend) return;

    setResendError(null);
    setResendSuccess(false);

    try {
      await onResend();
      setResendSuccess(true);
      // Clear success message after 5 seconds
      setTimeout(() => {
        setResendSuccess(false);
      }, 5000);
    } catch (error: any) {
      setResendError(error.message || 'Failed to resend verification email');
    }
  };

  if (isDismissed) {
    return null;
  }

  // Banner styles matching StatusMessage warning style
  const bannerStyles = 'mb-6 p-4 rounded-xl border bg-yellow-50 border-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-800';
  const textStyles = 'text-yellow-800 font-medium dark:text-yellow-200';
  const buttonStyles = 'mt-3 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <div 
      className={`${bannerStyles} ${className}`}
      role="alert"
      data-testid="verification-banner"
      aria-live="polite"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <svg 
              className="w-5 h-5 text-yellow-600 dark:text-yellow-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
            </svg>
            <h3 className={`${textStyles} font-semibold`}>
              Email Verification Required
            </h3>
          </div>
          
          <p className={`${textStyles} text-sm mb-3`}>
            Please verify your email address{email ? ` (${email})` : ''} to access all features.
          </p>

          {resendSuccess && (
            <p className="text-green-700 dark:text-green-300 text-sm mb-2 font-medium">
              ✓ Verification email sent! Please check your inbox.
            </p>
          )}

          {resendError && (
            <p className="text-red-700 dark:text-red-300 text-sm mb-2 font-medium">
              {resendError}
            </p>
          )}

          {onResend && (
            <button
              onClick={handleResend}
              disabled={isResending}
              className={buttonStyles}
              type="button"
              data-testid="resend-verification-button"
            >
              {isResending ? 'Sending...' : 'Resend Verification Email'}
            </button>
          )}
        </div>

        {onDismiss && (
          <button
            onClick={handleDismiss}
            className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200 opacity-70 hover:opacity-100 transition-opacity"
            aria-label="Dismiss banner"
            type="button"
            data-testid="dismiss-verification-banner"
          >
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M6 18L18 6M6 6l12 12" 
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default VerificationBanner;

