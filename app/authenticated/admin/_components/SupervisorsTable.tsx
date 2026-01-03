'use client';

import Table from '@/app/components/shared/Table';
import type { Supervisor } from '@/types/database';
import type { SortConfig } from '../_utils/dataProcessing';
import StatusBadge from '@/app/components/shared/StatusBadge';
import { SUPERVISORS_TABLE_WIDTHS } from '../_utils/tableConfig';
import { emptyStateContainer, sortableHeaderButton, linkEmail, capacityAvailable, capacityUnavailable } from '@/lib/styles/shared-styles';

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
  isLoading = false,
}: SupervisorsTableProps) {
  const getSortIcon = (column: string) => {
    if (sortConfig.column !== column) {
      return '↕️';
    }
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (data.length === 0) {
    return <div className={emptyStateContainer}>No supervisors found</div>;
  }

  const widths = showAvailableSlots 
    ? SUPERVISORS_TABLE_WIDTHS.withAvailableSlots 
    : SUPERVISORS_TABLE_WIDTHS.withoutAvailableSlots;

  return (
    <Table.Container>
      <Table.Header>
        <tr>
          <Table.HeaderCell className={widths.name}>
            <button
              onClick={() => onSort('name')}
              className={sortableHeaderButton}
            >
              Name {getSortIcon('name')}
            </button>
          </Table.HeaderCell>
          <Table.HeaderCell className={widths.email}>
            <button
              onClick={() => onSort('email')}
              className={sortableHeaderButton}
            >
              Email {getSortIcon('email')}
            </button>
          </Table.HeaderCell>
          <Table.HeaderCell className={widths.department}>
            <button
              onClick={() => onSort('department')}
              className={sortableHeaderButton}
            >
              Department {getSortIcon('department')}
            </button>
          </Table.HeaderCell>
          <Table.HeaderCell align="center" className={widths.capacity}>
            Capacity
          </Table.HeaderCell>
          {showAvailableSlots && (
            <Table.HeaderCell align="center" className={SUPERVISORS_TABLE_WIDTHS.withAvailableSlots.availableSlots}>
              Available Slots
            </Table.HeaderCell>
          )}
          <Table.HeaderCell align="center" className={widths.status}>
            Status
          </Table.HeaderCell>
        </tr>
      </Table.Header>
      <Table.Body>
        {data.map((supervisor) => {
          const availableSlots = supervisor.maxCapacity - supervisor.currentCapacity;
          return (
            <Table.Row key={supervisor.id}>
              <Table.Cell className={widths.name}>{supervisor.fullName}</Table.Cell>
              <Table.Cell className={widths.email}>
                <a href={`mailto:${supervisor.email}`} className={linkEmail}>
                  {supervisor.email}
                </a>
              </Table.Cell>
              <Table.Cell className={widths.department}>{supervisor.department}</Table.Cell>
              <Table.Cell className={widths.capacity}>
                <div className="text-center">
                  {supervisor.currentCapacity} / {supervisor.maxCapacity}
                </div>
              </Table.Cell>
              {showAvailableSlots && (
                <Table.Cell className={SUPERVISORS_TABLE_WIDTHS.withAvailableSlots.availableSlots}>
                  <div className="text-center">
                    <span className={availableSlots > 0 ? capacityAvailable : capacityUnavailable}>
                      {availableSlots}
                    </span>
                  </div>
                </Table.Cell>
              )}
              <Table.Cell className={widths.status}>
                <div className="flex justify-center">
                  <StatusBadge 
                    status={supervisor.availabilityStatus} 
                    variant="availability" 
                  />
                </div>
              </Table.Cell>
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table.Container>
  );
}

