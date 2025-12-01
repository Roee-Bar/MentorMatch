'use client';

import { useEffect, useState } from 'react';
import { BaseUser } from '@/types/database';
import { apiClient } from '@/lib/api/client';
import { onAuthChange } from '@/lib/auth';
import { auth } from '@/lib/firebase';
import UserProfile from '@/app/components/UserProfile';
import PageHeader from '@/app/components/layout/PageHeader';
import Breadcrumb from '@/app/components/layout/Breadcrumb';
import PageFooter from '@/app/components/layout/PageFooter';
import LoadingPage from '@/app/components/feedback/LoadingPage';

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState<BaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (authUser) => {
      if (!authUser) {
        setLoading(false);
        return;
      }

      try {
        // Get Firebase ID token
        const token = await auth.currentUser?.getIdToken();
        if (!token) {
          setLoading(false);
          return;
        }

        // Call API endpoint
        const response = await apiClient.getUserById(authUser.uid, token);
        setCurrentUser(response.data);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <LoadingPage />;
  }

  if (!currentUser) {
    return <LoadingPage message="User not found" />;
  }

  // Map BaseUser to User type expected by UserProfile component
  const userForProfile = {
    id: (currentUser as any).id || '',
    name: currentUser.name,
    email: currentUser.email,
    role: currentUser.role,
    department: currentUser.department,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <PageHeader
        navigationItems={[
          { label: 'Home', href: '/', active: false },
          { label: 'Profile', href: '/profile', active: true },
        ]}
      />

      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'My Profile' },
        ]}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Personal Profile</h2>
          <p className="text-gray-600">View your personal information and account details</p>
        </div>

        <UserProfile user={userForProfile} />
      </main>

      <PageFooter />
    </div>
  );
}

