/**
 * Authorization Helpers
 * 
 * Complex authorization logic extracted for reusability and testing
 */

import { StudentService } from '@/lib/services/firebase-services.server';
import type { Student } from '@/types/database';

/**
 * Check if a user can view a student profile
 * 
 * Authorization Rules:
 * 1. Owner can always view their own profile
 * 2. Supervisors and admins can view any student profile
 * 3. Students can view:
 *    - Their actual partner's profile (if they are paired)
 *    - Any unpaired student's profile (for partnership browsing)
 * 4. Students CANNOT view other paired students (who are not their partner)
 * 
 * @param requestingUserId - The ID of the user making the request
 * @param requestingUserRole - The role of the requesting user
 * @param targetStudentId - The ID of the student profile being viewed
 * @returns Object with allowed flag and optionally the student data
 */
export async function canViewStudentProfile(
  requestingUserId: string,
  requestingUserRole: string,
  targetStudentId: string
): Promise<{ allowed: boolean; student?: Student }> {
  // Rule 1: Owner can always view their own profile
  if (requestingUserId === targetStudentId) {
    const student = await StudentService.getStudentById(targetStudentId);
    if (!student) {
      return { allowed: false }; // Student doesn't exist
    }
    return { allowed: true, student };
  }
  
  // Rule 2: Supervisors and admins can view any student profile
  if (['supervisor', 'admin'].includes(requestingUserRole)) {
    const student = await StudentService.getStudentById(targetStudentId);
    if (!student) {
      return { allowed: false }; // Student doesn't exist
    }
    return { allowed: true, student };
  }
  
  // Rule 3 & 4: Students can view partners or unpaired students only
  if (requestingUserRole === 'student') {
    const [requestingStudent, targetStudent] = await Promise.all([
      StudentService.getStudentById(requestingUserId),
      StudentService.getStudentById(targetStudentId)
    ]);
    
    // Check if student is viewing their actual partner
    const isViewingPartner = requestingStudent?.partnerId === targetStudentId;
    
    // Check if target student is unpaired (available for partnership)
    const targetIsUnpaired = !targetStudent?.partnerId;
    
    // Allow access if viewing partner OR target is unpaired
    // Block access if trying to view a paired student who is not their partner
    const allowed = isViewingPartner || targetIsUnpaired;
    
    return { 
      allowed, 
      student: allowed ? targetStudent || undefined : undefined 
    };
  }
  
  // Default: deny access
  return { allowed: false };
}

