'use client';

// app/authenticated/student/page.tsx
// Updated Student Authenticated - Uses real Firebase data

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStudentAuth, useLoadingState } from '@/lib/hooks';
import { ROUTES } from '@/lib/routes';
import { apiClient } from '@/lib/api/client';
import { auth } from '@/lib/firebase';
import StatCard from '@/app/components/shared/StatCard';
import ApplicationCard from '@/app/components/shared/ApplicationCard';
import SupervisorCard from '@/app/components/shared/SupervisorCard';
import StudentCard from '@/app/components/shared/StudentCard';
import PartnershipRequestCard from './_components/PartnershipRequestCard';
import ApplicationModal from './_components/ApplicationModal';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import StatusMessage from '@/app/components/feedback/StatusMessage';
import { ApplicationCardData, SupervisorCardData, StudentCardData, StudentPartnershipRequest, Student } from '@/types/database';

export default function StudentAuthenticated() {
  const router = useRouter();
  
  // Authentication
  const { userId, isAuthLoading } = useStudentAuth();
  const [userProfile, setUserProfile] = useState<Student | null>(null);
  
  // Loading states
  const [dataLoading, setDataLoading] = useState(true);
  const { startLoading, stopLoading, isLoading } = useLoadingState();
  
  // Data states
  const [applications, setApplications] = useState<ApplicationCardData[]>([]);
  const [supervisors, setSupervisors] = useState<SupervisorCardData[]>([]);
  const [availableStudents, setAvailableStudents] = useState<StudentCardData[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<StudentPartnershipRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<StudentPartnershipRequest[]>([]);
  const [currentPartner, setCurrentPartner] = useState<StudentCardData | null>(null);
  
  // UI states
  const [showAllStudents, setShowAllStudents] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [selectedSupervisor, setSelectedSupervisor] = useState<SupervisorCardData | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Fetch dashboard data
  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;

      setDataLoading(true);
      setError(null);
      
      try {
        // Get Firebase ID token
        const token = await auth.currentUser?.getIdToken();
        if (!token) {
          router.push(ROUTES.LOGIN);
          return;
        }

        // Fetch student profile first to get partnerId
        const profileRes = await apiClient.getStudentById(userId, token);
        if (profileRes.success && profileRes.data) {
          setUserProfile(profileRes.data);
        }

        // Call API endpoints
        const [appsResponse, supervisorsResponse] = await Promise.all([
          apiClient.getStudentApplications(userId, token),
          apiClient.getSupervisors(token, { available: true }),
        ]);

        setApplications(appsResponse.data);
        setSupervisors(supervisorsResponse.data);

        // Fetch partnership data
        try {
          const [studentsRes, incomingRes, outgoingRes] = await Promise.all([
            apiClient.getAvailablePartners(token),
            apiClient.getPartnershipRequests(userId, 'incoming', token),
            apiClient.getPartnershipRequests(userId, 'outgoing', token),
          ]);

          setAvailableStudents(studentsRes.data || []);
          setIncomingRequests(incomingRes.data || []);
          setOutgoingRequests(outgoingRes.data || []);

          // Get partner details if student has a partner
          if (profileRes.data?.partnerId) {
            try {
              const partnerRes = await apiClient.getPartnerDetails(profileRes.data.partnerId, token);
              setCurrentPartner(partnerRes.data);
            } catch (partnerError) {
              console.error('Error fetching partner details:', partnerError);
              setCurrentPartner(null);
            }
          }
        } catch (partnershipError) {
          console.error('Error fetching partnership data:', partnershipError);
          // Don't fail the whole page if partnership data fails
          setAvailableStudents([]);
          setIncomingRequests([]);
          setOutgoingRequests([]);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data. Please try again.');
        // Even on error, we should stop loading to show the page
        setApplications([]);
        setSupervisors([]);
      } finally {
        setDataLoading(false);
      }
    };

    if (userId) {
      fetchData();
    }
  }, [userId, router]);

  // Handle apply button click
  const handleApply = (supervisorId: string) => {
    const supervisor = supervisors.find(s => s.id === supervisorId);
    if (supervisor) {
      setSelectedSupervisor(supervisor);
      setShowApplicationModal(true);
    }
  };

  // Handle application submission
  const handleSubmitApplication = async (applicationData: any) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');

      await apiClient.createApplication({
        supervisorId: selectedSupervisor?.id,
        ...applicationData
      }, token);

      // Refresh applications list
      const appsResponse = await apiClient.getStudentApplications(userId!, token);
      setApplications(appsResponse.data);

      // Close modal and show success
      setShowApplicationModal(false);
      setSuccessMessage('Application submitted successfully!');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      console.error('Error creating application:', error);
      throw error; // Let modal handle the error display
    }
  };

  // Handle application withdrawal
  const handleWithdrawApplication = async (applicationId: string) => {
    // Confirm before deletion using browser's native confirm dialog
    if (!confirm('Are you sure you want to withdraw this application? This action cannot be undone.')) {
      return;
    }

    const loadingKey = `withdraw-${applicationId}`;
    startLoading(loadingKey);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');

      // Use existing API client method
      await apiClient.deleteApplication(applicationId, token);

      // Refresh applications list using existing pattern
      const appsResponse = await apiClient.getStudentApplications(userId!, token);
      setApplications(appsResponse.data);

      // Show success message using existing StatusMessage component pattern
      setSuccessMessage('Application withdrawn successfully!');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      console.error('Error withdrawing application:', error);
      setError('Failed to withdraw application. Please try again.');
      setTimeout(() => setError(null), 5000);
    } finally {
      stopLoading(loadingKey);
    }
  };

  // Partnership handlers
  const refreshPartnershipData = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      const [studentsRes, incomingRes, outgoingRes, profileRes] = await Promise.all([
        apiClient.getAvailablePartners(token),
        apiClient.getPartnershipRequests(userId!, 'incoming', token),
        apiClient.getPartnershipRequests(userId!, 'outgoing', token),
        apiClient.getStudentById(userId!, token),
      ]);

      setAvailableStudents(studentsRes.data || []);
      setIncomingRequests(incomingRes.data || []);
      setOutgoingRequests(outgoingRes.data || []);
      
      // Update user profile with latest data
      if (profileRes.success && profileRes.data) {
        setUserProfile({ ...userProfile, ...profileRes.data });
        
        // Get partner details if newly paired
        if (profileRes.data.partnerId && profileRes.data.partnerId !== currentPartner?.id) {
          const partnerRes = await apiClient.getPartnerDetails(profileRes.data.partnerId, token);
          setCurrentPartner(partnerRes.data);
        } else if (!profileRes.data.partnerId) {
          setCurrentPartner(null);
        }
      }
    } catch (error) {
      console.error('Error refreshing partnership data:', error);
    }
  };

  const handleRequestPartnership = async (targetStudentId: string) => {
    const loadingKey = `partnership-${targetStudentId}`;
    startLoading(loadingKey);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');

      await apiClient.createPartnershipRequest({ targetStudentId }, token);
      
      await refreshPartnershipData();
      
      setSuccessMessage('Partnership request sent successfully!');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error: any) {
      console.error('Error sending partnership request:', error);
      setError(error.message || 'Failed to send partnership request.');
      setTimeout(() => setError(null), 5000);
    } finally {
      stopLoading(loadingKey);
    }
  };

  const handleAcceptPartnership = async (requestId: string) => {
    const loadingKey = `accept-${requestId}`;
    startLoading(loadingKey);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');

      await apiClient.respondToPartnershipRequest(requestId, 'accept', token);
      
      await refreshPartnershipData();
      
      setSuccessMessage('Partnership accepted! You are now paired.');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error: any) {
      console.error('Error accepting partnership:', error);
      setError(error.message || 'Failed to accept partnership request.');
      setTimeout(() => setError(null), 5000);
    } finally {
      stopLoading(loadingKey);
    }
  };

  const handleRejectPartnership = async (requestId: string) => {
    const loadingKey = `reject-${requestId}`;
    startLoading(loadingKey);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');

      await apiClient.respondToPartnershipRequest(requestId, 'reject', token);
      
      await refreshPartnershipData();
      
      setSuccessMessage('Partnership request rejected.');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error: any) {
      console.error('Error rejecting partnership:', error);
      setError(error.message || 'Failed to reject partnership request.');
      setTimeout(() => setError(null), 5000);
    } finally {
      stopLoading(loadingKey);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    const loadingKey = `cancel-${requestId}`;
    startLoading(loadingKey);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');

      await apiClient.cancelPartnershipRequest(requestId, token);
      
      await refreshPartnershipData();
      
      setSuccessMessage('Partnership request cancelled.');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error: any) {
      console.error('Error cancelling request:', error);
      setError(error.message || 'Failed to cancel partnership request.');
      setTimeout(() => setError(null), 5000);
    } finally {
      stopLoading(loadingKey);
    }
  };

  const handleUnpair = async () => {
    if (!confirm('Are you sure you want to unpair from your partner? This action cannot be undone.')) {
      return;
    }

    const loadingKey = 'unpair';
    startLoading(loadingKey);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');

      await apiClient.unpairFromPartner(token);
      
      await refreshPartnershipData();
      
      setSuccessMessage('Successfully unpaired from your partner.');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error: any) {
      console.error('Error unpairing:', error);
      setError(error.message || 'Failed to unpair from partner.');
      setTimeout(() => setError(null), 5000);
    } finally {
      stopLoading(loadingKey);
    }
  };

  // Calculate stats
  const approvedCount = applications.filter((app) => app.status === 'approved').length;
  const pendingCount = applications.filter(
    (app) => app.status === 'pending' || app.status === 'under_review'
  ).length;

  if (isAuthLoading || dataLoading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  return (
    <div className="page-container">
      <div className="page-content">
        {/* Error Banner */}
        {error && (
          <StatusMessage 
            message={error} 
            type="error"
          />
        )}

        {/* Success Message */}
        {successMessage && (
          <StatusMessage 
            message={successMessage} 
            type="success"
          />
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="page-title">Student Dashboard</h1>
          <p className="text-gray-600">
            Welcome back, {userProfile?.fullName || 'Student'}! Here&apos;s your project matching overview.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid-stats">
          <StatCard
            title="My Applications"
            value={applications.length}
            description="Total applications"
            color="blue"
          />

          <StatCard
            title="Pending Review"
            value={pendingCount}
            description="Awaiting response"
            color="gray"
          />

          <StatCard
            title="Approved"
            value={approvedCount}
            description="Approved applications"
            color="green"
          />

          <StatCard
            title="Available Supervisors"
            value={supervisors.length}
            description="Ready to accept students"
            color="blue"
          />
        </div>

        {/* Partnership Requests Section - Show if any exist AND not already paired */}
        {incomingRequests.length > 0 && !currentPartner && (
          <div className="mb-8">
            <div className="section-header">
              <h2 className="section-title">Partnership Requests</h2>
              <span className="badge-warning">{incomingRequests.length} Pending</span>
            </div>
            <div className="grid-cards">
              {incomingRequests.map(request => (
                <PartnershipRequestCard
                  key={request.id}
                  request={request}
                  type="incoming"
                  onAccept={handleAcceptPartnership}
                  onReject={handleRejectPartnership}
                  isLoading={isLoading(`accept-${request.id}`) || isLoading(`reject-${request.id}`)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Current Partner Section - Show if paired */}
        {currentPartner && (
          <div className="mb-8">
            <div className="section-header">
              <h2 className="section-title">My Partner</h2>
            </div>
            <div className="grid-cards">
              <StudentCard
                student={currentPartner}
                showRequestButton={false}
                isCurrentPartner={true}
                onUnpair={handleUnpair}
                isLoading={isLoading('unpair')}
              />
            </div>
          </div>
        )}

        {/* Outgoing Requests - Show if any */}
        {outgoingRequests.length > 0 && (
          <div className="mb-8">
            <div className="section-header">
              <h2 className="section-title">Pending Partnership Requests</h2>
              <span className="badge-warning">{outgoingRequests.length} Sent</span>
            </div>
            <div className="grid-cards">
              {outgoingRequests.map(request => (
                <PartnershipRequestCard
                  key={request.id}
                  request={request}
                  type="outgoing"
                  onCancel={handleCancelRequest}
                  isLoading={isLoading(`cancel-${request.id}`)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Available Students - Show if not paired */}
        {!currentPartner && (
          <div className="mb-8">
            <div className="section-header">
              <h2 className="section-title">Available Students</h2>
              <button
                onClick={() => setShowAllStudents(!showAllStudents)}
                className="text-blue-600 text-sm font-medium hover:underline"
              >
                {showAllStudents ? 'Show Less' : 'View All'} →
              </button>
            </div>
            
            {availableStudents.length === 0 ? (
              <div className="empty-state">
                <p className="empty-state-text">No available students at the moment.</p>
              </div>
            ) : (
              <div className="grid-cards">
                {(showAllStudents ? availableStudents : availableStudents.slice(0, 3))
                  .map(student => (
                    <StudentCard
                      key={student.id}
                      student={student}
                      onRequestPartnership={handleRequestPartnership}
                      showRequestButton={true}
                      isLoading={isLoading(`partnership-${student.id}`)}
                    />
                  ))}
              </div>
            )}
          </div>
        )}

        {/* My Applications Section */}
        <div className="mb-8">
          <div className="section-header">
            <h2 className="section-title">My Applications</h2>
            <button
              onClick={() => router.push(ROUTES.SUPERVISORS)}
              className="btn-primary"
            >
              + New Application
            </button>
          </div>

          {applications.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state-text mb-4">You haven&apos;t submitted any applications yet.</p>
              <button
                onClick={() => router.push(ROUTES.SUPERVISORS)}
                className="btn-primary px-6 py-2"
              >
                Browse Supervisors
              </button>
            </div>
          ) : (
            <div className="grid-cards">
              {applications.map((application) => (
                <ApplicationCard 
                  key={application.id} 
                  application={application}
                  onWithdraw={handleWithdrawApplication}
                  isLoading={isLoading(`withdraw-${application.id}`)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Available Supervisors Section */}
        <div className="mb-8">
          <div className="section-header">
            <h2 className="section-title">Available Supervisors</h2>
            <button
              onClick={() => router.push(ROUTES.SUPERVISORS)}
              className="text-blue-600 text-sm font-medium hover:underline"
            >
              View All →
            </button>
          </div>

          {supervisors.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state-text">No supervisors available at the moment.</p>
            </div>
          ) : (
            <div className="grid-cards">
              {supervisors.slice(0, 3).map((supervisor) => (
                <SupervisorCard 
                  key={supervisor.id} 
                  supervisor={supervisor}
                  onApply={handleApply}
                />
              ))}
            </div>
          )}
        </div>

        {/* Application Modal */}
        {showApplicationModal && selectedSupervisor && (
          <ApplicationModal
            isOpen={showApplicationModal}
            onClose={() => setShowApplicationModal(false)}
            supervisor={selectedSupervisor}
            studentProfile={userProfile}
            onSubmit={handleSubmitApplication}
          />
        )}
      </div>
    </div>
  );
}