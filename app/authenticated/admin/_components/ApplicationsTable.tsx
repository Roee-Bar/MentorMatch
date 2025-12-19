'use client';

import Table from '@/app/components/shared/Table';
import StatusBadge from '@/app/components/shared/StatusBadge';
import EmptyState from '@/app/components/feedback/EmptyState';
import { SortIndicator, formatDate, calculateDaysPending, type SortConfig } from '../_utils/dataProcessing';
import type { Application, Student } from '@/types/database';
import { textPrimary, textSecondary } from '@/lib/styles/shared-styles';

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
  isLoading 
}: ApplicationsTableProps) {
  if (isLoading) {
    return null; // Loading state handled by parent
  }

  if (data.length === 0) {
    return <EmptyState message="No applications found matching your criteria." />;
  }

  return (
    <Table.Container>
      <Table.Header>
        <tr>
          <Table.HeaderCell>
            <button onClick={() => onSort('projectTitle')} className="flex items-center">
              Project Title <SortIndicator column="projectTitle" sortConfig={sortConfig} />
            </button>
          </Table.HeaderCell>
          <Table.HeaderCell>
            <button onClick={() => onSort('studentName')} className="flex items-center">
              Student Name <SortIndicator column="studentName" sortConfig={sortConfig} />
            </button>
          </Table.HeaderCell>
          <Table.HeaderCell>
            <button onClick={() => onSort('supervisorName')} className="flex items-center">
              Supervisor Name <SortIndicator column="supervisorName" sortConfig={sortConfig} />
            </button>
          </Table.HeaderCell>
          <Table.HeaderCell>Department</Table.HeaderCell>
          <Table.HeaderCell>
            <button onClick={() => onSort('status')} className="flex items-center">
              Status <SortIndicator column="status" sortConfig={sortConfig} />
            </button>
          </Table.HeaderCell>
          <Table.HeaderCell>
            <button onClick={() => onSort('dateApplied')} className="flex items-center">
              Date Applied <SortIndicator column="dateApplied" sortConfig={sortConfig} />
            </button>
          </Table.HeaderCell>
          {tableType === 'approved-projects' ? (
            <Table.HeaderCell>
              <button onClick={() => onSort('responseDate')} className="flex items-center">
                Response Date <SortIndicator column="responseDate" sortConfig={sortConfig} />
              </button>
            </Table.HeaderCell>
          ) : (
            <Table.HeaderCell>
              <button onClick={() => onSort('daysPending')} className="flex items-center">
                Days Pending <SortIndicator column="daysPending" sortConfig={sortConfig} />
              </button>
            </Table.HeaderCell>
          )}
        </tr>
      </Table.Header>
      <Table.Body>
        {data.map((application: Application) => (
          <Table.Row key={application.id}>
            <Table.Cell>
              <div className={`text-sm font-medium ${textPrimary}`}>
                {application.projectTitle}
              </div>
            </Table.Cell>
            <Table.Cell>
              <span className={`text-sm ${textSecondary}`}>{application.studentName}</span>
            </Table.Cell>
            <Table.Cell>
              <span className={`text-sm ${textSecondary}`}>{application.supervisorName}</span>
            </Table.Cell>
            <Table.Cell>
              <span className={`text-sm ${textSecondary}`}>
                {(() => {
                  // Try to get department from student cache
                  if (studentsCache) {
                    const student = studentsCache.find(s => s.id === application.studentId);
                    return student?.department || 'N/A';
                  }
                  return 'N/A';
                })()}
              </span>
            </Table.Cell>
            <Table.Cell>
              <StatusBadge status={application.status} variant="application" />
            </Table.Cell>
            <Table.Cell>
              <span className={`text-sm ${textSecondary}`}>
                {formatDate(application.dateApplied)}
              </span>
            </Table.Cell>
            {tableType === 'approved-projects' ? (
              <Table.Cell>
                <span className={`text-sm ${textSecondary}`}>
                  {formatDate(application.responseDate)}
                </span>
              </Table.Cell>
            ) : (
              <Table.Cell>
                <span className={`text-sm ${textSecondary}`}>
                  {calculateDaysPending(application.dateApplied)} days
                </span>
              </Table.Cell>
            )}
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Container>
  );
}

