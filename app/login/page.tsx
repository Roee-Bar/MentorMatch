'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from '@/lib/auth'
import { apiFetch } from '@/lib/api/client'
import FormInput from '@/app/components/form/FormInput'
import StatusMessage from '@/app/components/feedback/StatusMessage'
import AuthLayout from '@/app/components/layout/AuthLayout'
import { btnPrimaryFullWidth, linkPrimary, textMuted, heading2xl } from '@/lib/styles/shared-styles'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [needsVerification, setNeedsVerification] = useState(false)
  const [resending, setResending] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setNeedsVerification(false)

    try {
      const result = await signIn(email, password)
      if (result.success) {
        setMessage('Login successful!')
        router.push('/')
      } else {
        setMessage(`${result.error}`)
        if ((result as any).needsVerification) {
          setNeedsVerification(true)
        }
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleResendVerification = async () => {
    setResending(true)
    setMessage('')
    
    try {
      const response = await apiFetch('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })

      if (response.success) {
        setMessage('Verification email sent! Check your inbox.')
      } else {
        setMessage(response.error || 'Failed to send email')
      }
    } catch (error: any) {
      setMessage(error.message || 'Failed to send email')
    } finally {
      setResending(false)
    }
  }

  return (
    <AuthLayout backHref="/">
      <h1 className={`${heading2xl} mt-4 mb-2.5`}>
        Welcome Back
      </h1>
      <p className={`${textMuted} mb-8 text-sm`}>
        Login to your MentorMatch account
      </p>

      <form onSubmit={handleLogin} noValidate>
          <FormInput
            label="Email Address"
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@braude.ac.il"
            className="mb-5"
          />

          <FormInput
            label="Password"
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          placeholder="Enter your password"
          className="mb-6"
        />

        <button
          type="submit"
          disabled={loading}
          className={`${btnPrimaryFullWidth} py-3.5`}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>

        {message && (
          <StatusMessage
            message={message}
            type={message.includes('successful') ? 'success' : 'error'}
            className="mt-6"
          />
        )}

        {needsVerification && (
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={resending}
              className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
            >
              {resending ? 'Sending...' : 'Resend verification email'}
            </button>
          </div>
        )}
      </form>

      <div className={`mt-6 text-center ${textMuted} text-sm`}>
        <p>
          Dont have an account?{' '}
          <Link
            href="/register"
            className={linkPrimary}
          >
            Sign up as Student
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
