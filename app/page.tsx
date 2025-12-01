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
        const profile = await getUserProfile(user.uid)
        if (profile.success) {
          // Redirect authenticated users directly to their role-specific page
          const role = profile.data?.role
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
          return
        }
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
        <LoadingSpinner message="Loading..." fullScreen={false} />
      </div>
    )
  }

  return <LandingPage />
}
