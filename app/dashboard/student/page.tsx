'use client';

// app/dashboard/student/page.tsx
// Updated Student Dashboard - Uses real Firebase data

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthChange, getUserProfile } from '@/lib/auth';
import { 
  ApplicationService, 
  SupervisorService, 
  StudentService 
} from '@/lib/services';
import StatCard from '@/app/components/dashboard/StatCard';
import ApplicationCard from '@/app/components/dashboard/ApplicationCard';
import SupervisorCard from '@/app/components/dashboard/SupervisorCard';
import { ApplicationCardData, SupervisorCardData } from '@/types/database';

export default function StudentDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [applications, setApplications] = useState<ApplicationCardData[]>([]);
  const [supervisors, setSupervisors] = useState<SupervisorCardData[]>([]);

  // Check authentication
  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      if (!user) {
        router.replace('/login');
        return;
      }

      // Get user profile to verify they're a student
      const profile = await getUserProfile(user.uid);
      if (!profile.success || profile.data?.role !== 'student') {
        // Redirect non-students to appropriate dashboard
        if (profile.data?.role === 'supervisor') {
          router.replace('/dashboard/supervisor');
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
        const [appsData, supervisorsData] = await Promise.all([
          ApplicationService.getStudentApplications(userId),
          SupervisorService.getAvailableSupervisors(),
        ]);

        setApplications(appsData);
        setSupervisors(supervisorsData);
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
  const approvedCount = applications.filter((app) => app.status === 'approved').length;
  const pendingCount = applications.filter(
    (app) => app.status === 'pending' || app.status === 'under_review'
  ).length;

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
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Student Dashboard</h1>
          <p className="text-gray-600">
            Welcome back, {userProfile?.name || 'Student'}! Here&apos;s your project matching overview.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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

        {/* My Applications Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800">My Applications</h2>
            <button
              onClick={() => router.push('/supervisors')}
              className="btn-primary"
            >
              + New Application
            </button>
          </div>

          {applications.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow border border-gray-200 text-center">
              <p className="text-gray-500 mb-4">You haven&apos;t submitted any applications yet.</p>
              <button
                onClick={() => router.push('/supervisors')}
                className="btn-primary px-6 py-2"
              >
                Browse Supervisors
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {applications.map((application) => (
                <ApplicationCard key={application.id} application={application} />
              ))}
            </div>
          )}
        </div>

        {/* Available Supervisors Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Available Supervisors</h2>
            <button
              onClick={() => router.push('/supervisors')}
              className="text-blue-600 text-sm font-medium hover:underline"
            >
              View All →
            </button>
          </div>

          {supervisors.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow border border-gray-200 text-center">
              <p className="text-gray-500">No supervisors available at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {supervisors.slice(0, 3).map((supervisor) => (
                <SupervisorCard key={supervisor.id} supervisor={supervisor} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}