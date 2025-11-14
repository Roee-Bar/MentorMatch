'use client'

import React, { useState, useEffect } from 'react'
import { onAuthChange, signIn, signOut, getUserProfile } from '@/lib/auth'
import { User } from 'firebase/auth'
import StudentRegistration from '@/app/register'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentView, setCurrentView] = useState<'landing' | 'login' | 'signup'>('landing')

  // Check authentication state on mount
  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      setUser(user)
      if (user) {
        // Load user profile from Firestore
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

  // Show loading state
  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '10px' }}>Loading MentorMatch...</h2>
          <div style={{ 
            width: '50px', 
            height: '50px', 
            border: '5px solid rgba(255,255,255,0.3)',
            borderTop: '5px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
        </div>
      </div>
    )
  }

  // If user is logged in, show dashboard based on role
  if (user && userProfile) {
    return <Dashboard user={user} userProfile={userProfile} />
  }

  // Show appropriate view based on currentView state
  if (currentView === 'login') {
    return <LoginPage setCurrentView={setCurrentView} />
  }

  if (currentView === 'signup') {
    return <StudentRegistration setCurrentView={setCurrentView} />
  }

  // Default: Show landing page
  return <LandingPage setCurrentView={setCurrentView} />
}

// Landing Page Component
function LandingPage({ setCurrentView }: { setCurrentView: (view: 'landing' | 'login' | 'signup') => void }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        padding: '20px 50px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: 'white'
      }}>
        <h1 style={{ fontSize: '28px', margin: 0 }}>
          🎓 MentorMatch
        </h1>
        <button
          onClick={() => setCurrentView('login')}
          style={{
            padding: '10px 30px',
            background: 'white',
            color: '#667eea',
            border: 'none',
            borderRadius: '25px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '16px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}
        >
          Login
        </button>
      </header>

      {/* Hero Section */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '50px 20px',
        textAlign: 'center',
        color: 'white'
      }}>
        <h2 style={{
          fontSize: '48px',
          fontWeight: 'bold',
          marginBottom: '20px',
          textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
        }}>
          Find Your Perfect Project Supervisor
        </h2>
        
        <p style={{
          fontSize: '20px',
          marginBottom: '40px',
          maxWidth: '600px',
          lineHeight: '1.6',
          opacity: 0.95
        }}>
          Connect with experienced supervisors, browse project topics, and streamline your capstone project matching process at Braude College.
        </p>

        <div style={{ display: 'flex', gap: '20px', marginBottom: '50px' }}>
          <button
            onClick={() => setCurrentView('signup')}
            style={{
              padding: '15px 40px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '30px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '18px',
              boxShadow: '0 6px 12px rgba(0,0,0,0.2)',
              transition: 'transform 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            Sign Up as Student
          </button>
          
          <button
            onClick={() => setCurrentView('login')}
            style={{
              padding: '15px 40px',
              background: 'transparent',
              color: 'white',
              border: '2px solid white',
              borderRadius: '30px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '18px',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'white'
              e.currentTarget.style.color = '#667eea'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'white'
            }}
          >
            I'm a Supervisor/Admin
          </button>
        </div>

        {/* Features */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '30px',
          maxWidth: '900px',
          marginTop: '50px'
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            padding: '30px',
            borderRadius: '15px',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '15px' }}>🔍</div>
            <h3 style={{ marginBottom: '10px', fontSize: '20px' }}>Browse Supervisors</h3>
            <p style={{ fontSize: '14px', opacity: 0.9 }}>
              Explore supervisor profiles, research areas, and available project topics
            </p>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.1)',
            padding: '30px',
            borderRadius: '15px',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '15px' }}>📝</div>
            <h3 style={{ marginBottom: '10px', fontSize: '20px' }}>Apply Easily</h3>
            <p style={{ fontSize: '14px', opacity: 0.9 }}>
              Submit structured applications with your skills and project ideas
            </p>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.1)',
            padding: '30px',
            borderRadius: '15px',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '15px' }}>⚡</div>
            <h3 style={{ marginBottom: '10px', fontSize: '20px' }}>Track Status</h3>
            <p style={{ fontSize: '14px', opacity: 0.9 }}>
              Monitor your applications and get real-time updates on responses
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        padding: '20px',
        textAlign: 'center',
        color: 'rgba(255,255,255,0.8)',
        fontSize: '14px'
      }}>
        <p>© 2024 MentorMatch - Braude College of Engineering</p>
      </footer>
    </div>
  )
}

