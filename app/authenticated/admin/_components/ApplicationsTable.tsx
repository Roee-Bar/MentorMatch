'use client';

import Table from '@/app/components/shared/Table';
import type { Application, Student } from '@/types/database';
import type { SortConfig } from '../_utils/dataProcessing';
import { formatFirestoreDate } from '@/lib/utils/date';
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
          <Table.HeaderCell className={tableType === 'approved-projects' ? 'w-[32%]' : 'w-[28%]'}>
            <button
              onClick={() => onSort('projectTitle')}
              className={sortableHeaderButton}
            >
              Project Title {getSortIcon('projectTitle')}
            </button>
          </Table.HeaderCell>
          <Table.HeaderCell className={tableType === 'approved-projects' ? 'w-[22%]' : 'w-[18%]'}>
            <button
              onClick={() => onSort('studentName')}
              className={sortableHeaderButton}
            >
              Student {getSortIcon('studentName')}
            </button>
          </Table.HeaderCell>
          <Table.HeaderCell className={tableType === 'approved-projects' ? 'w-[22%]' : 'w-[18%]'}>
            <button
              onClick={() => onSort('supervisorName')}
              className={sortableHeaderButton}
            >
              Supervisor {getSortIcon('supervisorName')}
            </button>
          </Table.HeaderCell>
          <Table.HeaderCell align="center" className={tableType === 'approved-projects' ? 'w-[12%]' : 'w-[10%]'}>
            Status
          </Table.HeaderCell>
          {tableType === 'pending-applications' && (
            <Table.HeaderCell align="center" className="w-[12%]">
              Days Pending
            </Table.HeaderCell>
          )}
          <Table.HeaderCell className={tableType === 'approved-projects' ? 'w-[12%]' : 'w-[14%]'}>
            Submitted
          </Table.HeaderCell>
        </tr>
      </Table.Header>
      <Table.Body>
        {data.map((application) => {
          const daysPending = tableType === 'pending-applications' 
            ? calculateDaysPending(application.dateApplied)
            : null;

          return (
            <Table.Row key={application.id}>
              <Table.Cell className={`font-medium ${tableType === 'approved-projects' ? 'w-[32%]' : 'w-[28%]'}`}>{application.projectTitle}</Table.Cell>
              <Table.Cell className={tableType === 'approved-projects' ? 'w-[22%]' : 'w-[18%]'}>{application.studentName}</Table.Cell>
              <Table.Cell className={tableType === 'approved-projects' ? 'w-[22%]' : 'w-[18%]'}>{application.supervisorName}</Table.Cell>
              <Table.Cell className={tableType === 'approved-projects' ? 'w-[12%]' : 'w-[10%]'}>
                <div className="flex justify-center">
                  <StatusBadge status={application.status} variant="application" />
                </div>
              </Table.Cell>
              {tableType === 'pending-applications' && daysPending !== null && (
                <Table.Cell className="w-[12%]">
                  <div className="flex justify-center">
                    <span className={daysPending > 7 ? 'text-orange-600 font-semibold' : ''}>
                      {daysPending} day{daysPending !== 1 ? 's' : ''}
                    </span>
                  </div>
                </Table.Cell>
              )}
              <Table.Cell className={tableType === 'approved-projects' ? 'w-[12%]' : 'w-[14%]'}>{formatFirestoreDate(application.dateApplied)}</Table.Cell>
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table.Container>
  );
}

