'use client';

import Table from '@/app/components/shared/Table';
import type { Supervisor } from '@/types/database';
import type { SortConfig } from '../_utils/dataProcessing';
import StatusBadge from '@/app/components/shared/StatusBadge';

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
    return <div className="text-center py-8 text-gray-500">No supervisors found</div>;
  }

  return (
    <Table.Container>
      <Table.Header>
        <tr>
          <Table.HeaderCell>
            <button
              onClick={() => onSort('name')}
              className="flex items-center gap-2 hover:text-blue-600"
            >
              Name {getSortIcon('name')}
            </button>
          </Table.HeaderCell>
          <Table.HeaderCell>
            <button
              onClick={() => onSort('email')}
              className="flex items-center gap-2 hover:text-blue-600"
            >
              Email {getSortIcon('email')}
            </button>
          </Table.HeaderCell>
          <Table.HeaderCell>
            <button
              onClick={() => onSort('department')}
              className="flex items-center gap-2 hover:text-blue-600"
            >
              Department {getSortIcon('department')}
            </button>
          </Table.HeaderCell>
          <Table.HeaderCell align="center">
            Capacity
          </Table.HeaderCell>
          {showAvailableSlots && (
            <Table.HeaderCell align="center">
              Available Slots
            </Table.HeaderCell>
          )}
          <Table.HeaderCell align="center">
            Status
          </Table.HeaderCell>
        </tr>
      </Table.Header>
      <Table.Body>
        {data.map((supervisor) => {
          const availableSlots = supervisor.maxCapacity - supervisor.currentCapacity;
          return (
            <Table.Row key={supervisor.id}>
              <Table.Cell>{supervisor.fullName}</Table.Cell>
              <Table.Cell>
                <a href={`mailto:${supervisor.email}`} className="text-blue-600 hover:underline">
                  {supervisor.email}
                </a>
              </Table.Cell>
              <Table.Cell>{supervisor.department}</Table.Cell>
              <Table.Cell>
                <div className="text-center">
                  {supervisor.currentCapacity} / {supervisor.maxCapacity}
                </div>
              </Table.Cell>
              {showAvailableSlots && (
                <Table.Cell>
                  <div className="text-center">
                    <span className={availableSlots > 0 ? 'text-green-600 font-semibold' : 'text-gray-500'}>
                      {availableSlots}
                    </span>
                  </div>
                </Table.Cell>
              )}
              <Table.Cell>
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

