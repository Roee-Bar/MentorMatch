'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { useAdminAuth, useAuthenticatedFetch } from '@/lib/hooks';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import StatusMessage from '@/app/components/feedback/StatusMessage';
import ErrorState from '@/app/components/feedback/ErrorState';
import CapacityEditModal from './_components/CapacityEditModal';
import StatCardWithIcon from '@/app/components/shared/StatCardWithIcon';
import Table from '@/app/components/shared/Table';
import ProgressBar from '@/app/components/shared/ProgressBar';
import StatusBadge from '@/app/components/shared/StatusBadge';
import PageLayout from '@/app/components/layout/PageLayout';
import PageHeader from '@/app/components/layout/PageHeader';
import SectionHeader from '@/app/components/layout/SectionHeader';
import type { Supervisor } from '@/types/database';

export default function AdminAuthenticated() {
  const { userId, isAuthLoading } = useAdminAuth();
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedSupervisor, setSelectedSupervisor] = useState<Supervisor | null>(null);
  const [showCapacityModal, setShowCapacityModal] = useState(false);

  // Fetch admin data using the new hook
  const { data: adminData, loading: dataLoading, error: fetchError, refetch } = useAuthenticatedFetch(
    async (token) => {
      const [statsResponse, supervisorsResponse] = await Promise.all([
        apiClient.getAdminStats(token),
        apiClient.getSupervisors(token, {}),
      ]);

      return {
        stats: statsResponse.data,
        supervisors: supervisorsResponse.data || [],
      };
    },
    []
  );

  const stats = adminData?.stats || null;
  const supervisors = adminData?.supervisors || [];

  const handleEditCapacity = (supervisor: Supervisor) => {
    setSelectedSupervisor(supervisor);
    setShowCapacityModal(true);
  };

  const handleCapacityUpdateSuccess = async () => {
    setSuccessMessage('Supervisor capacity updated successfully!');
    setTimeout(() => setSuccessMessage(null), 5000);
    
    // Refresh admin data
    await refetch();
  };

  if (isAuthLoading || dataLoading) {
    return <LoadingSpinner message="Loading admin dashboard..." />;
  }

  // Handle fetch error
  if (fetchError) {
    return (
      <PageLayout variant="simple">
        <div className="py-8">
          <ErrorState
            message={fetchError}
            action={{
              label: 'Retry',
              onClick: () => refetch()
            }}
          />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout variant="simple">
      <div className="py-8">
        {/* Error Banner */}
        {error && (
          <StatusMessage 
            message={error} 
            type="error"
          />
        )}

        {/* Success Message */}
        {successMessage && (
          <StatusMessage 
            message={successMessage} 
            type="success"
          />
        )}

        {/* Header */}
        <PageHeader
          title="Admin Dashboard"
          description="Manage users, projects, and system settings"
        />

        {/* Section 1: Student Metrics */}
        <div className="mb-8">
          <SectionHeader title="Student Metrics" />
          <div className="grid-stats">
            <StatCardWithIcon
              title="Total Students"
              value={stats?.totalStudents ?? '-'}
              description="Enrolled students"
              color="blue"
              icon={
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              }
            />

            <StatCardWithIcon
              title="Students Without Project"
              value={stats?.studentsWithoutApprovedApp ?? '-'}
              description="Need project assignments"
              color="red"
              icon={
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              }
            />
          </div>
        </div>

        {/* Section 2: Supervisor Metrics */}
        <div className="mb-8">
          <SectionHeader title="Supervisor Metrics" />
          <div className="grid-stats">
            <StatCardWithIcon
              title="Total Supervisors"
              value={stats?.totalSupervisors ?? '-'}
              description="Active accounts"
              color="green"
              icon={
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
            />

            <StatCardWithIcon
              title="Available Capacity"
              value={stats?.totalAvailableCapacity ?? '-'}
              description="Total available project slots"
              color="blue"
              icon={
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              }
            />
          </div>
        </div>

        {/* Section 3: Application Metrics */}
        <div className="mb-8">
          <SectionHeader title="Application Metrics" />
          <div className="grid-stats">
            <StatCardWithIcon
              title="Approved Projects"
              value={stats?.approvedApplications ?? '-'}
              description="Successfully matched"
              color="green"
              icon={
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />

            <StatCardWithIcon
              title="Pending Applications"
              value={stats?.pendingApplications ?? '-'}
              description="Awaiting review"
              color="yellow"
              icon={
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
          </div>
        </div>

        {/* Supervisor Capacity Management Section */}
        <div className="mb-8">
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Manage Supervisor Capacity</h2>
            <button
              onClick={() => refetch()}
              className="text-blue-600 text-sm font-medium hover:underline"
              disabled={dataLoading}
            >
              {dataLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {dataLoading ? (
            <div className="text-center py-8">
              <LoadingSpinner message="Loading supervisors..." />
            </div>
          ) : supervisors.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No supervisors found
            </div>
          ) : (
            <Table.Container>
              <Table.Header>
                <tr>
                  <Table.HeaderCell>Name</Table.HeaderCell>
                  <Table.HeaderCell>Department</Table.HeaderCell>
                  <Table.HeaderCell>Capacity</Table.HeaderCell>
                  <Table.HeaderCell>Status</Table.HeaderCell>
                  <Table.HeaderCell align="right">Actions</Table.HeaderCell>
                </tr>
              </Table.Header>
              <Table.Body>
                {supervisors.map((supervisor: Supervisor) => (
                  <Table.Row key={supervisor.id}>
                    <Table.Cell>
                      <div className="text-sm font-medium text-gray-900">
                        {supervisor.fullName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {supervisor.email}
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-gray-700">{supervisor.department}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="text-sm text-gray-900 mb-1">
                        {supervisor.currentCapacity} / {supervisor.maxCapacity}
                      </div>
                      <ProgressBar
                        current={supervisor.currentCapacity}
                        max={supervisor.maxCapacity}
                        colorScheme="auto"
                        size="sm"
                      />
                    </Table.Cell>
                    <Table.Cell>
                      <StatusBadge
                        status={supervisor.availabilityStatus}
                        variant="availability"
                      />
                    </Table.Cell>
                    <Table.Cell>
                      <div className="text-right">
                        <button
                          onClick={() => handleEditCapacity(supervisor)}
                          className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                        >
                          Edit Capacity
                        </button>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Container>
          )}
        </div>
        </div>

        {/* Capacity Edit Modal */}
        {selectedSupervisor && (
          <CapacityEditModal
            supervisor={selectedSupervisor}
            isOpen={showCapacityModal}
            onClose={() => {
              setShowCapacityModal(false);
              setSelectedSupervisor(null);
            }}
            onSuccess={handleCapacityUpdateSuccess}
          />
        )}
      </div>
    </PageLayout>
  );
}

