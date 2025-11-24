'use client';

// app/dashboard/supervisor/page.tsx
// Supervisor Dashboard - Read-only view of applications and profile

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthChange, getUserProfile } from '@/lib/auth';
import { 
  ApplicationService, 
  SupervisorService,
  ProjectService
} from '@/lib/services';
import StatCard from '@/app/components/dashboard/StatCard';
import ApplicationCard from '@/app/components/dashboard/ApplicationCard';
import { Application, Supervisor } from '@/types/database';

export default function SupervisorDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [supervisor, setSupervisor] = useState<Supervisor | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  // Check authentication
  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      if (!user) {
        router.replace('/login');
        return;
      }

      // Get user profile to verify they're a supervisor
      const profile = await getUserProfile(user.uid);
      if (!profile.success || profile.data?.role !== 'supervisor') {
        // Redirect non-supervisors to appropriate dashboard
        if (profile.data?.role === 'student') {
          router.replace('/dashboard/student');
        } else if (profile.data?.role === 'admin') {
          router.replace('/dashboard/admin');
        } else {
          router.replace('/');
        }
        return;
      }

      setUserId(user.uid);
      setUserProfile(profile.data);
    });

    return () => unsubscribe();
  }, [router]);

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
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
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

  if (loading) {
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

          <StatCard
            title="Current Capacity"
            value={currentCapacity}
            description="Active supervisions"
            color="green"
          />

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
              onClick={() => router.push('/dashboard/supervisor/applications')}
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
              {applications.slice(0, 6).map((application) => (
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
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={() => router.push('/dashboard/supervisor/applications')}
            className="btn-primary p-6 text-left"
          >
            <h3 className="text-lg font-semibold mb-2">View All Applications</h3>
            <p className="text-sm opacity-90">Review and manage student applications</p>
          </button>
          
          <button
            onClick={() => router.push('/dashboard/supervisor/profile')}
            className="btn-secondary p-6 text-left"
          >
            <h3 className="text-lg font-semibold mb-2">View Profile</h3>
            <p className="text-sm opacity-90">Check your profile and capacity</p>
          </button>
          
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
        </div>
      </div>
    </div>
  );
}

