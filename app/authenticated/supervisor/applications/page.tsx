'use client';

// app/authenticated/supervisor/applications/page.tsx
// Supervisor Applications View - Read-only view with filtering

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupervisorAuth } from '@/lib/hooks';
import { ROUTES } from '@/lib/routes';
import { apiClient } from '@/lib/api/client';
import { auth } from '@/lib/firebase';
import ApplicationCard from '@/app/components/shared/ApplicationCard';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import PageLayout from '@/app/components/layout/PageLayout';
import PageHeader from '@/app/components/layout/PageHeader';
import ErrorState from '@/app/components/feedback/ErrorState';
import EmptyState from '@/app/components/feedback/EmptyState';
import FilterButtons from '@/app/components/display/FilterButtons';
import { Application, ApplicationStatus } from '@/types/database';

type FilterStatus = 'all' | ApplicationStatus;

export default function SupervisorApplicationsPage() {
  const router = useRouter();
  const { userId, isAuthLoading } = useSupervisorAuth();
  
  const [dataLoading, setDataLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [error, setError] = useState(false);

  // Fetch applications
  useEffect(() => {
    const fetchApplications = async () => {
      if (!userId) return;

      try {
        // Get Firebase ID token
        const token = await auth.currentUser?.getIdToken();
        if (!token) {
          router.push('/login');
          return;
        }

        // Call API endpoint
        const response = await apiClient.getSupervisorApplications(userId, token);
        setApplications(response.data);
      } catch (err) {
        console.error('Error fetching applications:', err);
        setError(true);
      } finally {
        setDataLoading(false);
      }
    };

    if (userId) {
      fetchApplications();
    }
  }, [userId, router]);

  // Filter applications based on selected status
  const filteredApplications = filterStatus === 'all' 
    ? applications 
    : applications.filter(app => app.status === filterStatus);

  // Count applications by status
  const statusCounts = {
    all: applications.length,
    pending: applications.filter(app => app.status === 'pending').length,
    under_review: applications.filter(app => app.status === 'under_review').length,
    approved: applications.filter(app => app.status === 'approved').length,
    rejected: applications.filter(app => app.status === 'rejected').length,
  };

  // Show loading while auth is checking or data is loading
  if (isAuthLoading || dataLoading) {
    return <LoadingSpinner message="Loading applications..." />;
  }

  if (error) {
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
          { label: 'Under Review', value: 'under_review', count: statusCounts.under_review },
          { label: 'Approved', value: 'approved', count: statusCounts.approved },
          { label: 'Rejected', value: 'rejected', count: statusCounts.rejected },
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
                : `No ${filterStatus} applications.`
            }
          />
        ) : (
          <div className="grid-cards">
            {filteredApplications.map((application) => (
              <ApplicationCard 
                key={application.id} 
                application={{
                  id: application.id,
                  projectTitle: application.projectTitle,
                  projectDescription: application.projectDescription,
                  supervisorName: application.supervisorName,
                  dateApplied: application.dateApplied.toLocaleDateString(),
                  status: application.status,
                  responseTime: application.responseTime || '5-7 business days',
                  comments: application.supervisorFeedback,
                }} 
              />
            ))}
          </div>
        )}
    </PageLayout>
  );
}
