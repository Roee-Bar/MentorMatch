// lib/hooks/index.ts
// Export all custom hooks

export { useSupervisorAuth } from './useSupervisorAuth';
export { useStudentAuth } from './useStudentAuth';
export { useAdminAuth } from './useAdminAuth';
export { useLoadingState } from './useLoadingState';
export { useAuthenticatedFetch } from './useAuthenticatedFetch';

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
