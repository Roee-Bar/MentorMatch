'use client';

import { useState, useEffect } from 'react';
import { usePartnershipActions } from '@/lib/hooks';
import { useBrowseEntities, type ApiResponse } from '@/lib/hooks/useBrowseEntities';
import { apiClient } from '@/lib/api/client';
import { ROUTES } from '@/lib/routes';
import StudentCard from '@/app/components/shared/StudentCard';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import StatusMessage from '@/app/components/feedback/StatusMessage';
import PageLayout from '@/app/components/layout/PageLayout';
import PageHeader from '@/app/components/layout/PageHeader';
import EmptyState from '@/app/components/feedback/EmptyState';
import StudentFilters, { FilterValues } from './StudentFilters';
import type { Student } from '@/types/database';
import { textTertiary, textMuted } from '@/lib/styles/shared-styles';

export default function BrowseStudentsClient() {
  // UI states
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch function for students
  const fetchStudents = async (filters: FilterValues, token: string): Promise<ApiResponse<Student>> => {
    const response = await apiClient.getAvailablePartners(token, {
      search: filters.search || undefined,
      department: filters.department !== 'all' ? filters.department : undefined,
      skills: filters.skills || undefined,
      interests: filters.interests || undefined,
    });
    return response;
  };

  // Convert filters to API params
  const filterToParams = (filters: FilterValues) => ({
    search: filters.search || undefined,
    department: filters.department !== 'all' ? filters.department : undefined,
    skills: filters.skills || undefined,
    interests: filters.interests || undefined,
  });

  // Convert URL params to filters
  const paramsToFilters = (searchParams: URLSearchParams): FilterValues => ({
    search: searchParams.get('search') || '',
    department: searchParams.get('department') || 'all',
    skills: searchParams.get('skills') || '',
    interests: searchParams.get('interests') || '',
  });

  // Use browse entities hook
  const {
    entities: students,
    displayedEntities: displayedStudents,
    loading,
    loadingMore,
    error,
    hasMore,
    filters,
    handleFilterChange,
    setLoadMoreRef,
    isAuthLoading,
    userId,
  } = useBrowseEntities<FilterValues, Student>({
    fetchFn: fetchStudents,
    initialFilters: {
      search: '',
      department: 'all',
      skills: '',
      interests: '',
    },
    route: ROUTES.AUTHENTICATED.STUDENT_STUDENTS,
    expectedRole: 'student',
    filterToParams,
    paramsToFilters,
  });

  // Partnership actions
  const partnershipActions = usePartnershipActions({
    userId,
    onRefresh: () => {
      // Trigger refetch by updating filters (hook will handle the fetch)
      handleFilterChange(filters);
    },
    onSuccess: (msg) => { 
      setSuccessMessage(msg); 
      setTimeout(() => setSuccessMessage(null), 5000); 
    },
    onError: (msg) => { 
      // Error is handled by the hook
      setTimeout(() => {}, 5000); 
    }
  });

  if (isAuthLoading) {
    return <LoadingSpinner message="Loading..." />;
  }

  return (
    <PageLayout>
      {/* Error Banner */}
      {error && (
        <StatusMessage 
          message={error} 
          type="error"
        />
      )}

      {/* Success Message */}
      {successMessage && (
        <StatusMessage 
          message={successMessage} 
          type="success"
        />
      )}

      {/* Header */}
      <PageHeader
        title="Browse Students"
        description="Find potential partners for your final project"
      />

      {/* Filters */}
      <StudentFilters
        filters={filters as FilterValues}
        onFilterChange={handleFilterChange}
        resultCount={students.length}
      />

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner message="Loading students..." />
        </div>
      ) : displayedStudents.length === 0 ? (
        /* Empty State */
        <EmptyState
          message="No students match your criteria"
          action={{
            label: 'Clear Filters',
            onClick: () => handleFilterChange({
              search: '',
              department: 'all',
              skills: '',
              interests: '',
            })
          }}
        />
      ) : (
        /* Students Grid */
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {displayedStudents.map((student) => (
              <StudentCard
                key={student.id}
                student={student}
                onRequestPartnership={partnershipActions.requestPartnership}
                showRequestButton={true}
                isLoading={partnershipActions.isLoading(`partnership-${student.id}`)}
              />
            ))}
          </div>

          {/* Load More Trigger */}
          {hasMore && (
            <div 
              ref={setLoadMoreRef} 
              className="flex justify-center py-8"
            >
              {loadingMore ? (
                <LoadingSpinner message="Loading more..." />
              ) : (
                <span className={`${textTertiary} text-sm`}>Scroll for more</span>
              )}
            </div>
          )}

          {/* End of List */}
          {!hasMore && displayedStudents.length > 0 && (
            <div className={`text-center py-8 ${textMuted} text-sm`}>
              Showing all {students.length} student{students.length !== 1 ? 's' : ''}
            </div>
          )}
        </>
      )}
    </PageLayout>
  );
}

