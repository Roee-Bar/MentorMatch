'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, useStudentDashboard, useApplicationActions, useModalScroll } from '@/lib/hooks';
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

const BATCH_SIZE = 9; // 3 rows of 3 cards

export default function BrowseSupervisorsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Authentication
  const { userId, isAuthLoading, getToken } = useAuth({ expectedRole: 'student' });
  
  // Get student profile for ApplicationModal
  const { data: dashboardData } = useStudentDashboard(userId);
  const userProfile = dashboardData?.profile || null;
  
  // Supervisors state
  const [supervisors, setSupervisors] = useState<SupervisorCardData[]>([]);
  const [displayedSupervisors, setDisplayedSupervisors] = useState<SupervisorCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  
  // UI states
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [selectedSupervisor, setSelectedSupervisor] = useState<SupervisorCardData | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Infinite scroll refs
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreCallbackRef = useRef<() => void>(() => {});
  
  // Ref for URL update skip on initial mount
  const isInitialUrlUpdate = useRef(true);
  
  // Initialize filters from URL
  const [filters, setFilters] = useState<FilterValues>({
    search: searchParams.get('search') || '',
    department: searchParams.get('department') || 'all',
    availability: searchParams.get('availability') || 'all',
    expertise: searchParams.get('expertise') || '',
    interests: searchParams.get('interests') || '',
  });

  // Application actions
  const applicationActions = useApplicationActions({
    userId,
    onRefresh: () => fetchSupervisors(),
    onSuccess: (msg) => { 
      setSuccessMessage(msg); 
      setTimeout(() => setSuccessMessage(null), 5000); 
    },
    onError: (msg) => { 
      setError(msg); 
      setTimeout(() => setError(null), 5000); 
    }
  });

  // Fetch supervisors with filters
  const fetchSupervisors = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = await getToken();

      const response = await apiClient.getSupervisors(token, {
        search: filters.search || undefined,
        department: filters.department !== 'all' ? filters.department : undefined,
        availability: filters.availability !== 'all' ? filters.availability : undefined,
        expertise: filters.expertise || undefined,
        interests: filters.interests || undefined,
      });

      const data = response.data || [];
      setSupervisors(data);
      setDisplayedSupervisors(data.slice(0, BATCH_SIZE));
      setHasMore(data.length > BATCH_SIZE);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load supervisors';
      if (errorMessage === 'Not authenticated') {
        router.push(ROUTES.LOGIN);
        return;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filters, router, getToken]);

  // Single effect for fetching - triggers on auth ready and filter changes
  useEffect(() => {
    if (!isAuthLoading && userId) {
      fetchSupervisors();
    }
  }, [isAuthLoading, userId, filters, fetchSupervisors]);

  // Update URL when filters change - skip initial mount
  useEffect(() => {
    if (isInitialUrlUpdate.current) {
      isInitialUrlUpdate.current = false;
      return;
    }

    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.department !== 'all') params.set('department', filters.department);
    if (filters.availability !== 'all') params.set('availability', filters.availability);
    if (filters.expertise) params.set('expertise', filters.expertise);
    if (filters.interests) params.set('interests', filters.interests);
    
    const queryString = params.toString();
    const newUrl = queryString 
      ? `${ROUTES.AUTHENTICATED.STUDENT_SUPERVISORS}?${queryString}`
      : ROUTES.AUTHENTICATED.STUDENT_SUPERVISORS;
    
    router.replace(newUrl, { scroll: false });
  }, [filters, router]);

  // Infinite scroll: Load more supervisors
  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    const currentLength = displayedSupervisors.length;
    const nextBatch = supervisors.slice(currentLength, currentLength + BATCH_SIZE);
    
    setTimeout(() => {
      setDisplayedSupervisors(prev => [...prev, ...nextBatch]);
      setHasMore(currentLength + nextBatch.length < supervisors.length);
      setLoadingMore(false);
    }, 300); // Small delay for smooth UX
  }, [displayedSupervisors.length, supervisors, loadingMore, hasMore]);

  // Keep loadMoreCallbackRef in sync with latest loadMore
  loadMoreCallbackRef.current = loadMore;

  // Callback ref for IntersectionObserver - handles setup/cleanup properly
  const setLoadMoreRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    if (node) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            loadMoreCallbackRef.current();
          }
        },
        { threshold: 0.1 }
      );
      observerRef.current.observe(node);
    }
  }, []);

  // Handle filter change
  const handleFilterChange = (newFilters: FilterValues) => {
    setFilters(newFilters);
  };

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
    try {
      await applicationActions.submitApplication({
        ...applicationData,
        supervisorId: selectedSupervisor?.id,
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
          className="mb-6"
        />
      )}

      {/* Success Message */}
      {successMessage && (
        <StatusMessage 
          message={successMessage} 
          type="success"
          className="mb-6"
        />
      )}

      {/* Header */}
      <PageHeader
        title="Browse Supervisors"
        description="Find and apply to supervisors for your final project"
      />

      {/* Filters */}
      <SupervisorFilters
        filters={filters}
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
            onClick: () => setFilters({
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

