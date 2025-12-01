'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from '@/lib/auth'

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
    <div className="py-10 px-5 max-w-md mx-auto">
      <Link
        href="/"
        className="bg-transparent border-none text-blue-600 cursor-pointer text-sm mb-8 flex items-center gap-1 p-1 hover:underline"
      >
        ← Back to Home
      </Link>

      <div className="bg-white p-10 rounded-xl border border-gray-200 shadow-[0_4px_6px_rgba(0,0,0,0.05)]">
        <h1 className="text-gray-800 mb-2.5 text-2xl-custom font-bold">
          Welcome Back
        </h1>
        <p className="text-gray-500 mb-8 text-sm">
          Login to your MentorMatch account
        </p>

        <form onSubmit={handleLogin} noValidate>
          <div className="mb-5">
            <label htmlFor="email" className="label-base">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@braude.ac.il"
              className="input-base"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="label-base">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Enter your password"
              className="input-base"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3.5"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

          {message && (
            <div className={`mt-5 p-3 rounded-lg text-center text-sm font-bold ${
              message.includes('successful') 
                ? 'badge-success' 
                : 'badge-danger'
            }`}>
              {message}
            </div>
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
      </div>
    </div>
  )
}
