/**
 * GET /api/students/[id] - Get student by ID
 * PUT /api/students/[id] - Update student
 */

import { NextRequest } from 'next/server';
import { studentService } from '@/lib/services/students/student-service';
import { withAuth } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';
import { updateStudentSchema } from '@/lib/middleware/validation';
import { withValidatedRequestAndUser } from '@/lib/middleware/route-handlers';
import { logger } from '@/lib/logger';
import { canViewStudentProfile } from '@/lib/middleware/authorization';
import type { StudentIdParams } from '@/types/api';

export const GET = withAuth<StudentIdParams>(async (request: NextRequest, { params }, user) => {
  const { allowed, student } = await canViewStudentProfile(
    user.uid,
    user.role,
    params.id
  );

  if (!allowed) {
    logger.error('Unauthorized student view attempt', undefined, {
      context: 'API',
      data: {
        studentId: params.id,
        requesterId: user.uid,
        role: user.role
      }
    });
    return ApiResponse.forbidden();
  }

  if (!student) {
    logger.warn('Student not found', { context: 'API', data: { studentId: params.id } });
    return ApiResponse.notFound('Student');
  }

  return ApiResponse.success(student);
});

export const PUT = withAuth<StudentIdParams>(
  async (request: NextRequest, { params }, user) => {
    return withValidatedRequestAndUser(
      request,
      user,
      updateStudentSchema,
      (data, user) => studentService.updateStudent(params.id, data),
      'Failed to update student',
      () => ApiResponse.successMessage('Student updated successfully')
    );
  },
  { requireOwnerOrAdmin: true, requireVerifiedEmail: true }
);


