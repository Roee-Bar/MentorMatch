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

  // Fetch user profile with simple retry logic
  const fetchUserProfile = useCallback(async (firebaseUser: User): Promise<void> => {
    try {
      const token = await firebaseUser.getIdToken();
      const profile = await getUserProfile(firebaseUser.uid, token);
      
      if (profile?.success && profile?.data?.role) {
        setUserProfile(profile.data as BaseUser);
        setError(null);
      } else {
        setError(profile?.error || 'Failed to fetch user profile');
      }
    } catch (error: any) {
      setError(error?.message || 'Failed to fetch user profile');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Main auth state listener
  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setUserProfile(null);
        setError(null);
        setIsLoading(false);
        return;
      }

      setUser(firebaseUser);
      setIsLoading(true);
      setError(null);
      await fetchUserProfile(firebaseUser);
    });

    return () => unsubscribe();
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
    if (!user) throw new Error('Not authenticated');
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

