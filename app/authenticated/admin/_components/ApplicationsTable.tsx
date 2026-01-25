'use client';

import Table from '@/app/components/shared/Table';
import type { Application, Student } from '@/types/database';
import type { SortConfig } from '../_utils/dataProcessing';
import { calculateDaysPending } from '../_utils/dataProcessing';
import StatusBadge from '@/app/components/shared/StatusBadge';
import { emptyStateContainer, sortableHeaderButton } from '@/lib/styles/shared-styles';

interface ApplicationsTableProps {
  data: Application[];
  sortConfig: SortConfig;
  onSort: (column: string) => void;
  studentsCache: Student[] | null;
  tableType: 'approved-projects' | 'pending-applications';
  isLoading?: boolean;
}

export default function ApplicationsTable({
  data,
  sortConfig,
  onSort,
  studentsCache,
  tableType,
  isLoading = false,
}: ApplicationsTableProps) {
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
    return <div className={emptyStateContainer}>No applications found</div>;
  }

  return (
    <Table.Container>
      <Table.Header>
        <tr>
          <Table.HeaderCell>
            <button
              onClick={() => onSort('projectTitle')}
              className={sortableHeaderButton}
            >
              Project Title {getSortIcon('projectTitle')}
            </button>
          </Table.HeaderCell>
          <Table.HeaderCell>
            <button
              onClick={() => onSort('studentName')}
              className={sortableHeaderButton}
            >
              Student(s) {getSortIcon('studentName')}
            </button>
          </Table.HeaderCell>
          <Table.HeaderCell>
            <button
              onClick={() => onSort('supervisorName')}
              className={sortableHeaderButton}
            >
              Supervisor {getSortIcon('supervisorName')}
            </button>
          </Table.HeaderCell>
          <Table.HeaderCell align="center">
            Status
          </Table.HeaderCell>
          {tableType === 'pending-applications' && (
            <Table.HeaderCell align="center">
              Days Pending
            </Table.HeaderCell>
          )}
        </tr>
      </Table.Header>
      <Table.Body>
        {data.map((application) => {
          const daysPending = tableType === 'pending-applications' 
            ? calculateDaysPending(application.dateApplied)
            : null;

          return (
            <Table.Row key={application.id}>
              <Table.Cell className="font-medium" truncate>
                {application.projectTitle}
              </Table.Cell>
              <Table.Cell truncate>
                {application.hasPartner && application.partnerName ? (
                  <div className="flex flex-col">
                    <span>{application.studentName}</span>
                    <span className="text-gray-500 dark:text-gray-400">{application.partnerName}</span>
                  </div>
                ) : (
                  application.studentName
                )}
              </Table.Cell>
              <Table.Cell truncate>{application.supervisorName}</Table.Cell>
              <Table.Cell>
                <div className="flex justify-center">
                  <StatusBadge status={application.status} variant="application" />
                </div>
              </Table.Cell>
              {tableType === 'pending-applications' && daysPending !== null && (
                <Table.Cell>
                  <div className="flex justify-center">
                    <span className={(daysPending > 7 && 'text-orange-600 font-semibold') || undefined}>
                      {daysPending} day{daysPending !== 1 ? 's' : ''}
                    </span>
                  </div>
                </Table.Cell>
              )}
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table.Container>
  );
}