// Login Page Component
function LoginPage({ setCurrentView }: { setCurrentView: (view: 'landing' | 'login' | 'signup') => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const result = await signIn(email, password)
    if (result.success) {
      setMessage('✅ Login successful!')
      // Page will automatically redirect to dashboard via useEffect in Home
    } else {
      setMessage(`❌ ${result.error}`)
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        maxWidth: '450px',
        width: '100%'
      }}>
        <button
          onClick={() => setCurrentView('landing')}
          style={{
            background: 'none',
            border: 'none',
            color: '#667eea',
            cursor: 'pointer',
            fontSize: '14px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          ← Back to Home
        </button>

        <h1 style={{ color: '#667eea', marginBottom: '10px', fontSize: '32px' }}>Welcome Back</h1>
        <p style={{ color: '#6b7280', marginBottom: '30px' }}>Login to your MentorMatch account</p>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#374151' }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '2px solid #e5e7eb',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#374151' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '2px solid #e5e7eb',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              fontSize: '16px',
              opacity: loading ? 0.7 : 1,
              transition: 'opacity 0.2s'
            }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

          {message && (
            <div style={{
              marginTop: '20px',
              padding: '12px',
              borderRadius: '8px',
              background: message.includes('✅') ? '#d1fae5' : '#fee2e2',
              color: message.includes('✅') ? '#065f46' : '#991b1b',
              textAlign: 'center',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              {message}
            </div>
          )}
        </form>

        <div style={{ marginTop: '25px', textAlign: 'center', color: '#6b7280' }}>
          <p>
            Don't have an account?{' '}
            <button
              onClick={() => setCurrentView('signup')}
              style={{
                background: 'none',
                border: 'none',
                color: '#667eea',
                cursor: 'pointer',
                fontWeight: 'bold',
                textDecoration: 'underline'
              }}
            >
              Sign up as Student
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

// Dashboard Component - Shows different view based on role
function Dashboard({ user, userProfile }: { user: User, userProfile: any }) {
  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '20px 50px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <div>
          <h1 style={{ margin: '0 0 5px 0', fontSize: '24px' }}>🎓 MentorMatch</h1>
          <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>
            {userProfile.name} - {userProfile.role.toUpperCase()}
          </p>
        </div>
        <button
          onClick={handleSignOut}
          style={{
            padding: '10px 25px',
            background: 'rgba(255,255,255,0.2)',
            color: 'white',
            border: '2px solid white',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'white'
            e.currentTarget.style.color = '#667eea'
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.2)'
            e.currentTarget.style.color = 'white'
          }}
        >
          Logout
        </button>
      </header>

      {/* Content based on role */}
      <main style={{ padding: '40px 50px' }}>
        {userProfile.role === 'student' && (
          <div>
            <h2 style={{ fontSize: '28px', marginBottom: '20px', color: '#1f2937' }}>Student Dashboard</h2>
            <p style={{ color: '#6b7280', marginBottom: '30px' }}>Welcome! Browse supervisors and apply for projects.</p>
            
            <div style={{ background: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <h3 style={{ marginBottom: '15px', color: '#374151' }}>Your Profile Summary</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '10px', color: '#6b7280' }}>
                <strong>Email:</strong> <span>{userProfile.email}</span>
                <strong>Role:</strong> <span>{userProfile.role}</span>
                <strong>Joined:</strong> <span>{new Date(userProfile.createdAt?.seconds * 1000).toLocaleDateString()}</span>
              </div>
              <div style={{ marginTop: '20px', padding: '15px', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                <p style={{ margin: 0, color: '#1e40af' }}>
                  ✨ <strong>Next Steps:</strong> Browse available supervisors, review their research areas, and submit your project application!
                </p>
              </div>
            </div>
          </div>
        )}

        {userProfile.role === 'supervisor' && (
          <div>
            <h2 style={{ fontSize: '28px', marginBottom: '20px', color: '#1f2937' }}>Supervisor Dashboard</h2>
            <p style={{ color: '#6b7280', marginBottom: '30px' }}>Manage your project topics and review student applications.</p>
            
            <div style={{ background: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <p>Supervisor interface coming soon...</p>
            </div>
          </div>
        )}

        {userProfile.role === 'admin' && (
          <div>
            <h2 style={{ fontSize: '28px', marginBottom: '20px', color: '#1f2937' }}>Admin Dashboard</h2>
            <p style={{ color: '#6b7280', marginBottom: '30px' }}>Manage users, monitor the matching process, and oversee the system.</p>
            
            <div style={{ background: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <p>Admin interface coming soon...</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
