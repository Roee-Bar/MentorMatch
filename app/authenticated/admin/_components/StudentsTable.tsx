'use client';

import Table from '@/app/components/shared/Table';
import type { Student } from '@/types/database';
import type { SortConfig } from '../_utils/dataProcessing';
import { DateFormatter } from '@/lib/utils/date-formatter';
import StatusBadge from '@/app/components/shared/StatusBadge';
import { STUDENTS_TABLE_WIDTHS } from '../_utils/tableConfig';
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
    <Table.Container data-testid="students-table">
      <Table.Header>
        <tr>
          <Table.HeaderCell className={STUDENTS_TABLE_WIDTHS.name}>
            <button
              onClick={() => onSort('name')}
              className={sortableHeaderButton}
            >
              Name {getSortIcon('name')}
            </button>
          </Table.HeaderCell>
          <Table.HeaderCell className={STUDENTS_TABLE_WIDTHS.studentId}>
            <button
              onClick={() => onSort('studentId')}
              className={sortableHeaderButton}
            >
              Student ID {getSortIcon('studentId')}
            </button>
          </Table.HeaderCell>
          <Table.HeaderCell className={STUDENTS_TABLE_WIDTHS.email}>
            <button
              onClick={() => onSort('email')}
              className={sortableHeaderButton}
            >
              Email {getSortIcon('email')}
            </button>
          </Table.HeaderCell>
          <Table.HeaderCell className={STUDENTS_TABLE_WIDTHS.department}>
            <button
              onClick={() => onSort('department')}
              className={sortableHeaderButton}
            >
              Department {getSortIcon('department')}
            </button>
          </Table.HeaderCell>
          <Table.HeaderCell className={STUDENTS_TABLE_WIDTHS.status}>
            <button
              onClick={() => onSort('matchStatus')}
              className={sortableHeaderButton}
            >
              Status {getSortIcon('matchStatus')}
            </button>
          </Table.HeaderCell>
          <Table.HeaderCell className={STUDENTS_TABLE_WIDTHS.registered}>
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
            <Table.Cell className={STUDENTS_TABLE_WIDTHS.name}>{student.fullName}</Table.Cell>
            <Table.Cell className={STUDENTS_TABLE_WIDTHS.studentId}>{student.studentId}</Table.Cell>
            <Table.Cell className={STUDENTS_TABLE_WIDTHS.email}>
              <a href={`mailto:${student.email}`} className={linkEmail}>
                {student.email}
              </a>
            </Table.Cell>
            <Table.Cell className={STUDENTS_TABLE_WIDTHS.department}>{student.department}</Table.Cell>
            <Table.Cell className={STUDENTS_TABLE_WIDTHS.status}>
              <StatusBadge status={student.matchStatus} variant="matchStatus" />
            </Table.Cell>
            <Table.Cell className={STUDENTS_TABLE_WIDTHS.registered}>{DateFormatter.formatForTable(student.registrationDate)}</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Container>
  );
}

