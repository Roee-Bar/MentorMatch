// lib/hooks/useSupervisorAuth.ts
// Custom hook for supervisor authentication - eliminates duplicated auth logic

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthChange, getUserProfile } from '@/lib/auth';
import { BaseUser } from '@/types/database';
import { ROUTES } from '@/lib/routes';

interface UseSupervisorAuthReturn {
  userId: string | null;
  userProfile: BaseUser | null;
  isAuthLoading: boolean;
}

/**
 * Custom hook that handles supervisor authentication.
 * Automatically redirects:
 * - Unauthenticated users to login
 * - Non-supervisors to their appropriate dashboard
 * 
 * @returns userId, userProfile, and loading state
 */
export function useSupervisorAuth(): UseSupervisorAuthReturn {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<BaseUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      if (!user) {
        router.replace(ROUTES.LOGIN);
        return;
      }

      // Get user profile to verify they're a supervisor
      const profile = await getUserProfile(user.uid);
      
      if (!profile.success || profile.data?.role !== 'supervisor') {
        // Redirect non-supervisors to appropriate dashboard
        if (profile.data?.role === 'student') {
          router.replace(ROUTES.DASHBOARD.STUDENT);
        } else if (profile.data?.role === 'admin') {
          router.replace(ROUTES.DASHBOARD.ADMIN);
        } else {
          router.replace(ROUTES.HOME);
        }
        return;
      }

      setUserId(user.uid);
      setUserProfile(profile.data as BaseUser);
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  return { userId, userProfile, isAuthLoading };
}

