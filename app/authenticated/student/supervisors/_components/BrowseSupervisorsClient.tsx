'use client';

import { useState } from 'react';
import { useStudentDashboard, useApplicationActions, useModalScroll } from '@/lib/hooks';
import { useBrowseEntities, type ApiResponse } from '@/lib/hooks/useBrowseEntities';
import { apiClient } from '@/lib/api/client';
import { ROUTES } from '@/lib/routes';
import SupervisorCard from '@/app/components/shared/SupervisorCard';
import ApplicationModal from '../../_components/ApplicationModal';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import StatusMessage from '@/app/components/feedback/StatusMessage';
import PageLayout from '@/app/components/layout/PageLayout';
import PageHeader from '@/app/components/layout/PageHeader';
import EmptyState from '@/app/components/feedback/EmptyState';
import SupervisorFilters, { FilterValues } from './SupervisorFilters';
import type { SupervisorCardData, ApplicationSubmitData } from '@/types/database';
import { textTertiary, textMuted } from '@/lib/styles/shared-styles';

export default function BrowseSupervisorsClient() {
  // UI states
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [selectedSupervisor, setSelectedSupervisor] = useState<SupervisorCardData | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch function for supervisors
  const fetchSupervisors = async (filters: FilterValues, token: string): Promise<ApiResponse<SupervisorCardData>> => {
    const response = await apiClient.getSupervisors(token, {
      search: filters.search || undefined,
      department: filters.department !== 'all' ? filters.department : undefined,
      availability: filters.availability !== 'all' ? filters.availability : undefined,
      expertise: filters.expertise || undefined,
      interests: filters.interests || undefined,
    });
    return response;
  };

  // Convert filters to API params
  const filterToParams = (filters: FilterValues) => ({
    search: filters.search || undefined,
    department: filters.department !== 'all' ? filters.department : undefined,
    availability: filters.availability !== 'all' ? filters.availability : undefined,
    expertise: filters.expertise || undefined,
    interests: filters.interests || undefined,
  });

  // Convert URL params to filters
  const paramsToFilters = (searchParams: URLSearchParams): FilterValues => ({
    search: searchParams.get('search') || '',
    department: searchParams.get('department') || 'all',
    availability: searchParams.get('availability') || 'all',
    expertise: searchParams.get('expertise') || '',
    interests: searchParams.get('interests') || '',
  });

  // Use browse entities hook
  const {
    entities: supervisors,
    displayedEntities: displayedSupervisors,
    loading,
    loadingMore,
    error,
    hasMore,
    filters,
    handleFilterChange,
    setLoadMoreRef,
    isAuthLoading,
    userId,
  } = useBrowseEntities<FilterValues, SupervisorCardData>({
    fetchFn: fetchSupervisors,
    initialFilters: {
      search: '',
      department: 'all',
      availability: 'all',
      expertise: '',
      interests: '',
    },
    route: ROUTES.AUTHENTICATED.STUDENT_SUPERVISORS,
    expectedRole: 'student',
    filterToParams,
    paramsToFilters,
  });

  // Get student profile for ApplicationModal
  const { data: dashboardData } = useStudentDashboard(userId);
  const userProfile = dashboardData?.profile || null;

  // Application actions
  const applicationActions = useApplicationActions({
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

  // Handle apply button click
  const handleApply = (supervisorId: string) => {
    const supervisor = supervisors.find(s => s.id === supervisorId);
    if (supervisor) {
      setSelectedSupervisor(supervisor);
      setShowApplicationModal(true);
    }
  };

  // Handle application submission
  const handleSubmitApplication = async (applicationData: ApplicationSubmitData) => {
    if (!selectedSupervisor?.id) {
      return;
    }

    try {
      await applicationActions.submitApplication({
        ...applicationData,
        supervisorId: selectedSupervisor.id,
      });
      setShowApplicationModal(false);
    } catch {
      // Error handled by applicationActions hook
    }
  };

  // Scroll to modal when it opens
  useModalScroll({ isOpen: showApplicationModal });

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
        title="Browse Supervisors"
        description="Find and apply to supervisors for your final project"
      />

      {/* Filters */}
      <SupervisorFilters
        filters={filters as FilterValues}
        onFilterChange={handleFilterChange}
        resultCount={supervisors.length}
      />

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner message="Loading supervisors..." />
        </div>
      ) : displayedSupervisors.length === 0 ? (
        /* Empty State */
        <EmptyState
          message="No supervisors match your criteria"
          action={{
            label: 'Clear Filters',
            onClick: () => handleFilterChange({
              search: '',
              department: 'all',
              availability: 'all',
              expertise: '',
              interests: '',
            })
          }}
        />
      ) : (
        /* Supervisors Grid */
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {displayedSupervisors.map((supervisor) => (
              <SupervisorCard
                key={supervisor.id}
                supervisor={supervisor}
                onApply={handleApply}
                showApplyButton={supervisor.availabilityStatus !== 'unavailable'}
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
          {!hasMore && displayedSupervisors.length > 0 && (
            <div className={`text-center py-8 ${textMuted} text-sm`}>
              Showing all {supervisors.length} supervisor{supervisors.length !== 1 ? 's' : ''}
            </div>
          )}
        </>
      )}

      {/* Application Modal */}
      {showApplicationModal && selectedSupervisor && (
        <ApplicationModal
          isOpen={showApplicationModal}
          onClose={() => setShowApplicationModal(false)}
          supervisor={selectedSupervisor}
          studentProfile={userProfile}
          onSubmit={handleSubmitApplication}
        />
      )}
    </PageLayout>
  );
}

