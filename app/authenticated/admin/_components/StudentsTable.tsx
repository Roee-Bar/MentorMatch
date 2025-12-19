'use client';

import Table from '@/app/components/shared/Table';
import StatusBadge from '@/app/components/shared/StatusBadge';
import EmptyState from '@/app/components/feedback/EmptyState';
import { SortIndicator, formatDate, type SortConfig } from '../_utils/dataProcessing';
import type { Student } from '@/types/database';
import { textPrimary, textSecondary } from '@/lib/styles/shared-styles';

interface StudentsTableProps {
  data: Student[];
  sortConfig: SortConfig;
  onSort: (column: string) => void;
  isLoading?: boolean;
}

export default function StudentsTable({ data, sortConfig, onSort, isLoading }: StudentsTableProps) {
  if (isLoading) {
    return null; // Loading state handled by parent
  }

  if (data.length === 0) {
    return <EmptyState message="No students found matching your criteria." />;
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
            <button onClick={() => onSort('studentId')} className="flex items-center">
              Student ID <SortIndicator column="studentId" sortConfig={sortConfig} />
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
          <Table.HeaderCell>
            <button onClick={() => onSort('matchStatus')} className="flex items-center">
              Match Status <SortIndicator column="matchStatus" sortConfig={sortConfig} />
            </button>
          </Table.HeaderCell>
          <Table.HeaderCell>
            <button onClick={() => onSort('registrationDate')} className="flex items-center">
              Registration Date <SortIndicator column="registrationDate" sortConfig={sortConfig} />
            </button>
          </Table.HeaderCell>
        </tr>
      </Table.Header>
      <Table.Body>
        {data.map((student: Student) => (
          <Table.Row key={student.id}>
            <Table.Cell>
              <div className={`text-sm font-medium ${textPrimary}`}>
                {student.fullName}
              </div>
            </Table.Cell>
            <Table.Cell>
              <span className={`text-sm ${textSecondary}`}>{student.studentId}</span>
            </Table.Cell>
            <Table.Cell>
              <span className={`text-sm ${textSecondary}`}>{student.email}</span>
            </Table.Cell>
            <Table.Cell>
              <span className={`text-sm ${textSecondary}`}>{student.department}</span>
            </Table.Cell>
            <Table.Cell>
              <StatusBadge status={student.matchStatus} variant="matchStatus" />
            </Table.Cell>
            <Table.Cell>
              <span className={`text-sm ${textSecondary}`}>
                {formatDate(student.registrationDate)}
              </span>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Container>
  );
}

