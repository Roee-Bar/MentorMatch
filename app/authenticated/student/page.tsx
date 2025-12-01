'use client';

// app/authenticated/student/page.tsx
// Updated Student Authenticated - Uses real Firebase data

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthChange, getUserProfile } from '@/lib/auth';
import { apiClient } from '@/lib/api/client';
import { auth } from '@/lib/firebase';
import StatCard from '@/app/components/authenticated/StatCard';
import ApplicationCard from '@/app/components/authenticated/ApplicationCard';
import SupervisorCard from '@/app/components/authenticated/SupervisorCard';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import StatusMessage from '@/app/components/feedback/StatusMessage';
import { ApplicationCardData, SupervisorCardData } from '@/types/database';

export default function StudentAuthenticated() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [applications, setApplications] = useState<ApplicationCardData[]>([]);
  const [supervisors, setSupervisors] = useState<SupervisorCardData[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Check authentication
  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      if (!user) {
        // User not logged in - redirect to homepage
        router.replace('/');
        return;
      }

      // Get user profile to verify they're a student
      const token = await user.getIdToken();
      const profile = await getUserProfile(user.uid, token);
      if (!profile.success || profile.data?.role !== 'student') {
        // Redirect non-students to appropriate authenticated page
        if (profile.data?.role === 'supervisor') {
          router.replace('/authenticated/supervisor');
        } else if (profile.data?.role === 'admin') {
          router.replace('/authenticated/admin');
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

      setLoading(true);
      setError(null);
      
      try {
        // Get Firebase ID token
        const token = await auth.currentUser?.getIdToken();
        if (!token) {
          router.push('/login');
          return;
        }

        // Call API endpoints
        const [appsResponse, supervisorsResponse] = await Promise.all([
          apiClient.getStudentApplications(userId, token),
          apiClient.getSupervisors(token, { available: true }),
        ]);

        setApplications(appsResponse.data);
        setSupervisors(supervisorsResponse.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data. Please try again.');
        // Even on error, we should stop loading to show the page
        setApplications([]);
        setSupervisors([]);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchData();
    }
  }, [userId, router]);

  // Calculate stats
  const approvedCount = applications.filter((app) => app.status === 'approved').length;
  const pendingCount = applications.filter(
    (app) => app.status === 'pending' || app.status === 'under_review'
  ).length;

  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  return (
    <div className="page-container">
      <div className="page-content">
        {/* Error Banner */}
        {error && (
          <StatusMessage 
            message={error} 
            type="error"
          />
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 text-balance">Student Dashboard</h1>
          <p className="text-gray-600">
            Welcome back, {userProfile?.name || 'Student'}! Here&apos;s your project matching overview.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid-stats">
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
          <div className="section-header">
            <h2 className="section-title">My Applications</h2>
            <button
              onClick={() => router.push('/supervisors')}
              className="btn-primary"
            >
              + New Application
            </button>
          </div>

          {applications.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state-text mb-4">You haven&apos;t submitted any applications yet.</p>
              <button
                onClick={() => router.push('/supervisors')}
                className="btn-primary px-6 py-2"
              >
                Browse Supervisors
              </button>
            </div>
          ) : (
            <div className="grid-cards">
              {applications.map((application) => (
                <ApplicationCard key={application.id} application={application} />
              ))}
            </div>
          )}
        </div>

        {/* Available Supervisors Section */}
        <div className="mb-8">
          <div className="section-header">
            <h2 className="section-title">Available Supervisors</h2>
            <button
              onClick={() => router.push('/supervisors')}
              className="text-blue-600 text-sm font-medium hover:underline"
            >
              View All →
            </button>
          </div>

          {supervisors.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state-text">No supervisors available at the moment.</p>
            </div>
          ) : (
            <div className="grid-cards">
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