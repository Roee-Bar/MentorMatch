/**
 * Application Validation Helpers
 * SERVER-ONLY: This file must ONLY be imported in API routes (server-side)
 * 
 * Helper functions for validating application data, especially partner relationships
 */

import { logger } from '@/lib/logger';
import { StudentService } from '@/lib/services/students/student-service';
import type { Student } from '@/types/database';

const SERVICE_NAME = 'ApplicationValidation';

/**
 * Validate partner relationship for application creation
 * Checks for missing partners, circular partnerships, and logs warnings
 * 
 * @param studentId - The ID of the student creating the application
 * @param partnerId - The ID of the partner (if any)
 * @returns Validation result with partner data and any warnings
 */
export async function validatePartner(
  studentId: string,
  partnerId: string | undefined
): Promise<{ isValid: boolean; partner?: Student; warnings: string[] }> {
  const warnings: string[] = [];
  
  if (!partnerId) {
    return { isValid: false, warnings: [] };
  }
  
  const partner = await StudentService.getStudentById(partnerId);
  
  if (!partner) {
    const warning = `Partner ${partnerId} not found - proceeding without partner`;
    warnings.push(warning);
    logger.service.warn(SERVICE_NAME, 'validatePartner', warning, { studentId, partnerId });
    return { isValid: false, warnings };
  }
  
  // Check for circular partnership
  if (partner.partnerId === studentId) {
    const warning = `Circular partnership detected between ${studentId} and ${partnerId} - proceeding without partner`;
    warnings.push(warning);
    logger.service.warn(SERVICE_NAME, 'validatePartner', warning, { studentId, partnerId });
    return { isValid: false, warnings };
  }
  
  return { isValid: true, partner, warnings };
}

