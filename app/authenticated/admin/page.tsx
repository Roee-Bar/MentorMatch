'use client';

import { useState, useRef, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';
import { useAuth, useAuthenticatedFetch } from '@/lib/hooks';
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
import { cardBase, linkAction, textMuted, textPrimary, textSecondary, linkEditAction, headingXl } from '@/lib/styles/shared-styles';

export default function AdminAuthenticated() {
  const { userId, isAuthLoading } = useAuth({ expectedRole: 'admin' });
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedSupervisor, setSelectedSupervisor] = useState<Supervisor | null>(null);
  const [showCapacityModal, setShowCapacityModal] = useState(false);

  // Fetch admin data using the new hook
  const { data: adminData, loading: dataLoading, error: fetchError, isRefetching, refetch } = useAuthenticatedFetch(
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
  const previousCapacityRef = useRef<number | null>(null);

  // Update ref when stats change
  useEffect(() => {
    if (stats?.totalAvailableCapacity !== undefined) {
      previousCapacityRef.current = stats.totalAvailableCapacity;
    }
  }, [stats?.totalAvailableCapacity]);

  const handleEditCapacity = (supervisor: Supervisor) => {
    setSelectedSupervisor(supervisor);
    setShowCapacityModal(true);
  };

  const handleCapacityUpdateSuccess = async () => {
    setSuccessMessage('Supervisor capacity updated successfully!');
    setTimeout(() => setSuccessMessage(null), 5000);
    setError(null); // Clear any previous errors
    
    // Store the current available capacity before update
    const previousAvailableCapacity = stats?.totalAvailableCapacity ?? null;
    
    // Wait for Firestore propagation (150ms delay)
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Retry logic with exponential backoff
    let attempts = 0;
    const maxAttempts = 3;
    const delays = [300, 600, 900]; // ms - exponential backoff
    
    while (attempts < maxAttempts) {
      try {
        await refetch();
        
        // Wait a bit for state to update after refetch
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Check if the data has changed by comparing with previous value
        // We'll check this in the next iteration or after a short delay
        // For now, if refetch succeeded without error, assume it worked
        // The retries will help with eventual consistency
        
        attempts++;
        
        // If this is the last attempt, break regardless
        if (attempts >= maxAttempts) {
          break;
        }
        
        // Wait before retrying with exponential backoff
        await new Promise(resolve => setTimeout(resolve, delays[attempts - 1]));
      } catch (err: any) {
        attempts++;
        if (attempts >= maxAttempts) {
          // All retry attempts failed
          setError('Failed to refresh statistics. Please refresh the page manually or click Retry below.');
          break;
        }
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delays[attempts - 1] || 300));
      }
    }
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
          <div className="mb-6 p-4 rounded-xl border bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-800">
            <div className="flex items-center justify-between">
              <span className="text-red-800 font-medium dark:text-red-200">{error}</span>
              <button
                onClick={async () => {
                  setError(null);
                  await refetch();
                }}
                className="ml-4 px-3 py-1 text-sm font-medium text-red-800 bg-red-100 hover:bg-red-200 rounded-md transition-colors dark:text-red-200 dark:bg-red-800/50 dark:hover:bg-red-800"
              >
                Retry
              </button>
            </div>
          </div>
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
            isLoading={isRefetching}
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
            <h2 className={`${headingXl} font-semibold`}>Manage Supervisor Capacity</h2>
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
                  <Table.HeaderCell align="center">Actions</Table.HeaderCell>
                </tr>
              </Table.Header>
              <Table.Body>
                {supervisors.map((supervisor: Supervisor) => (
                  <Table.Row key={supervisor.id}>
                    <Table.Cell>
                      <div className={`text-sm font-medium ${textPrimary}`}>
                        {supervisor.fullName}
                      </div>
                      <div className={`text-sm ${textMuted}`}>
                        {supervisor.email}
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <span className={`text-sm ${textSecondary}`}>{supervisor.department}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <div className={`text-sm ${textPrimary} mb-1 text-center`}>
                        {supervisor.currentCapacity} / {supervisor.maxCapacity}
                      </div>
                      <ProgressBar
                        current={supervisor.currentCapacity}
                        max={supervisor.maxCapacity}
                        colorScheme="auto"
                        size="sm"
                      />
                    </Table.Cell>
                    <Table.Cell className="text-center">
                      <StatusBadge
                        status={supervisor.availabilityStatus}
                        variant="availability"
                      />
                    </Table.Cell>
                    <Table.Cell>
                      <div className="text-right">
                        <button
                          onClick={() => handleEditCapacity(supervisor)}
                          className={linkEditAction}
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

