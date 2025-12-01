'use client';

import { useEffect, useState } from 'react';
import { BaseUser } from '@/types/database';
import { apiClient } from '@/lib/api/client';
import { onAuthChange } from '@/lib/auth';
import { auth } from '@/lib/firebase';
import Link from 'next/link';
import UserProfile from '@/app/components/UserProfile';

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
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="text-center">User not found</div>
      </div>
    );
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
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <svg 
                  className="w-10 h-10 text-blue-600" 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                  <path d="M2 17l10 5 10-5"></path>
                  <path d="M2 12l10 5 10-5"></path>
                </svg>
                <h1 className="text-3xl font-bold text-gray-900">MentorMatch</h1>
              </Link>
            </div>
            <nav className="flex items-center gap-4">
              <Link 
                href="/" 
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Home
              </Link>
              <span className="text-blue-600 font-medium">Profile</span>
            </nav>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Link href="/" className="hover:text-blue-600 transition-colors">
            Home
          </Link>
          <svg 
            className="w-4 h-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-900 font-medium">My Profile</span>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Personal Profile</h2>
          <p className="text-gray-600">View your personal information and account details</p>
        </div>

        <UserProfile user={userForProfile} />
      </main>

      {/* Footer */}
      <footer className="mt-16 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-600">
            MentorMatch - Braude College of Engineering © 2025
          </p>
        </div>
      </footer>
    </div>
  );
}

