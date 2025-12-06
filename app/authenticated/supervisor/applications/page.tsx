'use client';

// app/authenticated/supervisor/applications/page.tsx
// Supervisor Applications View - Read-only view with filtering and sorting

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSupervisorAuth } from '@/lib/hooks';
import { useSupervisorDashboard } from '@/lib/hooks/useSupervisorDashboard';
import { ROUTES } from '@/lib/routes';
import ApplicationCard from '@/app/components/shared/ApplicationCard';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import PageLayout from '@/app/components/layout/PageLayout';
import PageHeader from '@/app/components/layout/PageHeader';
import ErrorState from '@/app/components/feedback/ErrorState';
import EmptyState from '@/app/components/feedback/EmptyState';
import FilterButtons from '@/app/components/display/FilterButtons';
import FormSelect from '@/app/components/form/FormSelect';
import { Application, ApplicationStatus } from '@/types/database';
import { formatFirestoreDate } from '@/lib/utils/date';
import { Timestamp } from 'firebase/firestore';

type FilterStatus = 'all' | ApplicationStatus;
type SortOrder = 'asc' | 'desc';

export default function SupervisorApplicationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userId, isAuthLoading } = useSupervisorAuth();
  
  // Fetch applications AND supervisor data using dashboard hook
  const { data, loading: dataLoading, error: fetchError } = useSupervisorDashboard(userId);
  
  const applications = data?.applications || [];
  const supervisor = data?.supervisor;
  const researchInterests = supervisor?.researchInterests || [];
  
  // Initialize state from URL parameters
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const error = !!fetchError;

  // Read URL parameters on mount ONLY
  useEffect(() => {
    const status = searchParams.get('status') as FilterStatus;
    const category = searchParams.get('category');
    const sort = searchParams.get('sort') as SortOrder;

    if (status && ['all', 'pending', 'approved', 'rejected', 'revision_requested'].includes(status)) {
      setFilterStatus(status);
    }
    if (category) {
      setFilterCategory(decodeURIComponent(category));
    }
    if (sort && ['asc', 'desc'].includes(sort)) {
      setSortOrder(sort);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (filterStatus !== 'all') params.set('status', filterStatus);
    if (filterCategory !== 'all') params.set('category', filterCategory);
    if (sortOrder !== 'asc') params.set('sort', sortOrder);
    
    const queryString = params.toString();
    const newUrl = queryString 
      ? `${ROUTES.AUTHENTICATED.SUPERVISOR_APPLICATIONS}?${queryString}`
      : ROUTES.AUTHENTICATED.SUPERVISOR_APPLICATIONS;
    
    router.replace(newUrl, { scroll: false });
  }, [filterStatus, filterCategory, sortOrder, router]);

  // Helper function to extract timestamp from Date or Firestore Timestamp
  const getTimestamp = (date: Date | Timestamp | undefined): number => {
    if (!date) return 0;
    if (date instanceof Date) return date.getTime();
    if (typeof date === 'object' && 'toDate' in date) {
      return date.toDate().getTime();
    }
    return 0;
  };

  // Filter and sort applications
  const filteredAndSortedApplications = useMemo(() => {
    let result = [...applications];
    
    // 1. Filter by status
    if (filterStatus !== 'all') {
      result = result.filter(app => app.status === filterStatus);
    }
    
    // 2. Filter by category (research interest)
    if (filterCategory !== 'all') {
      result = result.filter(app => {
        const studentInterests = app.studentInterests?.toLowerCase() || '';
        return studentInterests.includes(filterCategory.toLowerCase());
      });
    }
    
    // 3. Sort by date
    result.sort((a, b) => {
      const dateA = getTimestamp(a.dateApplied);
      const dateB = getTimestamp(b.dateApplied);
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
    
    return result;
  }, [applications, filterStatus, filterCategory, sortOrder]);

  // Count applications by status
  const statusCounts = useMemo(() => ({
    all: applications.length,
    pending: applications.filter(app => app.status === 'pending').length,
    approved: applications.filter(app => app.status === 'approved').length,
    rejected: applications.filter(app => app.status === 'rejected').length,
    revision_requested: applications.filter(app => app.status === 'revision_requested').length,
  }), [applications]);

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  // Show loading while auth is checking or data is loading
  if (isAuthLoading || dataLoading) {
    return <LoadingSpinner message="Loading applications..." />;
  }

  if (error) {
    return (
      <ErrorState
        message="Unable to load applications. Please try again later."
        action={{
          label: 'Back to Dashboard',
          onClick: () => router.push(ROUTES.AUTHENTICATED.SUPERVISOR)
        }}
      />
    );
  }

  return (
    <PageLayout>
      {/* Header */}
      <PageHeader
        title="Applications"
        description="Review and manage student project applications"
      />

      {/* Filter Buttons - Status */}
      <FilterButtons
        filters={[
          { label: 'All', value: 'all', count: statusCounts.all },
          { label: 'Pending', value: 'pending', count: statusCounts.pending },
          { label: 'Approved', value: 'approved', count: statusCounts.approved },
          { label: 'Rejected', value: 'rejected', count: statusCounts.rejected },
          { label: 'Revision Requested', value: 'revision_requested', count: statusCounts.revision_requested },
        ]}
        activeFilter={filterStatus}
        onChange={(value) => setFilterStatus(value as FilterStatus)}
      />

      {/* Results Count */}
      <div className="text-sm text-gray-600 mb-4">
        Showing {filteredAndSortedApplications.length} of {applications.length} applications
      </div>

      {/* Category Filter and Sort Controls */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        {/* Category Filter Dropdown */}
        <FormSelect
          id="category-filter"
          name="category-filter"
          label="Filter by Interest:"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          options={[
            { value: 'all', label: 'All Research Areas' },
            ...researchInterests.map(interest => ({
              value: interest,
              label: interest
            }))
          ]}
          className="w-64"
        />

        {/* Sort Toggle Button */}
        <button
          onClick={toggleSortOrder}
          className="btn-secondary flex items-center gap-2"
          title={`Currently showing ${sortOrder === 'asc' ? 'oldest' : 'newest'} first`}
        >
          <svg 
            className="w-4 h-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            {sortOrder === 'asc' ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            )}
          </svg>
          <span className="text-sm">
            {sortOrder === 'asc' ? 'Oldest First' : 'Newest First'}
          </span>
        </button>
      </div>

      {/* Applications Grid */}
      {filteredAndSortedApplications.length === 0 ? (
        <EmptyState
          message={
            applications.length === 0 
              ? 'No applications received yet.' 
              : 'No applications match your filters.'
          }
        />
      ) : (
        <div className="grid-cards">
          {filteredAndSortedApplications.map((application) => {
            // Convert Firestore Timestamp to Date, then format as string
            const dateAppliedStr = formatFirestoreDate(application.dateApplied);
            
            return (
              <ApplicationCard 
                key={application.id} 
                application={{
                  id: application.id,
                  projectTitle: application.projectTitle,
                  projectDescription: application.projectDescription,
                  supervisorName: application.supervisorName,
                  dateApplied: dateAppliedStr,
                  status: application.status,
                  responseTime: application.responseTime || '5-7 business days',
                  comments: application.supervisorFeedback,
                  hasPartner: application.hasPartner,
                  partnerName: application.partnerName,
                  linkedApplicationId: application.linkedApplicationId,
                  isLeadApplication: application.isLeadApplication,
                }} 
              />
            );
          })}
        </div>
      )}
    </PageLayout>
  );
}
