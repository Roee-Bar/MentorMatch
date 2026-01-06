// lib/hooks/useAuth.ts
// Consolidated authentication hook for all user roles

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/lib/contexts/AuthContext';
import { BaseUser } from '@/types/database';
import { ROUTES } from '@/lib/routes';

/**
 * Role-based route mapping for redirects
 */
const ROLE_ROUTES = {
  student: ROUTES.AUTHENTICATED.STUDENT,
  supervisor: ROUTES.AUTHENTICATED.SUPERVISOR,
  admin: ROUTES.AUTHENTICATED.ADMIN,
} as const;

type UserRole = keyof typeof ROLE_ROUTES;

/**
 * Options for the useAuth hook
 */
interface UseAuthOptions {
  /** Expected role for this page. If user has different role, they will be redirected. */
  expectedRole?: UserRole;
}

/**
 * Return type for the useAuth hook
 */
interface UseAuthReturn {
  /** Current user's ID, null if not authenticated */
  userId: string | null;
  /** Current user's profile data */
  userProfile: BaseUser | null;
  /** Whether authentication is still being checked */
  isAuthLoading: boolean;
  /** Helper function to get the current user's auth token */
  getToken: () => Promise<string>;
}

/**
 * Consolidated authentication hook that handles:
 * - Authentication state management
 * - Role-based redirects
 * - Token retrieval
 * 
 * @param options - Configuration options including expectedRole for page access control
 * @returns Authentication state and helper functions
 * 
 * @example
 * // Student page - redirects non-students
 * const { userId, isAuthLoading, getToken } = useAuth({ expectedRole: 'student' });
 * 
 * @example
 * // Supervisor page - redirects non-supervisors
 * const { userId, userProfile, isAuthLoading } = useAuth({ expectedRole: 'supervisor' });
 * 
 * @example
 * // Admin page - redirects non-admins
 * const { userId, isAuthLoading } = useAuth({ expectedRole: 'admin' });
 */
export function useAuth(options?: UseAuthOptions): UseAuthReturn {
  const router = useRouter();
  const { user, userProfile, isLoading, getToken } = useAuthContext();

  // Handle role-based redirects
  useEffect(() => {
    if (isLoading) {
      return; // Wait for auth to finish loading
    }

    // If no user, redirect to login
    if (!user) {
      router.replace(ROUTES.LOGIN);
      return;
    }

    // If profile fetch failed, redirect to home
    if (!userProfile) {
      router.replace(ROUTES.HOME);
      return;
    }

    const userRole = userProfile.role as UserRole;

    // If expectedRole is specified, check if user has the correct role
    if (options?.expectedRole && userRole !== options.expectedRole) {
      // Redirect to the appropriate page based on user's actual role
      const redirectTo = ROLE_ROUTES[userRole] || ROUTES.HOME;
      router.replace(redirectTo);
      return;
    }
  }, [user, userProfile, isLoading, options?.expectedRole, router]);

  return {
    userId: user?.uid || null,
    userProfile: userProfile,
    isAuthLoading: isLoading,
    getToken,
  };
}

