'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardRouter() {
  const router = useRouter();

  useEffect(() => {
    // Default redirect to student dashboard for now
    router.replace('/dashboard/student');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Redirecting to dashboard...</p>
    </div>
  );
}

