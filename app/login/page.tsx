'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from '@/lib/auth'
import FormInput from '@/app/components/form/FormInput'
import StatusMessage from '@/app/components/feedback/StatusMessage'
import AuthLayout from '@/app/components/layout/AuthLayout'

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
      <h1 className="text-gray-800 mb-2.5 text-2xl-custom font-bold">
        Welcome Back
      </h1>
      <p className="text-gray-500 mb-8 text-sm">
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
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed w-full py-3.5"
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

      <div className="mt-6 text-center text-gray-500 text-sm">
        <p>
          Dont have an account?{' '}
          <Link
            href="/register"
            className="bg-transparent border-none text-blue-600 cursor-pointer font-bold underline text-sm hover:text-blue-700"
          >
            Sign up as Student
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
