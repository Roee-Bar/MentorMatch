/**
 * GET /api/students - Get all students (supervisor/admin only)
 */

import { NextRequest } from 'next/server';
import { StudentService } from '@/lib/services/firebase-services.server';
import { withAuth } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';

export const GET = withAuth(async (request: NextRequest, context, user) => {
  // Only supervisor or admin can view all students
  if (user.role !== 'supervisor' && user.role !== 'admin') {
    return ApiResponse.forbidden();
  }

  const students = await StudentService.getAllStudents();
  return ApiResponse.successWithCount(students);
});

