/**
 * GET /api/students/available-partners - Get students available for partnership
 * Returns students who don't have a partner, excluding the current user
 * If the requesting student already has a partner, returns empty array
 */

import { NextRequest } from 'next/server';
import { StudentService } from '@/lib/services/students/student-service';
import { withRoles } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';

export const GET = withRoles<Record<string, string>>(['student'], async (request: NextRequest, context, user) => {
  // Check if student already has a partner - if so, return empty array immediately
  const currentStudent = await StudentService.getStudentById(user.uid);
  if (currentStudent?.partnerId) {
    return ApiResponse.successWithCount([]);
  }
  
  // Get available partners excluding the current student
  const students = await StudentService.getAvailablePartners(user.uid);
  return ApiResponse.successWithCount(students);
});

