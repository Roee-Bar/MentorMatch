'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from '@/lib/auth'
import FormInput from '@/app/components/form/FormInput'
import StatusMessage from '@/app/components/feedback/StatusMessage'
import AuthLayout from '@/app/components/layout/AuthLayout'
import { btnPrimaryFullWidth, linkPrimary, textMuted, heading2xl } from '@/lib/styles/shared-styles'
import { ROUTES } from '@/lib/routes'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

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
        const errorMessage = result.error || ''
        // Check if error is about email verification
        if (errorMessage.includes('verify your email')) {
          setMessage('Please verify your email before logging in')
        } else {
          setMessage(errorMessage)
        }
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
            />
          )}
          
          {message && message.includes('verify your email') && (
            <div className="mt-4 text-center">
              <Link
                href={ROUTES.VERIFY_EMAIL}
                className={linkPrimary}
              >
                Go to verification page
              </Link>
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
