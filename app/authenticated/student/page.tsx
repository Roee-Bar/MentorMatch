'use client';

// app/authenticated/student/page.tsx
// Updated Student Authenticated - Uses real Firebase data

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useStudentAuth, useLoadingState, useAuthenticatedFetch } from '@/lib/hooks';
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
import PageLayout from '@/app/components/layout/PageLayout';
import PageHeader from '@/app/components/layout/PageHeader';
import SectionHeader from '@/app/components/layout/SectionHeader';
import EmptyState from '@/app/components/feedback/EmptyState';
import { ApplicationCardData, SupervisorCardData, StudentCardData, StudentPartnershipRequest, Student } from '@/types/database';

export default function StudentAuthenticated() {
  const router = useRouter();
  
  // Authentication
  const { userId, isAuthLoading } = useStudentAuth();
  
  // Loading states
  const { startLoading, stopLoading, isLoading } = useLoadingState();
  
  // UI states
  const [showAllStudents, setShowAllStudents] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [selectedSupervisor, setSelectedSupervisor] = useState<SupervisorCardData | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Fetch dashboard data using the new hook
  const { data: dashboardData, loading: dataLoading, refetch } = useAuthenticatedFetch(
    async (token) => {
      if (!userId) return null;

      // Fetch student profile first to get partnerId
      const profileRes = await apiClient.getStudentById(userId, token);
      const userProfile = profileRes.success && profileRes.data ? profileRes.data : null;

      // Call API endpoints
      const [appsResponse, supervisorsResponse] = await Promise.all([
        apiClient.getStudentApplications(userId, token),
        apiClient.getSupervisors(token, { available: true }),
      ]);

      // Fetch partnership data
      let availableStudents: StudentCardData[] = [];
      let incomingRequests: StudentPartnershipRequest[] = [];
      let outgoingRequests: StudentPartnershipRequest[] = [];
      let currentPartner: StudentCardData | null = null;

      try {
        const [studentsRes, incomingRes, outgoingRes] = await Promise.all([
          apiClient.getAvailablePartners(token),
          apiClient.getPartnershipRequests(userId, 'incoming', token),
          apiClient.getPartnershipRequests(userId, 'outgoing', token),
        ]);

        availableStudents = studentsRes.data || [];
        incomingRequests = incomingRes.data || [];
        outgoingRequests = outgoingRes.data || [];

        // Get partner details if student has a partner
        if (userProfile?.partnerId) {
          try {
            const partnerRes = await apiClient.getPartnerDetails(userProfile.partnerId, token);
            currentPartner = partnerRes.data;
          } catch (partnerError) {
            console.error('Error fetching partner details:', partnerError);
          }
        }
      } catch (partnershipError) {
        console.error('Error fetching partnership data:', partnershipError);
      }

      return {
        userProfile,
        applications: appsResponse.data,
        supervisors: supervisorsResponse.data,
        availableStudents,
        incomingRequests,
        outgoingRequests,
        currentPartner,
      };
    },
    [userId]
  );

  const userProfile = dashboardData?.userProfile || null;
  const applications = dashboardData?.applications || [];
  const supervisors = dashboardData?.supervisors || [];
  const availableStudents = dashboardData?.availableStudents || [];
  const incomingRequests = dashboardData?.incomingRequests || [];
  const outgoingRequests = dashboardData?.outgoingRequests || [];
  const currentPartner = dashboardData?.currentPartner || null;

  // Handle apply button click
  const handleApply = (supervisorId: string) => {
    const supervisor = supervisors.find((s: SupervisorCardData) => s.id === supervisorId);
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

      // Refresh dashboard data
      await refetch();

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

      // Refresh dashboard data
      await refetch();

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
  const handleRequestPartnership = async (targetStudentId: string) => {
    const loadingKey = `partnership-${targetStudentId}`;
    startLoading(loadingKey);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');

      await apiClient.createPartnershipRequest({ targetStudentId }, token);
      
      await refetch();
      
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
      
      await refetch();
      
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
      
      await refetch();
      
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
      
      await refetch();
      
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
      
      await refetch();
      
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
  const approvedCount = applications.filter((app: ApplicationCardData) => app.status === 'approved').length;
  const pendingCount = applications.filter(
    (app: ApplicationCardData) => app.status === 'pending' || app.status === 'under_review'
  ).length;

  if (isAuthLoading || dataLoading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  return (
    <PageLayout>
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
      <PageHeader
        title="Student Dashboard"
        description={`Welcome back, ${userProfile?.fullName || 'Student'}! Here's your project matching overview.`}
      />

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
            <SectionHeader
              title="Partnership Requests"
              badge={<span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">{incomingRequests.length} Pending</span>}
            />
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
            <SectionHeader title="My Partner" />
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
            <SectionHeader
              title="Pending Partnership Requests"
              badge={<span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">{outgoingRequests.length} Sent</span>}
            />
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
            <SectionHeader
              title="Available Students"
              action={
                <button
                  onClick={() => setShowAllStudents(!showAllStudents)}
                  className="text-blue-600 text-sm font-medium hover:underline"
                >
                  {showAllStudents ? 'Show Less' : 'View All'} →
                </button>
              }
            />
            
            {availableStudents.length === 0 ? (
              <EmptyState message="No available students at the moment." />
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
          <SectionHeader
            title="My Applications"
            action={
              <button
                onClick={() => router.push(ROUTES.SUPERVISORS)}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                + New Application
              </button>
            }
          />

          {applications.length === 0 ? (
            <EmptyState
              message="You haven't submitted any applications yet."
              action={{
                label: 'Browse Supervisors',
                onClick: () => router.push(ROUTES.SUPERVISORS)
              }}
            />
          ) : (
            <div className="grid-cards">
              {applications.map((application: ApplicationCardData) => (
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
          <SectionHeader
            title="Available Supervisors"
            action={
              <button
                onClick={() => router.push(ROUTES.SUPERVISORS)}
                className="text-blue-600 text-sm font-medium hover:underline"
              >
                View All →
              </button>
            }
          />

          {supervisors.length === 0 ? (
            <EmptyState message="No supervisors available at the moment." />
          ) : (
            <div className="grid-cards">
              {supervisors.slice(0, 3).map((supervisor: SupervisorCardData) => (
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
    </PageLayout>
  );
}