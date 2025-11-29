'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthChange, getUserProfile } from '@/lib/auth';

export default function DashboardRouter() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      if (!user) {
        // Redirect unauthenticated users to home
        router.replace('/');
        return;
      }

      // Get user profile to determine role
      const profile = await getUserProfile(user.uid);
      
      if (!profile.success || !profile.data) {
        router.replace('/');
        return;
      }

      // Redirect based on user role
      switch (profile.data.role) {
        case 'student':
          router.replace('/dashboard/student');
          break;
        case 'supervisor':
          router.replace('/dashboard/supervisor');
          break;
        case 'admin':
          router.replace('/dashboard/admin');
          break;
        default:
          router.replace('/');
      }
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <div className="loading-container">
      <p className="text-gray-500">Redirecting to dashboard...</p>
    </div>
  );
}

