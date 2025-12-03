'use client';

// app/authenticated/student/profile/page.tsx
// Student Profile View - Read-only display of profile and match status

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStudentAuth } from '@/lib/hooks';
import { ROUTES } from '@/lib/routes';
import { apiClient } from '@/lib/api/client';
import { auth } from '@/lib/firebase';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { Student, StudentCardData, SupervisorCardData } from '@/types/database';
import StudentCard from '@/app/components/shared/StudentCard';
import SupervisorCard from '@/app/components/shared/SupervisorCard';

export default function StudentProfilePage() {
  const router = useRouter();
  const { userId, isAuthLoading } = useStudentAuth();
  
  const [dataLoading, setDataLoading] = useState(true);
  const [student, setStudent] = useState<Student | null>(null);
  const [partnerDetails, setPartnerDetails] = useState<StudentCardData | null>(null);
  const [supervisorDetails, setSupervisorDetails] = useState<SupervisorCardData | null>(null);
  const [error, setError] = useState(false);

  // Fetch student profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;

      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) {
          router.push(ROUTES.LOGIN);
          return;
        }

        const response = await apiClient.getStudentById(userId, token);
        if (response.data) {
          setStudent(response.data);
          
          // Fetch partner details if paired
          if (response.data.partnerId) {
            try {
              const partnerRes = await apiClient.getPartnerDetails(response.data.partnerId, token);
              // Transform Student data to StudentCardData format
              if (partnerRes.data) {
                setPartnerDetails({
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
                });
              }
            } catch (err) {
              console.error('Error fetching partner details:', err);
              setPartnerDetails(null);
            }
          }
          
          // Fetch supervisor details if matched
          if (response.data.assignedSupervisorId) {
            try {
              const supervisorRes = await apiClient.getSupervisorById(response.data.assignedSupervisorId, token);
              // Transform Supervisor data to SupervisorCardData format
              if (supervisorRes.data) {
                setSupervisorDetails({
                  id: supervisorRes.data.id,
                  name: supervisorRes.data.fullName,
                  department: supervisorRes.data.department,
                  bio: supervisorRes.data.bio,
                  expertiseAreas: supervisorRes.data.expertiseAreas,
                  researchInterests: supervisorRes.data.researchInterests,
                  availabilityStatus: supervisorRes.data.availabilityStatus,
                  currentCapacity: `${supervisorRes.data.currentCapacity}/${supervisorRes.data.maxCapacity} projects`,
                  contact: supervisorRes.data.email,
                });
              }
            } catch (err) {
              console.error('Error fetching supervisor details:', err);
              setSupervisorDetails(null);
            }
          }
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

  if (error || !student) {
    return (
      <div className="error-container">
        <div className="error-content">
          <p className="error-text">Unable to load profile. Please try again later.</p>
          <button
            onClick={() => router.push(ROUTES.AUTHENTICATED.STUDENT)}
            className="btn-primary"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Helper function to get match status badge color
  const getMatchStatusColor = (status: string) => {
    switch (status) {
      case 'matched':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'unmatched':
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="page-container">
      <div className="page-content-narrow">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="page-title">Profile</h1>
            <p className="text-gray-600">
              View your profile information and match status
            </p>
          </div>
          <button
            onClick={() => router.push(ROUTES.AUTHENTICATED.STUDENT_PROFILE_EDIT)}
            className="btn-primary"
          >
            Edit Profile
          </button>
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
                  <p className="text-gray-800 mt-1">{student.fullName}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-gray-800 mt-1">{student.email}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Student ID</label>
                  <p className="text-gray-800 mt-1">{student.studentId}</p>
                </div>
                
                {student.phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Phone</label>
                    <p className="text-gray-800 mt-1">{student.phone}</p>
                  </div>
                )}
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Department</label>
                  <p className="text-gray-800 mt-1">{student.department}</p>
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div className="card-base">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Academic Information</h2>
              
              <div className="space-y-4">
                {student.skills && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Skills</label>
                    <p className="text-gray-800 mt-1 text-balance">{student.skills}</p>
                  </div>
                )}
                
                {student.interests && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Interests</label>
                    <p className="text-gray-800 mt-1 text-balance">{student.interests}</p>
                  </div>
                )}
                
                {student.previousProjects && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Previous Projects</label>
                    <p className="text-gray-800 mt-1 text-balance">{student.previousProjects}</p>
                  </div>
                )}
                
                {student.preferredTopics && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Preferred Topics</label>
                    <p className="text-gray-800 mt-1 text-balance">{student.preferredTopics}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Partner Information */}
            {student.hasPartner && (
              <div className="card-base">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Partner Information</h2>
                
                <div className="space-y-4">
                  {student.partnerName && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Partner Name</label>
                      <p className="text-gray-800 mt-1">{student.partnerName}</p>
                    </div>
                  )}
                  
                  {student.partnerEmail && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Partner Email</label>
                      <p className="text-gray-800 mt-1">{student.partnerEmail}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Match Status */}
            <div className="card-base">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Match Status</h2>
              
              <div className="flex items-center justify-center">
                <span 
                  className={`px-4 py-2 rounded-full text-sm font-semibold ${getMatchStatusColor(student.matchStatus)}`}
                >
                  {student.matchStatus.charAt(0).toUpperCase() + student.matchStatus.slice(1)}
                </span>
              </div>
              
              {student.matchStatus === 'matched' && student.assignedSupervisorId && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  {supervisorDetails ? (
                    <>
                      <p className="text-sm text-gray-600 mb-3 text-center">
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
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 text-center">
                    Your application is being reviewed
                  </p>
                </div>
              )}
              
              {student.matchStatus === 'unmatched' && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 text-center">
                    Browse available supervisors and submit an application
                  </p>
                  <button
                    onClick={() => router.push(ROUTES.AUTHENTICATED.STUDENT)}
                    className="btn-primary w-full mt-2"
                  >
                    Browse Supervisors
                  </button>
                </div>
              )}
            </div>

            {/* Partnership Status */}
            <div className="card-base">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Partnership Status</h2>
              
              <div className="flex items-center justify-center">
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  student.partnershipStatus === 'paired' ? 'bg-green-100 text-green-800' :
                  student.partnershipStatus === 'pending_sent' ? 'bg-yellow-100 text-yellow-800' :
                  student.partnershipStatus === 'pending_received' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {student.partnershipStatus === 'paired' ? 'Paired' :
                   student.partnershipStatus === 'pending_sent' ? 'Request Sent' :
                   student.partnershipStatus === 'pending_received' ? 'Request Received' :
                   'No Partner'}
                </span>
              </div>
              
              {student.partnerId && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  {partnerDetails ? (
                    <>
                      <p className="text-sm text-gray-600 mb-3 text-center">
                        Paired with:
                      </p>
                      <StudentCard
                        student={partnerDetails}
                        showRequestButton={false}
                        isCurrentPartner={true}
                        onUnpair={async () => {
                          try {
                            const token = await auth.currentUser?.getIdToken();
                            if (!token) throw new Error('Not authenticated');
                            
                            if (!confirm('Are you sure you want to unpair from your partner?')) {
                              return;
                            }
                            
                            await apiClient.unpairFromPartner(token);
                            
                            // Refresh the page or refetch data
                            window.location.reload();
                          } catch (error) {
                            console.error('Error unpairing:', error);
                            alert('Failed to unpair. Please try again.');
                          }
                        }}
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
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 text-center mb-2">
                    Find a project partner
                  </p>
                  <button
                    onClick={() => router.push(ROUTES.AUTHENTICATED.STUDENT)}
                    className="btn-primary w-full text-sm"
                  >
                    Browse Students
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

