'use client';

import { useEffect, useState } from 'react';
import StatCard from '@/components/dashboard/StatCard';
import ApplicationCard from '@/components/dashboard/ApplicationCard';
import SupervisorCard from '@/components/dashboard/SupervisorCard';
import { Application, Supervisor } from '@/types/dashboard';
import { ApplicationService, SupervisorService } from '@/mock-data';

export default function StudentDashboard() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [appsData, supervisorsData] = await Promise.all([
          ApplicationService.getAllApplications(),
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

    fetchData();
  }, []);

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
            Student Dashboard
          </h1>
          <p className="text-gray-600">
            Welcome back! Here&apos;s your project matching overview.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="My Applications"
            value={applications.length}
            description="Active applications"
            color="blue"
          />

          <StatCard
            title="Available Supervisors"
            value={supervisors.length}
            description="Ready to accept students"
            color="green"
          />

          <StatCard
            title="Application Status"
            value={approvedCount}
            description="Approved application"
            color="green"
          />
        </div>

        {/* My Applications Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            My Applications
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {applications.map((application) => (
              <ApplicationCard
                key={application.id}
                application={application}
              />
            ))}
          </div>
        </div>

        {/* Available Supervisors Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Available Supervisors
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {supervisors.map((supervisor) => (
              <SupervisorCard key={supervisor.id} supervisor={supervisor} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

