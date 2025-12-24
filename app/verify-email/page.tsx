'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEmailVerification } from '@/lib/hooks/useEmailVerification'
import { useEmailVerificationResend } from '@/lib/hooks/useEmailVerificationResend'
import { useRateLimit } from '@/lib/hooks/useRateLimit'
import { EMAIL_VERIFICATION } from '@/lib/constants'
import AuthLayout from '@/app/components/layout/AuthLayout'
import StatusMessage from '@/app/components/feedback/StatusMessage'
import FormInput from '@/app/components/form/FormInput'
import { btnPrimaryFullWidth, linkPrimary, textMuted, heading2xl } from '@/lib/styles/shared-styles'
import { ROUTES } from '@/lib/routes'

export default function VerifyEmailPage() {
  const router = useRouter()
  
  // Hooks for verification status and resend functionality
  const { isVerified, isChecking, userEmail } = useEmailVerification()
  const { resend, isLoading: resendLoading } = useEmailVerificationResend()
  const { cooldown, formatCooldown } = useRateLimit(
    'emailVerificationResends',
    EMAIL_VERIFICATION.MAX_RESENDS,
    EMAIL_VERIFICATION.RESEND_COOLDOWN_MS
  )

  // UI state
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info')
  const [resendEmail, setResendEmail] = useState('')
  const [resendPassword, setResendPassword] = useState('')
  const [showResendForm, setShowResendForm] = useState(false)

  // Auto-redirect when verified
  useEffect(() => {
    if (isVerified) {
      setMessage('Email verified successfully! Redirecting to login...')
      setMessageType('success')
      setTimeout(() => {
        router.push(ROUTES.LOGIN)
      }, 2000)
    }
  }, [isVerified, router])

  // Handle resend verification email
  const handleResend = async () => {
    setMessage('')
    
    // If user is not signed in and form is not shown, show form
    if (!userEmail && !resendEmail && !resendPassword) {
      setShowResendForm(true)
      setMessage('Please provide your email and password to resend the verification email.')
      setMessageType('info')
      return
    }

    const result = await resend(resendEmail || undefined, resendPassword || undefined)
    
    if (result.success) {
      setMessage('Verification email sent! Please check your inbox.')
      setMessageType('success')
      setShowResendForm(false)
      setResendEmail('')
      setResendPassword('')
    } else {
      // Handle specific error cases
      if (result.error?.includes('email and password')) {
        setShowResendForm(true)
        setMessageType('info')
      } else {
        setMessageType('error')
      }
      setMessage(result.error || 'Failed to send verification email.')
    }
  }

  return (
    <AuthLayout backHref={ROUTES.LOGIN}>
      <h1 className={`${heading2xl} mt-4 mb-2.5`}>
        Verify Your Email
      </h1>
      <p className={`${textMuted} mb-8 text-sm`}>
        {isVerified 
          ? 'Your email has been verified!'
          : userEmail 
            ? `We've sent a verification email to ${userEmail}. Please check your inbox and click the verification link.`
            : 'Please verify your email address to continue.'
        }
      </p>

      {isChecking ? (
        <div className="text-center py-8">
          <p className={textMuted}>Checking verification status...</p>
        </div>
      ) : (
        <>
          {message && (
            <StatusMessage
              message={message}
              type={messageType}
              className="mb-6"
            />
          )}

          {!isVerified && (
            <>
              {showResendForm && !userEmail && (
                <div className="mb-6 space-y-4">
                  <FormInput
                    label="Email Address"
                    type="email"
                    name="resendEmail"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    required
                    placeholder="you@braude.ac.il"
                    className="mb-4"
                  />
                  <FormInput
                    label="Password"
                    type="password"
                    name="resendPassword"
                    value={resendPassword}
                    onChange={(e) => setResendPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                    className="mb-4"
                  />
                </div>
              )}

              <div className="space-y-4">
                <button
                  onClick={handleResend}
                  disabled={resendLoading || (cooldown !== null && cooldown > 0)}
                  className={`${btnPrimaryFullWidth} py-3.5`}
                >
                  {resendLoading 
                    ? 'Sending...' 
                    : cooldown && cooldown > 0
                      ? `Resend Email (Wait ${formatCooldown(cooldown)})`
                      : 'Resend Verification Email'
                  }
                </button>

                <div className="text-center">
                  <Link
                    href={ROUTES.LOGIN}
                    className={linkPrimary}
                  >
                    Continue to Login
                  </Link>
                </div>
              </div>

              <div className={`mt-6 p-4 rounded-xl border bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 ${textMuted} text-sm`}>
                <p className="font-semibold mb-2">Didn't receive the email?</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Check your spam or junk folder</li>
                  <li>Make sure the email address is correct</li>
                  <li>Wait a few minutes - emails may take time to arrive</li>
                  <li>Try resending the verification email</li>
                </ul>
              </div>
            </>
          )}
        </>
      )}
    </AuthLayout>
  )
}

