// lib/services/firebase-services.server.ts
// SERVER-ONLY: This file must ONLY be imported in API routes (server-side)
// DO NOT import this file in any client-side components or pages

/**
 * @deprecated This barrel export file is deprecated.
 * Import services directly from their domain folders:
 * - @/lib/services/users/user-service
 * - @/lib/services/students/student-service
 * - @/lib/services/supervisors/supervisor-service
 * - @/lib/services/applications/application-service
 * - @/lib/services/projects/project-service
 * - @/lib/services/partnerships/partnership-service
 * - @/lib/services/admin/admin-service
 * 
 * This file will be removed in the next phase.
 */

import { adminDb } from '@/lib/firebase-admin';
import type {
  BaseUser,
  Student,
  Supervisor,
  Admin,
  Application,
  Project,
  SupervisorCardData,
  ApplicationCardData,
  DashboardStats,
  StudentPartnershipRequest,
  StudentCardData,
} from '@/types/database';

// Re-export all services from their domain folders
export { UserService } from './users/user-service';
export { StudentService } from './students/student-service';
export { SupervisorService } from './supervisors/supervisor-service';
export { ApplicationService } from './applications/application-service';
export { ProjectService } from './projects/project-service';
export { StudentPartnershipService } from './partnerships/partnership-service';
export { AdminService } from './admin/admin-service';

// Keep application-workflow export
export { ApplicationWorkflowService } from './applications/application-workflow';

// Export adminDb for backward compatibility
export { adminDb };

// Export types for convenience
export type {
  BaseUser,
  Student,
  Supervisor,
  Admin,
  Application,
  Project,
  SupervisorCardData,
  ApplicationCardData,
  DashboardStats,
  StudentPartnershipRequest,
  StudentCardData,
};
