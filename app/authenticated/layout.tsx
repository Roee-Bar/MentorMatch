'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthChange, getUserProfile } from '@/lib/auth';
import { User } from 'firebase/auth';
import LoadingSpinner from '@/app/components/LoadingSpinner';

interface AuthenticatedLayoutProps {
  children: ReactNode;
}

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      if (!user) {
        router.replace('/');
        return;
      }

      const token = await user.getIdToken();
      const profile = await getUserProfile(user.uid, token);
      if (profile.success) {
        setUser(user);
        setUserProfile(profile.data);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return <LoadingSpinner message="Loading..." />;
  }

  return <div className="min-h-screen bg-gray-50 dark:bg-slate-900">{children}</div>;
}
