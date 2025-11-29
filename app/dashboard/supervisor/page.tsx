'use client';

// app/dashboard/supervisor/page.tsx
// Supervisor Dashboard - Read-only view of applications and profile

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupervisorAuth } from '@/lib/hooks';
import { ROUTES } from '@/lib/routes';
import { 
  ApplicationService, 
  SupervisorService,
  ProjectService
} from '@/lib/services';
import StatCard from '@/app/components/dashboard/StatCard';
import ApplicationCard from '@/app/components/dashboard/ApplicationCard';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { Application, Supervisor, Project } from '@/types/database';

export default function SupervisorDashboard() {
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
        const [supervisorData, applicationsData, projectsData] = await Promise.all([
          SupervisorService.getSupervisorById(userId),
          ApplicationService.getSupervisorApplications(userId),
          ProjectService.getSupervisorProjects(userId),
        ]);

        setSupervisor(supervisorData);
        setApplications(applicationsData);
        setProjects(projectsData);
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
  }, [userId]);

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
    <div className="page-container">
      <div className="page-content">
        {/* Error Banner */}
        {error && (
          <div className="error-banner">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 text-balance">Supervisor Dashboard</h1>
          <p className="text-gray-600">
            Welcome back, {userProfile?.name || 'Supervisor'}! Here&apos;s your supervision overview.
          </p>
        </div>

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

          <div className="card-base">
            <h3 className="text-lg font-semibold mb-2 text-gray-800">Capacity Status</h3>
            <p className="text-sm text-gray-600">
              {currentCapacity} / {supervisor?.maxCapacity || 0} students
            </p>
            <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 transition-all"
                style={{ 
                  width: `${supervisor?.maxCapacity ? (currentCapacity / supervisor.maxCapacity) * 100 : 0}%` 
                }}
              />
            </div>
          </div>

          <StatCard
            title="Approved Projects"
            value={approvedProjects}
            description="Projects in progress"
            color="blue"
          />
        </div>

        {/* Recent Applications Section */}
        <div className="mb-8">
          <div className="section-header">
            <h2 className="section-title">Recent Applications</h2>
            <button
              onClick={() => router.push(ROUTES.DASHBOARD.SUPERVISOR_APPLICATIONS)}
              className="text-blue-600 text-sm font-medium hover:underline"
            >
              View All →
            </button>
          </div>

          {applications.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state-text">No applications received yet.</p>
            </div>
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
          onClick={() => router.push(ROUTES.DASHBOARD.SUPERVISOR_APPLICATIONS)}
          className="btn-primary p-6 text-left"
        >
          <h3 className="text-lg font-semibold mb-2">View All Applications</h3>
          <p className="text-sm opacity-90">Review and manage student applications</p>
        </button>
      </div>
    </div>
  );
}
