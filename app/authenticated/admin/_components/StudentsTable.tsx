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
          <Table.HeaderCell className="w-[20%]">
            <button
              onClick={() => onSort('name')}
              className={sortableHeaderButton}
            >
              Name {getSortIcon('name')}
            </button>
          </Table.HeaderCell>
          <Table.HeaderCell className="w-[12%]">
            <button
              onClick={() => onSort('studentId')}
              className={sortableHeaderButton}
            >
              Student ID {getSortIcon('studentId')}
            </button>
          </Table.HeaderCell>
          <Table.HeaderCell className="w-[25%]">
            <button
              onClick={() => onSort('email')}
              className={sortableHeaderButton}
            >
              Email {getSortIcon('email')}
            </button>
          </Table.HeaderCell>
          <Table.HeaderCell className="w-[18%]">
            <button
              onClick={() => onSort('department')}
              className={sortableHeaderButton}
            >
              Department {getSortIcon('department')}
            </button>
          </Table.HeaderCell>
          <Table.HeaderCell className="w-[12%]">
            <button
              onClick={() => onSort('matchStatus')}
              className={sortableHeaderButton}
            >
              Status {getSortIcon('matchStatus')}
            </button>
          </Table.HeaderCell>
          <Table.HeaderCell className="w-[13%]">
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
            <Table.Cell className="w-[20%]">{student.fullName}</Table.Cell>
            <Table.Cell className="w-[12%]">{student.studentId}</Table.Cell>
            <Table.Cell className="w-[25%]">
              <a href={`mailto:${student.email}`} className={linkEmail}>
                {student.email}
              </a>
            </Table.Cell>
            <Table.Cell className="w-[18%]">{student.department}</Table.Cell>
            <Table.Cell className="w-[12%]">
              <StatusBadge status={student.matchStatus} variant="matchStatus" />
            </Table.Cell>
            <Table.Cell className="w-[13%]">{formatFirestoreDate(student.registrationDate)}</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Container>
  );
}

