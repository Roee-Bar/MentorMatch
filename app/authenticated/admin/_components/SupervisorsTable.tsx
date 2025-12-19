'use client';

import Table from '@/app/components/shared/Table';
import StatusBadge from '@/app/components/shared/StatusBadge';
import ProgressBar from '@/app/components/shared/ProgressBar';
import EmptyState from '@/app/components/feedback/EmptyState';
import { SortIndicator, type SortConfig } from '../_utils/dataProcessing';
import type { Supervisor } from '@/types/database';
import { textPrimary, textSecondary, textMuted } from '@/lib/styles/shared-styles';

interface SupervisorsTableProps {
  data: Supervisor[];
  sortConfig: SortConfig;
  onSort: (column: string) => void;
  showAvailableSlots?: boolean;
  isLoading?: boolean;
}

export default function SupervisorsTable({ 
  data, 
  sortConfig, 
  onSort, 
  showAvailableSlots = false,
  isLoading 
}: SupervisorsTableProps) {
  if (isLoading) {
    return null; // Loading state handled by parent
  }

  if (data.length === 0) {
    return <EmptyState message="No supervisors found matching your criteria." />;
  }

  return (
    <Table.Container>
      <Table.Header>
        <tr>
          <Table.HeaderCell>
            <button onClick={() => onSort('name')} className="flex items-center">
              Name <SortIndicator column="name" sortConfig={sortConfig} />
            </button>
          </Table.HeaderCell>
          <Table.HeaderCell>
            <button onClick={() => onSort('email')} className="flex items-center">
              Email <SortIndicator column="email" sortConfig={sortConfig} />
            </button>
          </Table.HeaderCell>
          <Table.HeaderCell>
            <button onClick={() => onSort('department')} className="flex items-center">
              Department <SortIndicator column="department" sortConfig={sortConfig} />
            </button>
          </Table.HeaderCell>
          {showAvailableSlots && (
            <Table.HeaderCell>
              <button onClick={() => onSort('availableSlots')} className="flex items-center">
                Available Slots <SortIndicator column="availableSlots" sortConfig={sortConfig} />
              </button>
            </Table.HeaderCell>
          )}
          <Table.HeaderCell>
            <button onClick={() => onSort('capacity')} className="flex items-center">
              Capacity <SortIndicator column="capacity" sortConfig={sortConfig} />
            </button>
          </Table.HeaderCell>
          <Table.HeaderCell>
            <button onClick={() => onSort('availabilityStatus')} className="flex items-center">
              Status <SortIndicator column="availabilityStatus" sortConfig={sortConfig} />
            </button>
          </Table.HeaderCell>
          <Table.HeaderCell>Is Active</Table.HeaderCell>
        </tr>
      </Table.Header>
      <Table.Body>
        {data.map((supervisor: Supervisor) => (
          <Table.Row key={supervisor.id}>
            <Table.Cell>
              <div className={`text-sm font-medium ${textPrimary}`}>
                {supervisor.fullName}
              </div>
            </Table.Cell>
            <Table.Cell>
              <span className={`text-sm ${textSecondary}`}>{supervisor.email}</span>
            </Table.Cell>
            <Table.Cell>
              <span className={`text-sm ${textSecondary}`}>{supervisor.department}</span>
            </Table.Cell>
            {showAvailableSlots && (
              <Table.Cell>
                <span className={`text-sm font-medium ${textPrimary}`}>
                  {supervisor.maxCapacity - supervisor.currentCapacity}
                </span>
              </Table.Cell>
            )}
            <Table.Cell>
              <div className={`text-sm ${textPrimary} mb-1`}>
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
              <span className={`text-sm ${supervisor.isActive ? 'text-green-600' : textMuted}`}>
                {supervisor.isActive ? 'Yes' : 'No'}
              </span>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Container>
  );
}

