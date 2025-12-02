// lib/hooks/useStudentAuth.ts
// Custom hook for student authentication - eliminates duplicated auth logic

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthChange, getUserProfile } from '@/lib/auth';
import { BaseUser } from '@/types/database';
import { ROUTES } from '@/lib/routes';

interface UseStudentAuthReturn {
  userId: string | null;
  userProfile: BaseUser | null;
  isAuthLoading: boolean;
}

/**
 * Custom hook that handles student authentication.
 * Automatically redirects:
 * - Unauthenticated users to login
 * - Non-students to their appropriate authenticated page
 * 
 * @returns userId, userProfile, and loading state
 */
export function useStudentAuth(): UseStudentAuthReturn {
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

      // Get user profile to verify they're a student
      const token = await user.getIdToken();
      const profile = await getUserProfile(user.uid, token);
      
      if (!profile.success || profile.data?.role !== 'student') {
        // Redirect non-students to appropriate authenticated page
        if (profile.data?.role === 'supervisor') {
          router.replace(ROUTES.AUTHENTICATED.SUPERVISOR);
        } else if (profile.data?.role === 'admin') {
          router.replace(ROUTES.AUTHENTICATED.ADMIN);
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

