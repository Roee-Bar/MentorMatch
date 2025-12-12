'use client';

// app/authenticated/supervisor/page.tsx
// Supervisor Dashboard - View and manage applications

import { useRouter } from 'next/navigation';
import { useSupervisorAuth, useSupervisorDashboard, useApplicationStatusModal } from '@/lib/hooks';
import { ROUTES } from '@/lib/routes';
import StatCard from '@/app/components/shared/StatCard';
import ApplicationCard from '@/app/components/shared/ApplicationCard';
import CapacityIndicator from '@/app/components/shared/CapacityIndicator';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import StatusMessage from '@/app/components/feedback/StatusMessage';
import PageLayout from '@/app/components/layout/PageLayout';
import PageHeader from '@/app/components/layout/PageHeader';
import SectionHeader from '@/app/components/layout/SectionHeader';
import EmptyState from '@/app/components/feedback/EmptyState';
import ErrorState from '@/app/components/feedback/ErrorState';
import ApplicationStatusModal from './_components/ApplicationStatusModal';
import type { Application } from '@/types/database';
import { formatFirestoreDate } from '@/lib/utils/date';

export default function SupervisorAuthenticated() {
  const router = useRouter();
  const { userId, userProfile, isAuthLoading } = useSupervisorAuth();
  
  // Fetch dashboard data using custom hook
  const { data, loading: dataLoading, error: fetchError, refetch } = useSupervisorDashboard(userId);
  
  const supervisor = data?.supervisor || null;
  const applications = data?.applications || [];
  const projects = data?.projects || [];

  // Application status modal hook - handles modal state, messages, and actions
  const {
    selectedApplication,
    showStatusModal,
    successMessage,
    errorMessage,
    handleReviewApplication,
    handleUpdateStatus,
    closeModal,
    isLoading: isModalLoading,
  } = useApplicationStatusModal({
    applications,
    userId,
    onRefresh: refetch,
  });

  // Calculate stats
  const pendingCount = applications.filter(
    (app) => app.status === 'pending'
  ).length;
  const approvedProjects = projects.filter((proj) => proj.status === 'approved').length;
  const currentCapacity = supervisor?.currentCapacity || 0;

  // Show loading while auth is checking or data is loading
  if (isAuthLoading || dataLoading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  // Show error state if data fetch fails
  if (fetchError) {
    return (
      <ErrorState
        message="Unable to load dashboard data. Please try again later."
        action={{
          label: 'Retry',
          onClick: () => window.location.reload()
        }}
      />
    );
  }

  return (
    <PageLayout>
      {/* Success Message */}
      {successMessage && (
        <StatusMessage message={successMessage} type="success" />
      )}

      {/* Error Message */}
      {errorMessage && (
        <StatusMessage message={errorMessage} type="error" />
      )}

      <PageHeader
        title="Supervisor Dashboard"
        description={`Welcome back, ${userProfile?.name || 'Supervisor'}! Here's your supervision overview.`}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Applications"
          value={applications.length}
          description="All applications received"
          color="blue"
        />

        <StatCard
          title="Pending Review"
          value={pendingCount}
          description="Awaiting your response"
          color="gray"
        />

        {supervisor && (
          <CapacityIndicator
            current={currentCapacity}
            max={supervisor.maxCapacity}
            status={supervisor.availabilityStatus}
          />
        )}

        <StatCard
          title="Approved Projects"
          value={approvedProjects}
          description="Projects in progress"
          color="blue"
        />
      </div>

      {/* Recent Applications Section */}
      <div className="mb-8">
        <SectionHeader
          title="Recent Applications"
          action={
            <button
              onClick={() => router.push(ROUTES.AUTHENTICATED.SUPERVISOR_APPLICATIONS)}
              className="text-blue-600 text-sm font-medium hover:underline"
            >
              View All →
            </button>
          }
        />

        {applications.length === 0 ? (
          <EmptyState message="No applications received yet." />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {applications.slice(0, 6).map((application) => {
              const dateAppliedStr = formatFirestoreDate(application.dateApplied);
              
              return (
                <ApplicationCard 
                  key={application.id} 
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
                    studentName: application.studentName,
                    studentEmail: application.studentEmail,
                  }}
                  viewMode="supervisor"
                  onReviewApplication={handleReviewApplication}
                  isLoading={isModalLoading}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Application Status Modal */}
      {selectedApplication && (
        <ApplicationStatusModal
          application={selectedApplication}
          isOpen={showStatusModal}
          onClose={closeModal}
          onUpdateStatus={handleUpdateStatus}
          isLoading={isModalLoading}
        />
      )}
    </PageLayout>
  );
}
