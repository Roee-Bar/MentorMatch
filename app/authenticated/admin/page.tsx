'use client';

import { useState } from 'react';
import { useAuth, useAdminDashboard, useStatCardTables, useCapacityUpdate } from '@/lib/hooks';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import StatusMessage from '@/app/components/feedback/StatusMessage';
import ErrorState from '@/app/components/feedback/ErrorState';
import CapacityEditModal from './_components/CapacityEditModal';
import StatCardTable from './_components/StatCardTable';
import SupervisorCapacitySection from './_components/SupervisorCapacitySection';
import AdminMetricsGrid from './_components/AdminMetricsGrid';
import PageLayout from '@/app/components/layout/PageLayout';
import PageHeader from '@/app/components/layout/PageHeader';
import type { Supervisor } from '@/types/database';

export default function AdminAuthenticated() {
  const { isAuthLoading } = useAuth({ expectedRole: 'admin' });
  const [selectedSupervisor, setSelectedSupervisor] = useState<Supervisor | null>(null);
  const [showCapacityModal, setShowCapacityModal] = useState(false);

  // Fetch admin data
  const { data: adminData, loading: dataLoading, error: fetchError, isRefetching, refetch } = useAdminDashboard();

  const stats = adminData?.stats || null;
  const supervisors = adminData?.supervisors || [];

  // Stat card tables logic
  const statCardTables = useStatCardTables({ supervisors });

  // Capacity update logic
  const { successMessage, error: capacityError, handleCapacityUpdateSuccess } = useCapacityUpdate({ refetch });

  const handleEditCapacity = (supervisor: Supervisor) => {
    setSelectedSupervisor(supervisor);
    setShowCapacityModal(true);
  };

  const handleCloseModal = () => {
    setShowCapacityModal(false);
    setSelectedSupervisor(null);
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
        {/* Success Message */}
        {successMessage && (
          <StatusMessage 
            message={successMessage} 
            type="success"
          />
        )}

        {/* Error Message */}
        {capacityError && (
          <StatusMessage 
            message={capacityError} 
            type="error"
          />
        )}

        {/* Header */}
        <PageHeader
          title="Admin Dashboard"
          description="Overview of students, supervisors, and project applications"
        />

        {/* Metrics Grid */}
        <AdminMetricsGrid 
          stats={stats}
          activeStatCard={statCardTables.activeStatCard}
          onStatCardClick={statCardTables.handleStatCardClick}
          isRefetching={isRefetching}
        />

        {/* Stat Card Tables Section */}
        <StatCardTable
          activeStatCard={statCardTables.activeStatCard}
          onClose={() => statCardTables.handleStatCardClick(statCardTables.activeStatCard)}
          studentsData={statCardTables.studentsData}
          supervisorsData={statCardTables.supervisorsData}
          applicationsData={statCardTables.applicationsData}
          studentsLoading={statCardTables.studentsLoading}
          applicationsLoading={statCardTables.applicationsLoading}
          studentsError={statCardTables.studentsError}
          applicationsError={statCardTables.applicationsError}
          filterText={statCardTables.filterText}
          onFilterChange={statCardTables.setFilterText}
          sortConfig={statCardTables.sortConfig}
          onSort={statCardTables.handleSort}
          studentsCache={statCardTables.studentsCache}
          onRetry={statCardTables.clearCache}
          tableRef={statCardTables.tableRef}
        />

        {/* Supervisor Capacity Management Section */}
        <SupervisorCapacitySection
          supervisors={supervisors}
          loading={dataLoading}
          onEdit={handleEditCapacity}
          onRefresh={refetch}
        />

        {/* Capacity Edit Modal */}
        {selectedSupervisor && (
          <CapacityEditModal
            supervisor={selectedSupervisor}
            isOpen={showCapacityModal}
            onClose={handleCloseModal}
            onSuccess={handleCapacityUpdateSuccess}
          />
        )}
      </div>
    </PageLayout>
  );
}

