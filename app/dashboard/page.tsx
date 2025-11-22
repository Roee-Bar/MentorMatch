'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthChange, getUserProfile } from '@/lib/auth';

export default function DashboardRouter() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      if (!user) {
        router.replace('/');
        return;
      }

      const profile = await getUserProfile(user.uid);
      if (profile.success && profile.data) {
        const userRole = profile.data.role;
        
        // Route based on user role
        switch (userRole) {
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
      } else {
        router.replace('/');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Redirecting to dashboard...</p>
      </div>
    );
  }

  return null;
}

