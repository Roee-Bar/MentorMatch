// lib/hooks/index.ts
// Export all custom hooks

export { useAuth } from './useAuth';
export { useLoadingState } from './useLoadingState';
export { useAuthenticatedFetch } from './useAuthenticatedFetch';
export { useRateLimit } from './useRateLimit';
export { useEmailVerification } from './useEmailVerification';
export { useEmailVerificationResend } from './useEmailVerificationResend';

// Student dashboard hooks
export { useStudentDashboard } from './useStudentDashboard';
export { useStudentPartnerships } from './useStudentPartnerships';

// Action hooks
export { usePartnershipActions } from './usePartnershipActions';
export { useApplicationActions } from './useApplicationActions';
export { useSupervisorApplicationActions } from './useSupervisorApplicationActions';
export { useApplicationStatusModal } from './useApplicationStatusModal';

// Supervisor dashboard hooks
export { useSupervisorDashboard } from './useSupervisorDashboard';
export { useSupervisorApplications } from './useSupervisorApplications';
export { useSupervisorPartnerships } from './useSupervisorPartnerships';
export { useSupervisorPartnershipActions } from './useSupervisorPartnershipActions';

// Admin dashboard hooks
export { useAdminDashboard } from './useAdminDashboard';
export { useStatCardTables, type StatCardType } from './useStatCardTables';
export { useCapacityUpdate } from './useCapacityUpdate';
export { useModalScroll } from './useModalScroll';

// Filter hooks
export { useDebouncedValue } from './useDebouncedValue';
export { useFilterState } from './useFilterState';
export { useStudentPartnershipFilters, type StudentPartnershipFilters } from './useStudentPartnershipFilters';