'use client';

// app/dashboard/supervisor/applications/page.tsx
// Supervisor Applications View - Read-only view with filtering

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthChange, getUserProfile } from '@/lib/auth';
import { ApplicationService } from '@/lib/services';
import ApplicationCard from '@/app/components/dashboard/ApplicationCard';
import { Application } from '@/types/database';

type FilterStatus = 'all' | 'pending' | 'under_review' | 'approved' | 'rejected';

export default function SupervisorApplicationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  // Check authentication
  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      if (!user) {
        router.replace('/login');
        return;
      }

      const profile = await getUserProfile(user.uid);
      if (!profile.success || profile.data?.role !== 'supervisor') {
        router.replace('/');
        return;
      }

      setUserId(user.uid);
    });

    return () => unsubscribe();
  }, [router]);

  // Fetch applications
  useEffect(() => {
    const fetchApplications = async () => {
      if (!userId) return;

      try {
        const data = await ApplicationService.getSupervisorApplications(userId);
        setApplications(data);
      } catch (error) {
        console.error('Error fetching applications:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchApplications();
    }
  }, [userId]);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Applications</h1>
          <p className="text-gray-600">
            Review and manage student project applications
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="mb-6 flex flex-wrap gap-3">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            All ({statusCounts.all})
          </button>
          
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === 'pending'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Pending ({statusCounts.pending})
          </button>
          
          <button
            onClick={() => setFilterStatus('under_review')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === 'under_review'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Under Review ({statusCounts.under_review})
          </button>
          
          <button
            onClick={() => setFilterStatus('approved')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === 'approved'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Approved ({statusCounts.approved})
          </button>
          
          <button
            onClick={() => setFilterStatus('rejected')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === 'rejected'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Rejected ({statusCounts.rejected})
          </button>
        </div>

        {/* Applications Grid */}
        {filteredApplications.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow border border-gray-200 text-center">
            <p className="text-gray-500">
              {applications.length === 0 
                ? 'No applications received yet.' 
                : `No ${filterStatus} applications.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
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
      </div>
    </div>
  );
}

