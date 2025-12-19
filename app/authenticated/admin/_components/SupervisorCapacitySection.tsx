'use client';

import Table from '@/app/components/shared/Table';
import StatusBadge from '@/app/components/shared/StatusBadge';
import ProgressBar from '@/app/components/shared/ProgressBar';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import type { Supervisor } from '@/types/database';
import { cardBase, linkAction, textMuted, textPrimary, textSecondary, linkEditAction, headingXl } from '@/lib/styles/shared-styles';

interface SupervisorCapacitySectionProps {
  supervisors: Supervisor[];
  loading: boolean;
  onEdit: (supervisor: Supervisor) => void;
  onRefresh: () => void;
}

export default function SupervisorCapacitySection({
  supervisors,
  loading,
  onEdit,
  onRefresh,
}: SupervisorCapacitySectionProps) {
  return (
    <div className="mb-8">
      <div className={cardBase}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`${headingXl} font-semibold`}>Manage Supervisor Capacity</h2>
          <button
            onClick={onRefresh}
            className={linkAction}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {loading ? (
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
                        onClick={() => onEdit(supervisor)}
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
  );
}

