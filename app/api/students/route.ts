/**
 * GET /api/students - Get all students (supervisor/admin only)
 */

import { NextRequest } from 'next/server';
import { studentService } from '@/lib/services/students/student-service';
import { withAuth } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';

export const GET = withAuth<Record<string, string>>(
  async (request: NextRequest, context, user) => {
    const students = await studentService.getAllStudents();
    return ApiResponse.successWithCount(students);
  },
  { allowedRoles: ['supervisor', 'admin'] }
);

