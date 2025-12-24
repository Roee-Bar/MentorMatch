'use client';

import Table from '@/app/components/shared/Table';
import type { Student } from '@/types/database';
import type { SortConfig } from '../_utils/dataProcessing';
import { formatFirestoreDate } from '@/lib/utils/date';
import StatusBadge from '@/app/components/shared/StatusBadge';
import { emptyStateContainer, sortableHeaderButton, linkEmail } from '@/lib/styles/shared-styles';

interface StudentsTableProps {
  data: Student[];
  sortConfig: SortConfig;
  onSort: (column: string) => void;
  isLoading?: boolean;
}

export default function StudentsTable({
  data,
  sortConfig,
  onSort,
  isLoading = false,
}: StudentsTableProps) {
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
    return <div className={emptyStateContainer}>No students found</div>;
  }

  return (
    <Table.Container>
      <Table.Header>
        <tr>
          <Table.HeaderCell>
            <button
              onClick={() => onSort('name')}
              className={sortableHeaderButton}
            >
              Name {getSortIcon('name')}
            </button>
          </Table.HeaderCell>
          <Table.HeaderCell>
            <button
              onClick={() => onSort('studentId')}
              className={sortableHeaderButton}
            >
              Student ID {getSortIcon('studentId')}
            </button>
          </Table.HeaderCell>
          <Table.HeaderCell>
            <button
              onClick={() => onSort('email')}
              className={sortableHeaderButton}
            >
              Email {getSortIcon('email')}
            </button>
          </Table.HeaderCell>
          <Table.HeaderCell>
            <button
              onClick={() => onSort('department')}
              className={sortableHeaderButton}
            >
              Department {getSortIcon('department')}
            </button>
          </Table.HeaderCell>
          <Table.HeaderCell>
            <button
              onClick={() => onSort('matchStatus')}
              className={sortableHeaderButton}
            >
              Status {getSortIcon('matchStatus')}
            </button>
          </Table.HeaderCell>
          <Table.HeaderCell>
            <button
              onClick={() => onSort('registrationDate')}
              className={sortableHeaderButton}
            >
              Registered {getSortIcon('registrationDate')}
            </button>
          </Table.HeaderCell>
        </tr>
      </Table.Header>
      <Table.Body>
        {data.map((student) => (
          <Table.Row key={student.id}>
            <Table.Cell>{student.fullName}</Table.Cell>
            <Table.Cell>{student.studentId}</Table.Cell>
            <Table.Cell>
              <a href={`mailto:${student.email}`} className={linkEmail}>
                {student.email}
              </a>
            </Table.Cell>
            <Table.Cell>{student.department}</Table.Cell>
            <Table.Cell>
              <StatusBadge status={student.matchStatus} variant="matchStatus" />
            </Table.Cell>
            <Table.Cell>{formatFirestoreDate(student.registrationDate)}</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Container>
  );
}

