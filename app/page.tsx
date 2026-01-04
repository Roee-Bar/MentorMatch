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
    const unsubscribe = onAuthChange(async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken()
          const profile = await getUserProfile(user.uid, token)
          if (profile.success && profile.data?.role) {
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
                setLoading(false)
                return
            }
          } else {
            // If profile fetch failed, try to redirect anyway after a delay
            // This handles cases where API might be slow
            setTimeout(() => {
              setLoading(false)
            }, 2000)
          }
        } catch (error) {
          // If there's an error, still try to redirect after a delay
          console.error('Error getting user profile:', error)
          setTimeout(() => {
            setLoading(false)
          }, 2000)
        }
      } else {
        setLoading(false)
      }
    })
    return () => unsubscribe()
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
