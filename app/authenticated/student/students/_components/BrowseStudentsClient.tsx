'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, usePartnershipActions } from '@/lib/hooks';
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

const BATCH_SIZE = 9; // 3 rows of 3 cards

export default function BrowseStudentsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Authentication
  const { userId, isAuthLoading, getToken } = useAuth({ expectedRole: 'student' });
  
  // Students state
  const [students, setStudents] = useState<Student[]>([]);
  const [displayedStudents, setDisplayedStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  
  // UI states
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
    skills: searchParams.get('skills') || '',
    interests: searchParams.get('interests') || '',
  });

  // Partnership actions
  const partnershipActions = usePartnershipActions({
    userId,
    onRefresh: () => fetchStudents(),
    onSuccess: (msg) => { 
      setSuccessMessage(msg); 
      setTimeout(() => setSuccessMessage(null), 5000); 
    },
    onError: (msg) => { 
      setError(msg); 
      setTimeout(() => setError(null), 5000); 
    }
  });

  // Fetch students with filters
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = await getToken();

      const response = await apiClient.getAvailablePartners(token, {
        search: filters.search || undefined,
        department: filters.department !== 'all' ? filters.department : undefined,
        skills: filters.skills || undefined,
        interests: filters.interests || undefined,
      });

      const data = response.data || [];
      setStudents(data);
      setDisplayedStudents(data.slice(0, BATCH_SIZE));
      setHasMore(data.length > BATCH_SIZE);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load students';
      if (errorMessage === 'Not authenticated') {
        router.push(ROUTES.LOGIN);
        return;
      }
      console.error('Error fetching students:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filters, router, getToken]);

  // Single effect for fetching - triggers on auth ready and filter changes
  useEffect(() => {
    if (!isAuthLoading && userId) {
      fetchStudents();
    }
  }, [isAuthLoading, userId, filters, fetchStudents]);

  // Update URL when filters change - skip initial mount
  useEffect(() => {
    if (isInitialUrlUpdate.current) {
      isInitialUrlUpdate.current = false;
      return;
    }

    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.department !== 'all') params.set('department', filters.department);
    if (filters.skills) params.set('skills', filters.skills);
    if (filters.interests) params.set('interests', filters.interests);
    
    const queryString = params.toString();
    const newUrl = queryString 
      ? `${ROUTES.AUTHENTICATED.STUDENT_STUDENTS}?${queryString}`
      : ROUTES.AUTHENTICATED.STUDENT_STUDENTS;
    
    router.replace(newUrl, { scroll: false });
  }, [filters, router]);

  // Infinite scroll: Load more students
  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    const currentLength = displayedStudents.length;
    const nextBatch = students.slice(currentLength, currentLength + BATCH_SIZE);
    
    setTimeout(() => {
      setDisplayedStudents(prev => [...prev, ...nextBatch]);
      setHasMore(currentLength + nextBatch.length < students.length);
      setLoadingMore(false);
    }, 300); // Small delay for smooth UX
  }, [displayedStudents.length, students, loadingMore, hasMore]);

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
        filters={filters}
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
            onClick: () => setFilters({
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

