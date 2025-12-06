/**
 * GET /api/students/unmatched - Get unmatched students (admin only)
 */

import { NextRequest } from 'next/server';
import { StudentService } from '@/lib/services/students/student-service';
import { withRoles } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';

export const GET = withRoles<Record<string, string>>(['admin'], async (request: NextRequest, context, user) => {
  const students = await StudentService.getUnmatchedStudents();
  return ApiResponse.successWithCount(students);
});

