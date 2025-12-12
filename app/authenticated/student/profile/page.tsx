'use client';

// app/authenticated/student/profile/page.tsx
// Student Profile View - Read-only display of profile and match status

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStudentAuth, useAuthenticatedFetch } from '@/lib/hooks';
import { ROUTES } from '@/lib/routes';
import { apiClient } from '@/lib/api/client';
import { auth } from '@/lib/firebase';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import StatusBadge from '@/app/components/shared/StatusBadge';
import PageLayout from '@/app/components/layout/PageLayout';
import PageHeader from '@/app/components/layout/PageHeader';
import ErrorState from '@/app/components/feedback/ErrorState';
import ProfileField from '@/app/components/display/ProfileField';
import StatusMessage from '@/app/components/feedback/StatusMessage';
import ConfirmModal from '@/app/components/shared/ConfirmModal';
import { Student, StudentCardData, SupervisorCardData } from '@/types/database';
import StudentCard from '@/app/components/shared/StudentCard';
import SupervisorCard from '@/app/components/shared/SupervisorCard';
import { btnPrimary, btnPrimaryFullWidth, cardBase } from '@/lib/styles/shared-styles';

export default function StudentProfilePage() {
  const router = useRouter();
  const { userId, isAuthLoading } = useStudentAuth();
  
  // Unpair confirmation state
  const [showUnpairConfirm, setShowUnpairConfirm] = useState(false);
  const [isUnpairing, setIsUnpairing] = useState(false);
  const [unpairError, setUnpairError] = useState<string | null>(null);
  
  // Fetch student profile and related data using the new hook
  const { data: profileData, loading: dataLoading, error } = useAuthenticatedFetch(
    async (token) => {
      if (!userId) return null;

      const response = await apiClient.getStudentById(userId, token);
      if (!response.data) return null;

      const student = response.data;
      let partnerDetails: StudentCardData | null = null;
      let supervisorDetails: SupervisorCardData | null = null;

      // Fetch partner details if paired
      if (student.partnerId) {
        try {
          const partnerRes = await apiClient.getPartnerDetails(student.partnerId, token);
          if (partnerRes.data) {
            partnerDetails = {
              id: partnerRes.data.id,
              fullName: partnerRes.data.fullName,
              studentId: partnerRes.data.studentId,
              department: partnerRes.data.department,
              email: partnerRes.data.email,
              skills: partnerRes.data.skills,
              interests: partnerRes.data.interests,
              preferredTopics: partnerRes.data.preferredTopics,
              previousProjects: partnerRes.data.previousProjects,
              partnershipStatus: partnerRes.data.partnershipStatus,
              partnerId: partnerRes.data.partnerId,
            };
          }
        } catch (err) {
          console.error('Error fetching partner details:', err);
        }
      }

      // Fetch supervisor details if matched
      if (student.assignedSupervisorId) {
        try {
          const supervisorRes = await apiClient.getSupervisorById(student.assignedSupervisorId, token);
          if (supervisorRes.data) {
            supervisorDetails = {
              id: supervisorRes.data.id,
              name: supervisorRes.data.fullName,
              department: supervisorRes.data.department,
              bio: supervisorRes.data.bio,
              expertiseAreas: supervisorRes.data.expertiseAreas,
              researchInterests: supervisorRes.data.researchInterests,
              availabilityStatus: supervisorRes.data.availabilityStatus,
              currentCapacity: `${supervisorRes.data.currentCapacity}/${supervisorRes.data.maxCapacity} projects`,
              contact: supervisorRes.data.email,
            };
          }
        } catch (err) {
          console.error('Error fetching supervisor details:', err);
        }
      }

      return { student, partnerDetails, supervisorDetails };
    },
    [userId]
  );

  const student = profileData?.student || null;
  const partnerDetails = profileData?.partnerDetails || null;
  const supervisorDetails = profileData?.supervisorDetails || null;

  // Handle unpair confirmation
  const handleConfirmUnpair = async () => {
    setIsUnpairing(true);
    setUnpairError(null);
    
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');
      
      await apiClient.unpairFromPartner(token);
      
      // Refresh the page or refetch data
      window.location.reload();
    } catch (error) {
      console.error('Error unpairing:', error);
      setUnpairError('Failed to unpair. Please try again.');
      setShowUnpairConfirm(false);
      setIsUnpairing(false);
    }
  };

  // Show loading while auth is checking or data is loading
  if (isAuthLoading || dataLoading) {
    return <LoadingSpinner message="Loading profile..." />;
  }

  if (error || !student) {
    return (
      <ErrorState
        message="Unable to load profile. Please try again later."
        action={{
          label: 'Back to Dashboard',
          onClick: () => router.push(ROUTES.AUTHENTICATED.STUDENT)
        }}
      />
    );
  }

  return (
    <PageLayout variant="narrow">
      {/* Error Message */}
      {unpairError && (
        <StatusMessage 
          message={unpairError} 
          type="error"
          className="mb-4"
        />
      )}

      {/* Header */}
      <PageHeader
        title="Profile"
        description="View your profile information and match status"
        action={
          <button
            onClick={() => router.push(ROUTES.AUTHENTICATED.STUDENT_PROFILE_EDIT)}
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
            <div className={cardBase}>
              <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100 mb-4">Personal Information</h2>
              
              <div className="space-y-4">
                <ProfileField label="Full Name" value={student.fullName} />
                <ProfileField label="Email" value={student.email} />
                <ProfileField label="Student ID" value={student.studentId} />
                {student.phone && <ProfileField label="Phone" value={student.phone} />}
                <ProfileField label="Department" value={student.department} />
              </div>
            </div>

            {/* Academic Information */}
            <div className={cardBase}>
              <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100 mb-4">Academic Information</h2>
              
              <div className="space-y-4">
                {student.skills && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-slate-400">Skills</label>
                    <p className="text-gray-800 dark:text-slate-200 mt-1 text-balance">{student.skills}</p>
                  </div>
                )}
                {student.interests && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-slate-400">Interests</label>
                    <p className="text-gray-800 dark:text-slate-200 mt-1 text-balance">{student.interests}</p>
                  </div>
                )}
                {student.previousProjects && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-slate-400">Previous Projects</label>
                    <p className="text-gray-800 dark:text-slate-200 mt-1 text-balance">{student.previousProjects}</p>
                  </div>
                )}
                {student.preferredTopics && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-slate-400">Preferred Topics</label>
                    <p className="text-gray-800 dark:text-slate-200 mt-1 text-balance">{student.preferredTopics}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Partner Information */}
            {student.hasPartner && (
              <div className={cardBase}>
                <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100 mb-4">Partner Information</h2>
                
                <div className="space-y-4">
                  {student.partnerName && <ProfileField label="Partner Name" value={student.partnerName} />}
                  {student.partnerEmail && <ProfileField label="Partner Email" value={student.partnerEmail} />}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Match Status */}
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200 dark:bg-slate-800 dark:border-slate-700">
              <h2 className="text-lg font-bold text-gray-800 mb-4 dark:text-slate-100">Match Status</h2>
              
              <div className="flex items-center justify-center">
                <StatusBadge
                  status={student.matchStatus}
                  variant="custom"
                  customClassName={
                    student.matchStatus === 'matched' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    student.matchStatus === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                    'bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-200'
                  }
                  customLabel={student.matchStatus.charAt(0).toUpperCase() + student.matchStatus.slice(1)}
                />
              </div>
              
              {student.matchStatus === 'matched' && student.assignedSupervisorId && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                  {supervisorDetails ? (
                    <>
                      <p className="text-sm text-gray-600 dark:text-slate-400 mb-3 text-center">
                        You have been matched with:
                      </p>
                      <SupervisorCard
                        supervisor={supervisorDetails}
                        showApplyButton={false}
                      />
                    </>
                  ) : (
                    <p className="text-sm text-red-600 text-center">
                      Unable to load supervisor details. Please try again later.
                    </p>
                  )}
                </div>
              )}
              
              {student.matchStatus === 'pending' && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                  <p className="text-sm text-gray-600 dark:text-slate-400 text-center">
                    Your application is being reviewed
                  </p>
                </div>
              )}
              
              {student.matchStatus === 'unmatched' && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                  <p className="text-sm text-gray-600 dark:text-slate-400 text-center">
                    Browse available supervisors and submit an application
                  </p>
                  <button
                    onClick={() => router.push(ROUTES.AUTHENTICATED.STUDENT)}
                    className={`${btnPrimaryFullWidth} mt-2`}
                  >
                    Browse Supervisors
                  </button>
                </div>
              )}
            </div>

            {/* Partnership Status */}
            <div className={cardBase}>
              <h2 className="text-lg font-bold text-gray-800 dark:text-slate-100 mb-4">Partnership Status</h2>
              
              <div className="flex-center">
                <StatusBadge
                  status={student.partnershipStatus}
                  variant="partnership"
                />
              </div>
              
              {student.partnerId && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                  {partnerDetails ? (
                    <>
                      <p className="text-sm text-gray-600 dark:text-slate-400 mb-3 text-center">
                        Paired with:
                      </p>
                      <StudentCard
                        student={partnerDetails}
                        showRequestButton={false}
                        isCurrentPartner={true}
                        onUnpair={() => setShowUnpairConfirm(true)}
                      />
                    </>
                  ) : (
                    <p className="text-sm text-red-600 text-center">
                      Unable to load partner details. Please try again later.
                    </p>
                  )}
                </div>
              )}
              
              {!student.partnerId && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                  <p className="text-sm text-gray-600 dark:text-slate-400 text-center mb-2">
                    Find a project partner
                  </p>
                  <button
                    onClick={() => router.push(ROUTES.AUTHENTICATED.STUDENT)}
                    className={btnPrimaryFullWidth}
                  >
                    Browse Students
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

      {/* Unpair Confirmation Modal */}
      <ConfirmModal
        isOpen={showUnpairConfirm}
        title="Confirm Unpair"
        message="Are you sure you want to unpair from your partner? This action cannot be undone."
        confirmLabel="Yes, Unpair"
        cancelLabel="Cancel"
        onConfirm={handleConfirmUnpair}
        onCancel={() => setShowUnpairConfirm(false)}
        isLoading={isUnpairing}
      />
    </PageLayout>
  );
}

