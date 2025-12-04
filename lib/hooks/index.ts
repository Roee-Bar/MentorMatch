// lib/hooks/index.ts
// Export all custom hooks

// Auth hooks
export { useSupervisorAuth } from './useSupervisorAuth';
export { useStudentAuth } from './useStudentAuth';
export { useAdminAuth } from './useAdminAuth';

// Data fetching hooks
export { useAuthenticatedFetch } from './useAuthenticatedFetch';
export { useStudentDashboard } from './useStudentDashboard';
export { useStudentPartnerships } from './useStudentPartnerships';

// Action hooks
export { usePartnershipActions } from './usePartnershipActions';
export { useApplicationActions } from './useApplicationActions';

// Utility hooks
export { useLoadingState } from './useLoadingState';

