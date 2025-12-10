'use client';

// app/authenticated/supervisor/applications/page.tsx
// Supervisor Applications View - View and manage applications with filtering

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupervisorAuth, useSupervisorApplications, useApplicationStatusModal } from '@/lib/hooks';
import { ROUTES } from '@/lib/routes';
import ApplicationCard from '@/app/components/shared/ApplicationCard';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import StatusMessage from '@/app/components/feedback/StatusMessage';
import PageLayout from '@/app/components/layout/PageLayout';
import PageHeader from '@/app/components/layout/PageHeader';
import ErrorState from '@/app/components/feedback/ErrorState';
import EmptyState from '@/app/components/feedback/EmptyState';
import FilterButtons from '@/app/components/display/FilterButtons';
import ApplicationStatusModal from '../_components/ApplicationStatusModal';
import type { ApplicationStatus } from '@/types/database';
import { formatFirestoreDate } from '@/lib/utils/date';

type FilterStatus = 'all' | ApplicationStatus;

export default function SupervisorApplicationsPage() {
  const router = useRouter();
  const { userId, isAuthLoading } = useSupervisorAuth();
  
  // Fetch applications using custom hook
  const { data, loading: dataLoading, error: fetchError, refetch } = useSupervisorApplications(userId);
  
  const applications = data || [];
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

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

  // Filter applications based on selected status
  const filteredApplications = filterStatus === 'all' 
    ? applications 
    : applications.filter(app => app.status === filterStatus);

  // Count applications by status
  const statusCounts = {
    all: applications.length,
    pending: applications.filter(app => app.status === 'pending').length,
    approved: applications.filter(app => app.status === 'approved').length,
    rejected: applications.filter(app => app.status === 'rejected').length,
    revision_requested: applications.filter(app => app.status === 'revision_requested').length,
  };

  // Show loading while auth is checking or data is loading
  if (isAuthLoading || dataLoading) {
    return <LoadingSpinner message="Loading applications..." />;
  }

  if (fetchError) {
    return (
      <ErrorState
        message="Unable to load applications. Please try again later."
        action={{
          label: 'Back to Dashboard',
          onClick: () => router.push(ROUTES.AUTHENTICATED.SUPERVISOR)
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

      {/* Header */}
      <PageHeader
        title="Applications"
        description="Review and manage student project applications"
      />

      {/* Filter Buttons */}
      <FilterButtons
        filters={[
          { label: 'All', value: 'all', count: statusCounts.all },
          { label: 'Pending', value: 'pending', count: statusCounts.pending },
          { label: 'Approved', value: 'approved', count: statusCounts.approved },
          { label: 'Rejected', value: 'rejected', count: statusCounts.rejected },
          { label: 'Revision Requested', value: 'revision_requested', count: statusCounts.revision_requested },
        ]}
        activeFilter={filterStatus}
        onChange={(value) => setFilterStatus(value as FilterStatus)}
      />

      {/* Applications Grid */}
      {filteredApplications.length === 0 ? (
        <EmptyState
          message={
            applications.length === 0 
              ? 'No applications received yet.' 
              : `No ${filterStatus.replace('_', ' ')} applications.`
          }
        />
      ) : (
        <div className="grid-cards">
          {filteredApplications.map((application) => {
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
