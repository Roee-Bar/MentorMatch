'use client';

import { useEffect, useState } from 'react';
import StatCard from '@/app/components/dashboard/StatCard';
import ApplicationCard from '@/app/components/dashboard/ApplicationCard';
import { Application } from '@/types/dashboard';
import { RepositoryFactory } from '@/lib/repositories';

export default function SupervisorDashboard() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const applicationRepo = RepositoryFactory.getApplicationRepository();
        
        // TODO Phase B: Get actual supervisor ID from auth context
        // For now, use supervisor ID '1' for testing
        const appsData = await applicationRepo.getApplicationsBySupervisorId('1');
        
        setApplications(appsData);
      } catch (error) {
        console.error('Error fetching supervisor dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const pendingCount = applications.filter(app => app.status === 'pending').length;
  const underReviewCount = applications.filter(app => app.status === 'under_review').length;
  const approvedCount = applications.filter(app => app.status === 'approved').length;

  if (loading) {
    return <div className="min-h-screen p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Supervisor Dashboard
          </h1>
          <p className="text-gray-600">
            Manage your project applications and student supervision.
          </p>
        </div>

        {/* Stats Grid - 4 columns for supervisor view */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Applications"
            value={applications.length}
            description="All applications"
            color="blue"
          />
          <StatCard
            title="Pending Review"
            value={pendingCount}
            description="Awaiting response"
            color="gray"
          />
          <StatCard
            title="Under Review"
            value={underReviewCount}
            description="Currently reviewing"
            color="blue"
          />
          <StatCard
            title="Approved"
            value={approvedCount}
            description="Accepted students"
            color="green"
          />
        </div>

        {/* All Applications Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            My Applications
          </h2>
          {applications.length === 0 ? (
            <p className="text-gray-500">No applications yet.</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {applications.map((application) => (
                <ApplicationCard
                  key={application.id}
                  application={application}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

