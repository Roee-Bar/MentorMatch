'use client';

// app/authenticated/supervisor/profile/page.tsx
// Supervisor Profile View - Read-only display of profile and capacity

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupervisorAuth } from '@/lib/hooks';
import { ROUTES } from '@/lib/routes';
import { apiClient } from '@/lib/api/client';
import { auth } from '@/lib/firebase';
import CapacityIndicator from '@/app/components/authenticated/CapacityIndicator';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { Supervisor } from '@/types/database';

export default function SupervisorProfilePage() {
  const router = useRouter();
  const { userId, isAuthLoading } = useSupervisorAuth();
  
  const [dataLoading, setDataLoading] = useState(true);
  const [supervisor, setSupervisor] = useState<Supervisor | null>(null);
  const [error, setError] = useState(false);

  // Fetch supervisor profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;

      try {
        // Get Firebase ID token
        const token = await auth.currentUser?.getIdToken();
        if (!token) {
          router.push('/login');
          return;
        }

        // Call API endpoint
        const response = await apiClient.getSupervisorById(userId, token);
        if (response.data) {
          setSupervisor(response.data);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(true);
      } finally {
        setDataLoading(false);
      }
    };

    if (userId) {
      fetchProfile();
    }
  }, [userId, router]);

  // Show loading while auth is checking or data is loading
  if (isAuthLoading || dataLoading) {
    return <LoadingSpinner message="Loading profile..." />;
  }

  if (error || !supervisor) {
    return (
      <div className="error-container">
        <div className="error-content">
          <p className="error-text">Unable to load profile. Please try again later.</p>
          <button
            onClick={() => router.push(ROUTES.AUTHENTICATED.SUPERVISOR)}
            className="btn-primary"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-content-narrow">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 text-balance">Profile</h1>
          <p className="text-gray-600">
            View your profile information and supervision capacity
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Profile Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="card-base">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Personal Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Full Name</label>
                  <p className="text-gray-800 mt-1">{supervisor.fullName}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-gray-800 mt-1">{supervisor.email}</p>
                </div>
                
                {supervisor.phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Phone</label>
                    <p className="text-gray-800 mt-1">{supervisor.phone}</p>
                  </div>
                )}
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Department</label>
                  <p className="text-gray-800 mt-1">{supervisor.department}</p>
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="card-base">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Bio</h2>
              <p className="text-gray-700 leading-relaxed text-balance">{supervisor.bio}</p>
            </div>

            {/* Research Interests */}
            <div className="card-base">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Research Interests</h2>
              <div className="flex flex-wrap gap-2">
                {supervisor.researchInterests.map((interest, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>

            {/* Expertise Areas */}
            <div className="card-base">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Expertise Areas</h2>
              <div className="flex flex-wrap gap-2">
                {supervisor.expertiseAreas.map((area, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>

            {/* Office Information */}
            {(supervisor.officeLocation || supervisor.officeHours) && (
              <div className="card-base">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Office Information</h2>
                
                <div className="space-y-4">
                  {supervisor.officeLocation && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Location</label>
                      <p className="text-gray-800 mt-1">{supervisor.officeLocation}</p>
                    </div>
                  )}
                  
                  {supervisor.officeHours && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Office Hours</label>
                      <p className="text-gray-800 mt-1">{supervisor.officeHours}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Capacity Indicator */}
            <CapacityIndicator
              current={supervisor.currentCapacity}
              max={supervisor.maxCapacity}
              status={supervisor.availabilityStatus}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
