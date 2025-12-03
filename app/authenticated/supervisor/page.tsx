'use client';

// app/authenticated/supervisor/page.tsx
// Supervisor Authenticated - Read-only view of applications and profile

import { useRouter } from 'next/navigation';
import { useSupervisorAuth, useAuthenticatedFetch } from '@/lib/hooks';
import { ROUTES } from '@/lib/routes';
import { apiClient } from '@/lib/api/client';
import StatCard from '@/app/components/shared/StatCard';
import ApplicationCard from '@/app/components/shared/ApplicationCard';
import CapacityIndicator from '@/app/components/shared/CapacityIndicator';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import StatusMessage from '@/app/components/feedback/StatusMessage';
import PageLayout from '@/app/components/layout/PageLayout';
import PageHeader from '@/app/components/layout/PageHeader';
import SectionHeader from '@/app/components/layout/SectionHeader';
import EmptyState from '@/app/components/feedback/EmptyState';
import { Application, Supervisor, Project } from '@/types/database';

export default function SupervisorAuthenticated() {
  const router = useRouter();
  const { userId, userProfile, isAuthLoading } = useSupervisorAuth();
  
  // Fetch all dashboard data using the new hook
  const { data: dashboardData, loading: dataLoading, error } = useAuthenticatedFetch(
    async (token) => {
      if (!userId) return null;
      
      const [supervisorResponse, applicationsResponse, projectsResponse] = await Promise.all([
        apiClient.getSupervisorById(userId, token),
        apiClient.getSupervisorApplications(userId, token),
        apiClient.getSupervisorProjects(userId, token),
      ]);

      return {
        supervisor: supervisorResponse.data,
        applications: applicationsResponse.data,
        projects: projectsResponse.data,
      };
    },
    [userId]
  );

  const supervisor = dashboardData?.supervisor || null;
  const applications = dashboardData?.applications || [];
  const projects = dashboardData?.projects || [];

  // Calculate stats
  const pendingCount = applications.filter(
    (app: Application) => app.status === 'pending' || app.status === 'under_review'
  ).length;
  const approvedProjects = projects.filter((proj: Project) => proj.status === 'approved').length;
  const currentCapacity = supervisor?.currentCapacity || 0;

  // Show loading while auth is checking or data is loading
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

      {/* Header */}
      <PageHeader
        title="Supervisor Dashboard"
        description={`Welcome back, ${userProfile?.name || 'Supervisor'}! Here's your supervision overview.`}
      />

        {/* Stats Grid */}
        <div className="grid-stats">
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
            <div className="grid-cards">
              {applications.slice(0, 6).map((application: Application) => {
                // Convert Firestore Timestamp to Date, then format as string
                const dateAppliedStr = application.dateApplied instanceof Date
                  ? application.dateApplied.toLocaleDateString()
                  : (application.dateApplied as any)?.toDate?.()?.toLocaleDateString() || 'N/A';
                
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
                    }} 
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <button
          onClick={() => router.push(ROUTES.AUTHENTICATED.SUPERVISOR_APPLICATIONS)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed p-6 text-left"
        >
          <h3 className="text-lg font-semibold mb-2">View All Applications</h3>
          <p className="text-sm opacity-90">Review and manage student applications</p>
        </button>
    </PageLayout>
  );
}
