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
          
          // Try to fetch profile with retries
          let profile: any = null
          const maxRetries = 3
          
          for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
              const profilePromise = getUserProfile(user.uid, token)
              const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Profile fetch timeout')), 10000) // Increased timeout
              )
              
              profile = await Promise.race([profilePromise, timeoutPromise])
              
              if (profile?.success && profile?.data?.role) {
                break // Success, exit retry loop
              }
              
              // If profile fetch returned but without success, log it
              if (profile && !profile.success) {
                console.warn(`Profile fetch failed (attempt ${attempt + 1}/${maxRetries}):`, profile.error || 'Unknown error')
              }
            } catch (error: any) {
              console.warn(`Profile fetch error (attempt ${attempt + 1}/${maxRetries}):`, error?.message || error)
              profile = null
            }
            
            // Wait before retry (exponential backoff)
            if (attempt < maxRetries - 1 && mounted) {
              await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
              // Refresh token for next attempt
              try {
                const newToken = await user.getIdToken(true) // Force refresh
                // Update token for next iteration (token is already captured in closure)
              } catch {
                // Token refresh failed, continue with existing token
              }
            }
          }
          
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
                console.warn(`Unknown role: ${role}`)
                if (mounted) setLoading(false)
                return
            }
          } else {
            // Profile fetch failed after all retries
            console.error('Failed to fetch user profile after retries:', {
              success: profile?.success,
              error: profile?.error,
              hasData: !!profile?.data,
              hasRole: !!profile?.data?.role
            })
            if (mounted) setLoading(false)
          }
        } catch (error) {
          console.error('Error in auth state change handler:', error)
          if (mounted) setLoading(false)
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
