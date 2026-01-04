'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthChange, getUserProfile } from '@/lib/auth'
import LandingPage from '@/app/components/LandingPage'
import LoadingSpinner from '@/app/components/LoadingSpinner'

export default function Home() {
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    let mounted = true
    const unsubscribe = onAuthChange(async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken()
          // Add timeout for profile fetch
          const profilePromise = getUserProfile(user.uid, token)
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
          )
          
          const profile = await Promise.race([profilePromise, timeoutPromise]).catch(() => null) as any
          
          if (mounted && profile?.success && profile?.data?.role) {
            // Redirect authenticated users directly to their role-specific page
            const role = profile.data.role
            switch (role) {
              case 'student':
                router.replace('/authenticated/student')
                return
              case 'supervisor':
                router.replace('/authenticated/supervisor')
                return
              case 'admin':
                router.replace('/authenticated/admin')
                return
              default:
                if (mounted) setLoading(false)
                return
            }
          } else {
            // If profile fetch failed or timed out, retry once after a short delay
            if (mounted) {
              setTimeout(async () => {
                if (!mounted) return
                try {
                  const retryToken = await user.getIdToken()
                  const retryProfile = await getUserProfile(user.uid, retryToken)
                  if (retryProfile.success && retryProfile.data?.role && mounted) {
                    const role = retryProfile.data.role
                    switch (role) {
                      case 'student':
                        router.replace('/authenticated/student')
                        break
                      case 'supervisor':
                        router.replace('/authenticated/supervisor')
                        break
                      case 'admin':
                        router.replace('/authenticated/admin')
                        break
                      default:
                        setLoading(false)
                    }
                  } else if (mounted) {
                    setLoading(false)
                  }
                } catch {
                  if (mounted) setLoading(false)
                }
              }, 1000)
            }
          }
        } catch (error) {
          // If there's an error, retry once after a delay
          console.error('Error getting user profile:', error)
          if (mounted) {
            setTimeout(async () => {
              if (!mounted) return
              try {
                const retryToken = await user.getIdToken()
                const retryProfile = await getUserProfile(user.uid, retryToken)
                if (retryProfile.success && retryProfile.data?.role && mounted) {
                  const role = retryProfile.data.role
                  switch (role) {
                    case 'student':
                      router.replace('/authenticated/student')
                      break
                    case 'supervisor':
                      router.replace('/authenticated/supervisor')
                      break
                    case 'admin':
                      router.replace('/authenticated/admin')
                      break
                    default:
                      setLoading(false)
                  }
                } else if (mounted) {
                  setLoading(false)
                }
              } catch {
                if (mounted) setLoading(false)
              }
            }, 1000)
          }
        }
      } else {
        if (mounted) setLoading(false)
      }
    })
    return () => {
      mounted = false
      unsubscribe()
    }
  }, [router])

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex-center">
        <LoadingSpinner message="Loading..." fullScreen={false} />
      </div>
    )
  }

  return <LandingPage />
}
