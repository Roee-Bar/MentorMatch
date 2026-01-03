/**
 * Application Authorization Helpers
 * SERVER-ONLY: This file must ONLY be imported in API routes (server-side)
 * 
 * Helper functions for checking application access permissions
 */

import type { Application, UserRole } from '@/types/database';

/**
 * Check if a user can access an application (view)
 * Allows: studentId, partnerId, supervisorId, or admin
 */
export function canAccessApplication(userId: string, application: Application | null | undefined, userRole?: UserRole): boolean {
  if (!application) return false;
  
  // Admin can always access
  if (userRole === 'admin') return true;
  
  // Student (primary applicant) can access
  if (userId === application.studentId) return true;
  
  // Partner can access
  if (application.partnerId && userId === application.partnerId) return true;
  
  // Supervisor can access
  if (userId === application.supervisorId) return true;
  
  return false;
}

/**
 * Check if a user can modify an application (edit, delete, resubmit)
 * Allows: studentId, partnerId, or admin
 */
export function canModifyApplication(userId: string, application: Application | null | undefined, userRole?: UserRole): boolean {
  if (!application) return false;
  
  // Admin can always modify
  if (userRole === 'admin') return true;
  
  // Student (primary applicant) can modify
  if (userId === application.studentId) return true;
  
  // Partner can modify
  if (application.partnerId && userId === application.partnerId) return true;
  
  return false;
}

