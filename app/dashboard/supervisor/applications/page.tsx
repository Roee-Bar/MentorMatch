'use client';

// app/dashboard/supervisor/applications/page.tsx
// Supervisor Applications View - Read-only view with filtering

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupervisorAuth } from '@/lib/hooks';
import { ROUTES } from '@/lib/routes';
import { ApplicationService } from '@/lib/services';
import ApplicationCard from '@/app/components/dashboard/ApplicationCard';
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
        const data = await ApplicationService.getSupervisorApplications(userId);
        setApplications(data);
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

  // Show loading while auth is checking or data is loading
  if (isAuthLoading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading applications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Unable to load applications. Please try again later.</p>
          <button
            onClick={() => router.push(ROUTES.DASHBOARD.SUPERVISOR)}
            className="btn-primary"
          >
            Back to Dashboard
          </button>
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
            className={`filter-btn ${filterStatus === 'all' ? 'filter-btn-active' : 'filter-btn-inactive'}`}
          >
            All ({statusCounts.all})
          </button>
          
          <button
            onClick={() => setFilterStatus('pending')}
            className={`filter-btn ${filterStatus === 'pending' ? 'filter-btn-active' : 'filter-btn-inactive'}`}
          >
            Pending ({statusCounts.pending})
          </button>
          
          <button
            onClick={() => setFilterStatus('under_review')}
            className={`filter-btn ${filterStatus === 'under_review' ? 'filter-btn-active' : 'filter-btn-inactive'}`}
          >
            Under Review ({statusCounts.under_review})
          </button>
          
          <button
            onClick={() => setFilterStatus('approved')}
            className={`filter-btn ${filterStatus === 'approved' ? 'filter-btn-active' : 'filter-btn-inactive'}`}
          >
            Approved ({statusCounts.approved})
          </button>
          
          <button
            onClick={() => setFilterStatus('rejected')}
            className={`filter-btn ${filterStatus === 'rejected' ? 'filter-btn-active' : 'filter-btn-inactive'}`}
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
