'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { signIn } from '@/lib/auth'
import FormInput from '@/app/components/form/FormInput'
import StatusMessage from '@/app/components/feedback/StatusMessage'
import AuthLayout from '@/app/components/layout/AuthLayout'
import { btnPrimaryFullWidth, linkPrimary, textMuted, heading2xl } from '@/lib/styles/shared-styles'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  // Check for registration success message from URL
  useEffect(() => {
    const registered = searchParams.get('registered')
    if (registered === 'true') {
      setMessage('Registration successful! Please login with your credentials.')
      // Clean up URL
      router.replace('/login', { scroll: false })
    }
  }, [searchParams, router])

  // Check for email verification success message from URL
  useEffect(() => {
    const verified = searchParams.get('verified')
    if (verified === 'true') {
      setMessage('Email verified successfully! You can now log in.')
      // Clean up URL
      router.replace('/login', { scroll: false })
    }
  }, [searchParams, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const result = await signIn(email, password)
      if (result.success) {
        setMessage('Login successful!')
        router.push('/')
      } else {
        setMessage(`${result.error}`)
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
    } finally {
      setLoading(false)
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

      <form onSubmit={handleLogin} noValidate data-testid="login-form">
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
          data-testid="login-button"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>

          {message && (
            <StatusMessage
              message={message}
            type={message.includes('successful') ? 'success' : 'error'}
          />
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

export default function LoginPage() {
  return (
    <Suspense fallback={
      <AuthLayout backHref="/">
        <h1 className={`${heading2xl} mt-4 mb-2.5`}>
          Welcome Back
        </h1>
        <p className={`${textMuted} mb-8 text-sm`}>
          Login to your MentorMatch account
        </p>
        <div>Loading...</div>
      </AuthLayout>
    }>
      <LoginForm />
    </Suspense>
  )
}
