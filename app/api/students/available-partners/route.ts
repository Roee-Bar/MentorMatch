/**
 * GET /api/students/available-partners - Get students available for partnership
 * Returns students who don't have a partner, excluding the current user
 */

import { NextRequest } from 'next/server';
import { StudentService } from '@/lib/services/students/student-service';
import { withRoles } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';

export const GET = withRoles<Record<string, string>>(['student'], async (request: NextRequest, context, user) => {
  // Get available partners excluding the current student
  const students = await StudentService.getAvailablePartners(user.userId);
  return ApiResponse.successWithCount(students);
});

