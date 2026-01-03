'use client';

// app/authenticated/student/page.tsx
// Updated Student Authenticated - Uses real Firebase data

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useStudentDashboard, useStudentPartnerships, usePartnershipActions, useApplicationActions, useModalScroll } from '@/lib/hooks';
import { ROUTES } from '@/lib/routes';
import StatCard from '@/app/components/shared/StatCard';
import ApplicationCard from '@/app/components/shared/ApplicationCard';
import SupervisorCard from '@/app/components/shared/SupervisorCard';
import StudentCard from '@/app/components/shared/StudentCard';
import PartnershipRequestCard from '@/app/components/shared/PartnershipRequestCard';
import ApplicationModal from './_components/ApplicationModal';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import StatusMessage from '@/app/components/feedback/StatusMessage';
import PageLayout from '@/app/components/layout/PageLayout';
import PageHeader from '@/app/components/layout/PageHeader';
import SectionHeader from '@/app/components/layout/SectionHeader';
import EmptyState from '@/app/components/feedback/EmptyState';
import { SupervisorCardData, ApplicationSubmitData } from '@/types/database';
import { btnPrimary, badgeWarning, linkAction } from '@/lib/styles/shared-styles';

export default function StudentAuthenticated() {
  const router = useRouter();
  
  // Authentication
  const { userId, isAuthLoading } = useAuth({ expectedRole: 'student' });
  
  // Data fetching hooks
  const { data: dashboardData, loading: dashboardLoading, error: dashboardError, refetch: refetchDashboard } = 
    useStudentDashboard(userId);
  
  const { data: partnershipData, loading: partnershipsLoading, error: partnershipsError, refetch: refetchPartnerships } = 
    useStudentPartnerships(userId, dashboardData?.profile?.partnerId);
  
  // UI states
  const [showAllStudents, setShowAllStudents] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [selectedSupervisor, setSelectedSupervisor] = useState<SupervisorCardData | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [newlySubmittedAppId, setNewlySubmittedAppId] = useState<string | null>(null);
  
  // Action hooks with auto-refetch and message handling
  const partnershipActions = usePartnershipActions({
    userId,
    onRefresh: refetchPartnerships,
    onSuccess: (msg) => { 
      setSuccessMessage(msg); 
      setTimeout(() => setSuccessMessage(null), 5000); 
    },
    onError: (msg) => { 
      setError(msg); 
      setTimeout(() => setError(null), 5000); 
    }
  });

  const applicationActions = useApplicationActions({
    userId,
    onRefresh: refetchDashboard,
    onSuccess: (msg) => { 
      setSuccessMessage(msg); 
      setTimeout(() => setSuccessMessage(null), 5000); 
    },
    onError: (msg) => { 
      setError(msg); 
      setTimeout(() => setError(null), 5000); 
    }
  });
  
  // Extract data from hooks (with defaults)
  const userProfile = dashboardData?.profile || null;
  const applications = dashboardData?.applications || [];
  const supervisors = dashboardData?.supervisors || [];
  
  // Deduplicate available students by ID (safety measure to prevent duplicates)
  const availableStudentsMap = new Map(
    (partnershipData?.availableStudents || []).map(student => [student.id, student])
  );
  const availableStudents = Array.from(availableStudentsMap.values());
  
  const incomingRequests = partnershipData?.incomingRequests || [];
  const outgoingRequests = partnershipData?.outgoingRequests || [];
  const currentPartner = partnershipData?.currentPartner || null;

  // Ref to track previous application count for scroll detection
  const previousAppCountRef = useRef(applications.length);

  // Scroll to newly submitted application after data refresh
  useEffect(() => {
    const currentCount = applications.length;
    const previousCount = previousAppCountRef.current;
    
    // If count increased and we have a newly submitted app ID
    if (newlySubmittedAppId && currentCount > previousCount) {
      // Find the newest pending application for this supervisor
      const newApplication = applications
        .filter(app => {
          // Match by supervisorId if available, or find most recent pending
          if (app.supervisorId) {
            return app.supervisorId === newlySubmittedAppId && app.status === 'pending';
          }
          // Fallback: find most recent pending application
          return app.status === 'pending';
        })
        .sort((a, b) => {
          // Sort by dateApplied if available, otherwise by position in array
          const dateA = a.dateApplied instanceof Date 
            ? a.dateApplied.getTime() 
            : (a.dateApplied as any)?.toDate?.()?.getTime() || 0;
          const dateB = b.dateApplied instanceof Date 
            ? b.dateApplied.getTime() 
            : (b.dateApplied as any)?.toDate?.()?.getTime() || 0;
          return dateB - dateA; // Most recent first
        })[0];
      
      if (newApplication) {
        // Use setTimeout to ensure DOM has updated after data refresh
        setTimeout(() => {
          const element = document.querySelector(`[data-application-id="${newApplication.id}"]`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setNewlySubmittedAppId(null);
          } else {
            // If element not found, clear after timeout to prevent memory leaks
            setTimeout(() => setNewlySubmittedAppId(null), 1000);
          }
        }, 100);
      } else {
        // If no matching application found, clear after timeout
        setTimeout(() => setNewlySubmittedAppId(null), 1000);
      }
    }
    
    previousAppCountRef.current = currentCount;
  }, [applications, newlySubmittedAppId]);

  // Scroll to modal when it opens
  useModalScroll({ isOpen: showApplicationModal });

  // Handle apply button click
  const handleApply = (supervisorId: string) => {
    const supervisor = supervisors.find(s => s.id === supervisorId);
    if (supervisor) {
      setSelectedSupervisor(supervisor);
      setShowApplicationModal(true);
    }
  };

  // Handle application submission
  const handleSubmitApplication = async (applicationData: ApplicationSubmitData) => {
    try {
      await applicationActions.submitApplication({
        ...applicationData,
        supervisorId: selectedSupervisor?.id,
      });

      // Close modal on success
      setShowApplicationModal(false);
      
      // Store the supervisor ID temporarily - we'll use it to identify the new application
      // The application ID will be available after refetch
      setNewlySubmittedAppId(selectedSupervisor?.id || null);
    } catch {
      // Error already handled by applicationActions hook
      // Modal stays open to show error
    }
  };

  // Calculate stats
  const approvedCount = applications.filter((app) => app.status === 'approved').length;
  const pendingCount = applications.filter(
    (app) => app.status === 'pending'
  ).length;

  // Show errors from data fetching
  const fetchError = dashboardError || partnershipsError;

  if (isAuthLoading || dashboardLoading || partnershipsLoading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  return (
    <PageLayout>
      {/* Error Banner - for fetch errors */}
      {fetchError && (
        <StatusMessage 
          message={fetchError} 
          type="error"
        />
      )}

      {/* Error Banner - for action errors */}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
              badge={<span className={badgeWarning}>{incomingRequests.length} Pending</span>}
            />
            <div className="grid-cards-3col">
              {incomingRequests.map(request => (
                <PartnershipRequestCard
                  key={request.id}
                  request={request}
                  type="incoming"
                  onAccept={partnershipActions.acceptPartnership}
                  onReject={partnershipActions.rejectPartnership}
                  isLoading={partnershipActions.isLoading(`accept-${request.id}`) || partnershipActions.isLoading(`reject-${request.id}`)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Current Partner Section - Show if paired */}
        {currentPartner && (
          <div className="mb-8">
            <SectionHeader title="My Partner" />
            <div className="grid-cards-3col">
              <StudentCard
                student={currentPartner}
                showRequestButton={false}
                isCurrentPartner={true}
                onUnpair={partnershipActions.unpair}
                isLoading={partnershipActions.isLoading('unpair')}
              />
            </div>
          </div>
        )}

        {/* Outgoing Requests - Show if any */}
        {outgoingRequests.length > 0 && (
          <div className="mb-8">
            <SectionHeader
              title="Pending Partnership Requests"
              badge={<span className={badgeWarning}>{outgoingRequests.length} Sent</span>}
            />
            <div className="grid-cards-3col">
              {outgoingRequests.map(request => (
                <PartnershipRequestCard
                  key={request.id}
                  request={request}
                  type="outgoing"
                  onCancel={partnershipActions.cancelRequest}
                  isLoading={partnershipActions.isLoading(`cancel-${request.id}`)}
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
                  className={linkAction}
                >
                  {showAllStudents ? 'Show Less' : 'View All'} →
                </button>
              }
            />
            
            {availableStudents.length === 0 ? (
              <EmptyState message="No available students at the moment." />
            ) : (
              <div className="grid-cards-3col">
                {(showAllStudents ? availableStudents : availableStudents.slice(0, 3))
                  .map(student => (
                    <StudentCard
                      key={student.id}
                      student={student}
                      onRequestPartnership={partnershipActions.requestPartnership}
                      showRequestButton={true}
                      isLoading={partnershipActions.isLoading(`partnership-${student.id}`)}
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
                onClick={() => router.push(ROUTES.AUTHENTICATED.STUDENT_SUPERVISORS)}
                className={btnPrimary}
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
                onClick: () => router.push(ROUTES.AUTHENTICATED.STUDENT_SUPERVISORS)
              }}
            />
          ) : (
            <div className="grid-cards-3col">
              {applications.map((application) => {
                // Convert Firestore Timestamp to Date, then format as string
                const dateAppliedStr = application.dateApplied instanceof Date
                  ? application.dateApplied.toLocaleDateString()
                  : (application.dateApplied as any)?.toDate?.()?.toLocaleDateString() || 'N/A';
                
                return (
                  <div key={application.id} data-application-id={application.id}>
                    <ApplicationCard 
                      application={{
                        id: application.id,
                        projectTitle: application.projectTitle,
                        projectDescription: application.projectDescription,
                        supervisorName: application.supervisorName,
                        dateApplied: dateAppliedStr,
                        status: application.status,
                        responseTime: application.responseTime || '5-7 business days',
                        comments: application.supervisorFeedback,
                        hasPartner: application.hasPartner,
                        partnerName: application.partnerName,
                        linkedApplicationId: application.linkedApplicationId,
                        isLeadApplication: application.isLeadApplication,
                      }}
                      onWithdraw={applicationActions.withdrawApplication}
                      isLoading={applicationActions.isLoading(`withdraw-${application.id}`)}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Available Supervisors Section */}
        <div className="mb-8">
          <SectionHeader
            title="Available Supervisors"
            action={
              <button
                onClick={() => router.push(ROUTES.AUTHENTICATED.STUDENT_SUPERVISORS)}
                className={linkAction}
              >
                View All →
              </button>
            }
          />

          {supervisors.length === 0 ? (
            <EmptyState message="No supervisors available at the moment." />
          ) : (
            <div className="grid-cards-3col">
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
    </PageLayout>
  );
}