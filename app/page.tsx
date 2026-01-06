'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/lib/contexts/AuthContext'
import { ROUTES } from '@/lib/routes'
import LandingPage from '@/app/components/LandingPage'
import LoadingSpinner from '@/app/components/LoadingSpinner'

export default function Home() {
  const router = useRouter()
  const { user, userProfile, isLoading, error } = useAuthContext()

  useEffect(() => {
    if (!isLoading && user && userProfile?.role) {
      // Redirect authenticated users directly to their role-specific page
      const role = userProfile.role
      switch (role) {
        case 'student':
          router.replace(ROUTES.AUTHENTICATED.STUDENT)
          return
        case 'supervisor':
          router.replace(ROUTES.AUTHENTICATED.SUPERVISOR)
          return
        case 'admin':
          router.replace(ROUTES.AUTHENTICATED.ADMIN)
          return
        default:
          console.warn(`Unknown role: ${role}`)
      }
    }
  }, [user, userProfile, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex-center">
        <LoadingSpinner message="Loading..." fullScreen={false} />
      </div>
    )
  }

  // Handle error state: if error exists, show error message and stop loading
  if (error) {
    console.error('Failed to fetch user profile:', error)
  }

  return <LandingPage />
}
