'use client';

import { useRef } from 'react';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import ErrorState from '@/app/components/feedback/ErrorState';
import StudentsTable from './StudentsTable';
import SupervisorsTable from './SupervisorsTable';
import ApplicationsTable from './ApplicationsTable';
import { type StatCardType } from '@/lib/hooks';
import { type SortConfig } from '../_utils/dataProcessing';
import type { Student, Application, Supervisor } from '@/types/database';
import { cardBase, linkAction, textMuted, headingXl, inputStyles } from '@/lib/styles/shared-styles';

interface StatCardTableProps {
  activeStatCard: StatCardType;
  onClose: () => void;
  studentsData: Student[];
  supervisorsData: Supervisor[];
  applicationsData: Application[];
  studentsLoading: boolean;
  applicationsLoading: boolean;
  studentsError: string | null;
  applicationsError: string | null;
  filterText: string;
  onFilterChange: (text: string) => void;
  sortConfig: SortConfig;
  onSort: (column: string) => void;
  studentsCache: Student[] | null;
  onRetry: () => void;
  tableRef: React.RefObject<HTMLDivElement>;
}

export default function StatCardTable({
  activeStatCard,
  onClose,
  studentsData,
  supervisorsData,
  applicationsData,
  studentsLoading,
  applicationsLoading,
  studentsError,
  applicationsError,
  filterText,
  onFilterChange,
  sortConfig,
  onSort,
  studentsCache,
  onRetry,
  tableRef,
}: StatCardTableProps) {
  if (!activeStatCard) return null;

  const getTitle = () => {
    switch (activeStatCard) {
      case 'total-students': return 'All Students';
      case 'students-without-projects': return 'Students Without Projects';
      case 'total-supervisors': return 'All Supervisors';
      case 'available-capacity': return 'Supervisors with Available Capacity';
      case 'approved-projects': return 'Approved Projects';
      case 'pending-applications': return 'Pending Applications';
      case 'supervisor-partnerships': return 'Supervisor Partnerships';
      default: return '';
    }
  };

  const getResultCount = () => {
    const total = activeStatCard === 'total-students' || activeStatCard === 'students-without-projects' 
      ? studentsData.length 
      : activeStatCard === 'total-supervisors' || activeStatCard === 'available-capacity' || activeStatCard === 'supervisor-partnerships'
      ? supervisorsData.length
      : applicationsData.length;
    return total;
  };

  return (
    <div ref={tableRef} className="mb-8 transition-all duration-300">
      <div className={cardBase}>
        {/* Table Header with Filter */}
        <div className="flex items-center justify-between mb-4">
          <h2 className={`${headingXl} font-semibold`}>
            {getTitle()}
          </h2>
          <button
            onClick={onClose}
            className={linkAction}
          >
            Close
          </button>
        </div>

        {/* Filter Input */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search..."
            value={filterText}
            onChange={(e) => onFilterChange(e.target.value)}
            className={inputStyles}
          />
          <p className={`text-sm mt-2 ${textMuted}`}>
            Showing {getResultCount()} result{getResultCount() !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Loading State */}
        {(studentsLoading || applicationsLoading) && (
          <div className="text-center py-8">
            <LoadingSpinner message="Loading data..." />
          </div>
        )}

        {/* Error State */}
        {(studentsError || applicationsError) && (
          <div className="text-center py-8">
            <ErrorState
              message={studentsError || applicationsError || 'Failed to load data'}
              action={{
                label: 'Retry',
                onClick: onRetry
              }}
            />
          </div>
        )}

        {/* Students Tables */}
        {!studentsLoading && !studentsError && (activeStatCard === 'total-students' || activeStatCard === 'students-without-projects') && (
          <StudentsTable
            data={studentsData}
            sortConfig={sortConfig}
            onSort={onSort}
            isLoading={studentsLoading}
          />
        )}

        {/* Supervisors Tables */}
        {!studentsLoading && !studentsError && (activeStatCard === 'total-supervisors' || activeStatCard === 'available-capacity' || activeStatCard === 'supervisor-partnerships') && (
          <SupervisorsTable
            data={supervisorsData}
            sortConfig={sortConfig}
            onSort={onSort}
            showAvailableSlots={activeStatCard === 'available-capacity'}
            isLoading={false}
          />
        )}

        {/* Applications Tables */}
        {!applicationsLoading && !applicationsError && (activeStatCard === 'approved-projects' || activeStatCard === 'pending-applications') && (
          <ApplicationsTable
            data={applicationsData}
            sortConfig={sortConfig}
            onSort={onSort}
            studentsCache={studentsCache}
            tableType={activeStatCard === 'approved-projects' ? 'approved-projects' : 'pending-applications'}
            isLoading={applicationsLoading}
          />
        )}
      </div>
    </div>
  );
}

