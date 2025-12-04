'use client';

// app/authenticated/supervisor/page.tsx
// Supervisor Authenticated - Read-only view of applications and profile

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupervisorAuth } from '@/lib/hooks';
import { ROUTES } from '@/lib/routes';
import { apiClient } from '@/lib/api/client';
import { auth } from '@/lib/firebase';
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
  
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [supervisor, setSupervisor] = useState<Supervisor | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;

      try {
        // Get Firebase ID token
        const token = await auth.currentUser?.getIdToken();
        if (!token) {
          router.push('/login');
          return;
        }

        // Call API endpoints
        const [supervisorResponse, applicationsResponse, projectsResponse] = await Promise.all([
          apiClient.getSupervisorById(userId, token),
          apiClient.getSupervisorApplications(userId, token),
          apiClient.getSupervisorProjects(userId, token),
        ]);

        setSupervisor(supervisorResponse.data);
        setApplications(applicationsResponse.data);
        setProjects(projectsResponse.data);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load some dashboard data. Please refresh the page.');
      } finally {
        setDataLoading(false);
      }
    };

    if (userId) {
      fetchData();
    }
  }, [userId, router]);

  // Calculate stats
  const pendingCount = applications.filter(
    (app) => app.status === 'pending' || app.status === 'under_review'
  ).length;
  const approvedProjects = projects.filter((proj) => proj.status === 'approved').length;
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
              {applications.slice(0, 6).map((application) => {
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
