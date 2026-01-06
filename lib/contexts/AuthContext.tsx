'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { onAuthChange, getUserProfile } from '@/lib/auth';
import { BaseUser } from '@/types/database';

interface AuthContextType {
  // Firebase user
  user: User | null;
  // User profile from API
  userProfile: BaseUser | null;
  // Loading state
  isLoading: boolean;
  // Error state
  error: string | null;
  // Helper to get auth token
  getToken: () => Promise<string>;
  // Helper to refresh profile (if needed)
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<BaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user profile with retry logic (from app/page.tsx)
  const fetchUserProfile = useCallback(async (firebaseUser: User): Promise<void> => {
    const maxRetries = 3;

    try {
      const token = await firebaseUser.getIdToken();
      
      // Try to fetch profile with retries
      let profile: any = null;
      
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const profilePromise = getUserProfile(firebaseUser.uid, token);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Profile fetch timeout')), 10000)
          );
          
          profile = await Promise.race([profilePromise, timeoutPromise]);
          
          if (profile?.success && profile?.data?.role) {
            break; // Success, exit retry loop
          }
          
          // If profile fetch returned but without success, log it
          if (profile && !profile.success) {
            console.warn(`Profile fetch failed (attempt ${attempt + 1}/${maxRetries}):`, profile.error || 'Unknown error');
          }
        } catch (error: any) {
          console.warn(`Profile fetch error (attempt ${attempt + 1}/${maxRetries}):`, error?.message || error);
          profile = null;
        }
        
        // Wait before retry (exponential backoff)
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          // Refresh token for next attempt
          try {
            await firebaseUser.getIdToken(true); // Force refresh
          } catch {
            // Token refresh failed, continue with existing token
          }
        }
      }
      
      if (profile?.success && profile?.data?.role) {
        setUserProfile(profile.data as BaseUser);
        setError(null);
        setIsLoading(false);
      } else {
        // Profile fetch failed after all retries
        const errorMsg = profile?.error || 'Failed to fetch user profile after retries';
        console.error('Failed to fetch user profile after retries:', {
          success: profile?.success,
          error: errorMsg,
          hasData: !!profile?.data,
          hasRole: !!profile?.data?.role
        });
        setError(errorMsg);
        setIsLoading(false);
      }
    } catch (error: any) {
      console.error('Error in fetchUserProfile:', error);
      const errorMsg = error?.message || 'Failed to fetch user profile';
      setError(errorMsg);
      setIsLoading(false);
    }
  }, []);

  // Main auth state listener
  useEffect(() => {
    let mounted = true;
    let loadingTimeout: NodeJS.Timeout | null = null;

    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (!firebaseUser) {
        if (mounted) {
          setUser(null);
          setUserProfile(null);
          setError(null);
          setIsLoading(false);
        }
        return;
      }

      if (mounted) {
        setUser(firebaseUser);
        setIsLoading(true);
        setError(null);

        // Set 10-second timeout to prevent infinite loading
        loadingTimeout = setTimeout(() => {
          if (mounted) {
            console.warn('[AUTH CONTEXT] Loading timeout - setting loading to false');
            setIsLoading(false);
          }
        }, 10000);

        await fetchUserProfile(firebaseUser);

        // Clear timeout if profile fetch completed
        if (mounted && loadingTimeout) {
          clearTimeout(loadingTimeout);
          loadingTimeout = null;
        }
      }
    });

    return () => {
      mounted = false;
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
      unsubscribe();
    };
  }, [fetchUserProfile]);

  // Helper to get auth token
  const getToken = useCallback(async (): Promise<string> => {
    if (!user) {
      throw new Error('Not authenticated');
    }
    return await user.getIdToken();
  }, [user]);

  // Helper to refresh profile
  const refreshProfile = useCallback(async (): Promise<void> => {
    if (!user) {
      throw new Error('Not authenticated');
    }
    setIsLoading(true);
    setError(null);
    await fetchUserProfile(user);
  }, [user, fetchUserProfile]);

  const value: AuthContextType = {
    user,
    userProfile,
    isLoading,
    error,
    getToken,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook to use auth context
export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

