'use client';

// app/authenticated/supervisor/profile/page.tsx
// Supervisor Profile View - Read-only display of profile and capacity

import { useRouter } from 'next/navigation';
import { useSupervisorAuth, useAuthenticatedFetch } from '@/lib/hooks';
import { ROUTES } from '@/lib/routes';
import { apiClient } from '@/lib/api/client';
import CapacityIndicator from '@/app/components/shared/CapacityIndicator';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import PageLayout from '@/app/components/layout/PageLayout';
import PageHeader from '@/app/components/layout/PageHeader';
import ErrorState from '@/app/components/feedback/ErrorState';
import ProfileField from '@/app/components/display/ProfileField';
import { Supervisor } from '@/types/database';
import { btnPrimary } from '@/lib/styles/shared-styles';

export default function SupervisorProfilePage() {
  const router = useRouter();
  const { userId, isAuthLoading } = useSupervisorAuth();
  
  // Fetch supervisor profile using the new hook
  const { data: supervisor, loading: dataLoading, error } = useAuthenticatedFetch(
    async (token) => {
      if (!userId) return null;
      const response = await apiClient.getSupervisorById(userId, token);
      return response.data;
    },
    [userId]
  );

  // Show loading while auth is checking or data is loading
  if (isAuthLoading || dataLoading) {
    return <LoadingSpinner message="Loading profile..." />;
  }

  if (error || !supervisor) {
    return (
      <ErrorState
        message="Unable to load profile. Please try again later."
        action={{
          label: 'Back to Dashboard',
          onClick: () => router.push(ROUTES.AUTHENTICATED.SUPERVISOR)
        }}
      />
    );
  }

  return (
    <PageLayout variant="narrow">
      {/* Header */}
      <PageHeader
        title="Profile"
        description="View your profile information and supervision capacity"
        action={
          <button
            onClick={() => router.push(ROUTES.AUTHENTICATED.SUPERVISOR_PROFILE_EDIT)}
            className={btnPrimary}
          >
            Edit Profile
          </button>
        }
      />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Profile Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Personal Information</h2>
              
              <div className="space-y-4">
                <ProfileField label="Full Name" value={supervisor.fullName} />
                <ProfileField label="Email" value={supervisor.email} />
                {supervisor.phone && <ProfileField label="Phone" value={supervisor.phone} />}
                <ProfileField label="Department" value={supervisor.department} />
              </div>
            </div>

            {/* Bio */}
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Bio</h2>
              <p className="text-gray-700 leading-relaxed text-balance">{supervisor.bio}</p>
            </div>

            {/* Research Interests */}
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Research Interests</h2>
              <div className="flex flex-wrap gap-2">
                {supervisor.researchInterests.map((interest: string, index: number) => (
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
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Expertise Areas</h2>
              <div className="flex flex-wrap gap-2">
                {supervisor.expertiseAreas.map((area: string, index: number) => (
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
              <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Office Information</h2>
                
                <div className="space-y-4">
                  {supervisor.officeLocation && <ProfileField label="Location" value={supervisor.officeLocation} />}
                  {supervisor.officeHours && <ProfileField label="Office Hours" value={supervisor.officeHours} />}
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
    </PageLayout>
  );
}
