'use client'

import React, { useState, useEffect } from 'react'
import { onAuthChange, signIn, signOut, getUserProfile } from '@/lib/auth'
import { User } from 'firebase/auth'
import StudentRegistration from './register'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentView, setCurrentView] = useState<'landing' | 'login' | 'signup'>('landing')

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      setUser(user)
      if (user) {
        const profile = await getUserProfile(user.uid)
        if (profile.success) {
          setUserProfile(profile.data)
        }
      } else {
        setUserProfile(null)
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-[50px] h-[50px] border-[5px] border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 text-base">Loading...</p>
        </div>
      </div>
    )
  }

  if (user && userProfile) {
    return <Dashboard user={user} userProfile={userProfile} />
  }

  if (currentView === 'login') {
    return <LoginPage setCurrentView={setCurrentView} />
  }

  if (currentView === 'signup') {
    return <StudentRegistration setCurrentView={setCurrentView} />
  }

  return <LandingPage setCurrentView={setCurrentView} />
}

function LandingPage({ setCurrentView }: { setCurrentView: (view: 'landing' | 'login' | 'signup') => void }) {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-20 px-12 text-center">
        <div className="max-w-[800px] mx-auto">
          <h1 className="text-5xl font-bold text-gray-800 mb-5 leading-tight">
            Find Your Perfect Project Supervisor
          </h1>
          
          <p className="text-xl text-gray-500 mb-10 leading-relaxed">
            Connect with experienced supervisors, browse project topics, and streamline your capstone project matching process.
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={() => setCurrentView('signup')}
              className="px-9 py-4 bg-blue-600 text-white border-none rounded-lg cursor-pointer font-bold text-base shadow-[0_4px_6px_rgba(37,99,235,0.2)] transition-all duration-200 hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-[0_6px_12px_rgba(37,99,235,0.3)]"
            >
              Sign Up as Student
            </button>
            
            <button
              onClick={() => setCurrentView('login')}
              className="px-9 py-4 bg-white text-blue-600 border-2 border-blue-600 rounded-lg cursor-pointer font-bold text-base transition-all duration-200 hover:bg-blue-50"
            >
              Login
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

function LoginPage({ setCurrentView }: { setCurrentView: (view: 'landing' | 'login' | 'signup') => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const result = await signIn(email, password)
      if (result.success) {
        setMessage('✅ Login successful!')
      } else {
        setMessage(`❌ ${result.error}`)
      }
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="py-10 px-5 max-w-md mx-auto">
      <button
        onClick={() => setCurrentView('landing')}
        className="bg-transparent border-none text-blue-600 cursor-pointer text-sm mb-8 flex items-center gap-1 p-1 hover:underline"
      >
        ← Back to Home
      </button>

      <div className="bg-white p-10 rounded-xl border border-gray-200 shadow-[0_4px_6px_rgba(0,0,0,0.05)]">
        <h1 className="text-gray-800 mb-2.5 text-[28px] font-bold">
          Welcome Back
        </h1>
        <p className="text-gray-500 mb-8 text-sm">
          Login to your MentorMatch account
        </p>

        <form onSubmit={handleLogin}>
          <div className="mb-5">
            <label className="block mb-2 font-semibold text-gray-700 text-sm">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@braude.ac.il"
              className="w-full p-3 rounded-md border border-gray-300 text-sm outline-none focus:border-blue-600"
            />
          </div>

          <div className="mb-6">
            <label className="block mb-2 font-semibold text-gray-700 text-sm">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Enter your password"
              className="w-full p-3 rounded-md border border-gray-300 text-sm outline-none focus:border-blue-600"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-blue-600 text-white border-none rounded-lg font-bold text-base transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-blue-700"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

          {message && (
            <div className={`mt-5 p-3 rounded-lg text-center text-sm font-bold ${
              message.includes('✅') 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {message}
            </div>
          )}
        </form>

        <div className="mt-6 text-center text-gray-500 text-sm">
          <p>
            Don't have an account?{' '}
            <button
              onClick={() => setCurrentView('signup')}
              className="bg-transparent border-none text-blue-600 cursor-pointer font-bold underline text-sm hover:text-blue-700"
            >
              Sign up as Student
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

function Dashboard({ user, userProfile }: { user: User, userProfile: any }) {
  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="min-h-[calc(100vh-400px)]">
      {/* Dashboard Header */}
      <div className="bg-gray-50 border-b border-gray-200 py-8 px-12">
        <div className="max-w-[1200px] mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-[28px] font-bold text-gray-800 m-0 mb-1">
              {userProfile.role === 'student' ? 'Student Dashboard' : 
               userProfile.role === 'supervisor' ? 'Supervisor Dashboard' : 'Admin Dashboard'}
            </h1>
            <p className="text-gray-500 m-0 text-sm">
              Welcome, {userProfile.name}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="px-6 py-2.5 bg-white text-red-600 border border-red-600 rounded-md cursor-pointer font-semibold text-sm transition-all hover:bg-red-600 hover:text-white"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="py-10 px-12">
        <div className="max-w-[1200px] mx-auto">
          {userProfile.role === 'student' && (
            <div>
              <div className="bg-white p-8 rounded-xl border border-gray-200 mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-5">
                  Profile Summary
                </h2>
                <div className="grid grid-cols-[200px_1fr] gap-4 text-gray-500 text-sm">
                  <strong>Email:</strong> <span>{userProfile.email}</span>
                  <strong>Role:</strong> <span className="capitalize">{userProfile.role}</span>
                  <strong>Member Since:</strong> <span>{new Date(userProfile.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="bg-blue-50 p-5 rounded-xl border border-blue-200">
                <p className="m-0 text-blue-900 text-sm">
                  ✨ <strong>Next Steps:</strong> Browse available supervisors, review their research areas, and submit your project application!
                </p>
              </div>
            </div>
          )}

          {userProfile.role === 'supervisor' && (
            <div className="bg-white p-10 rounded-xl border border-gray-200 text-center">
              <p className="text-gray-500 text-base">Supervisor interface coming soon...</p>
            </div>
          )}

          {userProfile.role === 'admin' && (
            <div className="bg-white p-10 rounded-xl border border-gray-200 text-center">
              <p className="text-gray-500 text-base">Admin interface coming soon...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}