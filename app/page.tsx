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
          const isTestEnv = typeof window !== 'undefined' && (process.env.NEXT_PUBLIC_NODE_ENV === 'test' || process.env.NEXT_PUBLIC_E2E_TEST === 'true');
          
          for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
              // #region agent log
              if (isTestEnv) {
                fetch('http://127.0.0.1:7243/ingest/b58b9ea6-ea87-472c-b297-772b0ab30cc5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/page.tsx:24',message:'getUserProfile attempt',data:{uid:user.uid,attempt:attempt+1,maxRetries,hasToken:!!token},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'F'})}).catch(()=>{});
              }
              // #endregion
              const profilePromise = getUserProfile(user.uid, token)
              const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Profile fetch timeout')), 10000) // Increased timeout
              )
              
              profile = await Promise.race([profilePromise, timeoutPromise])
              
              // #region agent log
              if (isTestEnv) {
                fetch('http://127.0.0.1:7243/ingest/b58b9ea6-ea87-472c-b297-772b0ab30cc5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/page.tsx:33',message:'getUserProfile result',data:{success:profile?.success,hasData:!!profile?.data,hasRole:!!profile?.data?.role,error:profile?.error},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'F'})}).catch(()=>{});
              }
              // #endregion
              
              if (profile?.success && profile?.data?.role) {
                break // Success, exit retry loop
              }
              
              // If profile fetch returned but without success, log it
              if (profile && !profile.success) {
                console.warn(`Profile fetch failed (attempt ${attempt + 1}/${maxRetries}):`, profile.error || 'Unknown error')
              }
            } catch (error: any) {
              // #region agent log
              if (isTestEnv) {
                fetch('http://127.0.0.1:7243/ingest/b58b9ea6-ea87-472c-b297-772b0ab30cc5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/page.tsx:42',message:'getUserProfile exception',data:{attempt:attempt+1,error:error?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'F'})}).catch(()=>{});
              }
              // #endregion
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
            // #region agent log
            if (isTestEnv) {
              fetch('http://127.0.0.1:7243/ingest/b58b9ea6-ea87-472c-b297-772b0ab30cc5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/page.tsx:59',message:'About to redirect',data:{role:profile.data.role,mounted},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H'})}).catch(()=>{});
            }
            // #endregion
            // Redirect authenticated users directly to their role-specific page
            const role = profile.data.role
            switch (role) {
              case 'student':
                // #region agent log
                if (isTestEnv) {
                  fetch('http://127.0.0.1:7243/ingest/b58b9ea6-ea87-472c-b297-772b0ab30cc5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/page.tsx:65',message:'Redirecting to student dashboard',data:{role},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H'})}).catch(()=>{});
                }
                // #endregion
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
            // #region agent log
            if (isTestEnv) {
              fetch('http://127.0.0.1:7243/ingest/b58b9ea6-ea87-472c-b297-772b0ab30cc5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/page.tsx:77',message:'Profile fetch failed',data:{success:profile?.success,hasData:!!profile?.data,hasRole:!!profile?.data?.role,error:profile?.error},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H'})}).catch(()=>{});
            }
            // #endregion
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
