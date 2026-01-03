/**
 * GET /api/students/unmatched - Get unmatched students (admin only)
 */

import { NextRequest } from 'next/server';
import { studentService } from '@/lib/services/students/student-service';
import { withRoles } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';

export const GET = withRoles<Record<string, string>>(['admin'], async (request: NextRequest, context, user) => {
  const students = await studentService.getUnmatchedStudents();
  return ApiResponse.successWithCount(students);
});

