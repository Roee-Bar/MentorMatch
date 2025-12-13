'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { useAdminAuth, useAuthenticatedFetch } from '@/lib/hooks';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import StatusMessage from '@/app/components/feedback/StatusMessage';
import ErrorState from '@/app/components/feedback/ErrorState';
import CapacityEditModal from './_components/CapacityEditModal';
import StatCard from '@/app/components/shared/StatCard';
import Table from '@/app/components/shared/Table';
import ProgressBar from '@/app/components/shared/ProgressBar';
import StatusBadge from '@/app/components/shared/StatusBadge';
import PageLayout from '@/app/components/layout/PageLayout';
import PageHeader from '@/app/components/layout/PageHeader';
import type { Supervisor } from '@/types/database';
import { cardBase, linkAction, textMuted } from '@/lib/styles/shared-styles';

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
        apiClient.getAdminSupervisors(token),
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
          description="Overview of students, supervisors, and project applications"
        />

        {/* Unified Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Students"
            value={stats?.totalStudents ?? '-'}
            description="Students enrolled in the system"
            color="blue"
          />

          <StatCard
            title="Students Without Projects"
            value={stats?.studentsWithoutApprovedApp ?? '-'}
            description="Students still needing project assignments"
            color="red"
          />

          <StatCard
            title="Total Supervisors"
            value={stats?.totalSupervisors ?? '-'}
            description="Active supervisor accounts in system"
            color="green"
          />

          <StatCard
            title="Available Capacity"
            value={stats?.totalAvailableCapacity ?? '-'}
            description="Open project slots across all supervisors"
            color="blue"
          />

          <StatCard
            title="Approved Projects"
            value={stats?.approvedApplications ?? '-'}
            description="Successfully matched student-supervisor pairs"
            color="green"
          />

          <StatCard
            title="Pending Applications"
            value={stats?.pendingApplications ?? '-'}
            description="Applications currently awaiting supervisor review"
            color="gray"
          />
        </div>

        {/* Supervisor Capacity Management Section */}
        <div className="mb-8">
          <div className={cardBase}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">Manage Supervisor Capacity</h2>
            <button
              onClick={() => refetch()}
              className={linkAction}
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
            <div className={`text-center py-8 ${textMuted}`}>
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

