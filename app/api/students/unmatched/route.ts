/**
 * GET /api/students/unmatched - Get unmatched students
 * 
 * Authorization: Admin only
 */

import { NextRequest } from 'next/server';
import { StudentService } from '@/lib/services/firebase-services.server';
import { withRoles } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';

export const GET = withRoles(
  ['admin'],
  async (request: NextRequest) => {
    const students = await StudentService.getUnmatchedStudents();
    return ApiResponse.successWithCount(students);
  }
);

