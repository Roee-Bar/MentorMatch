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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Supervisor Dashboard</h1>
          <p className="text-gray-600">
            Welcome back, {userProfile?.name || 'Supervisor'}! Here&apos;s your supervision overview.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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

          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Recent Applications</h2>
            <button
              onClick={() => router.push(ROUTES.DASHBOARD.SUPERVISOR_APPLICATIONS)}
              className="text-blue-600 text-sm font-medium hover:underline"
            >
              View All →
            </button>
          </div>

          {applications.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow border border-gray-200 text-center">
              <p className="text-gray-500">No applications received yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
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
