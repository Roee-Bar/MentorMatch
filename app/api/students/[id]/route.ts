/**
 * GET /api/students/[id] - Get student by ID
 * PUT /api/students/[id] - Update student
 */

import { NextRequest } from 'next/server';
import { AdminStudentService } from '@/lib/services/admin-services';
import { withAuth } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';
import { validateRequest, updateStudentSchema } from '@/lib/middleware/validation';

export const GET = withAuth(async (request: NextRequest, { params }, user) => {
  // Owner, supervisor, or admin can view
  const isOwner = user.uid === params.id;
  const isSupervisorOrAdmin = ['supervisor', 'admin'].includes(user.role);

  if (!isOwner && !isSupervisorOrAdmin) {
    return ApiResponse.forbidden();
  }

  const student = await AdminStudentService.getStudentById(params.id);
  if (!student) {
    return ApiResponse.notFound('Student');
  }

  return ApiResponse.success(student);
});

export const PUT = withAuth(async (request: NextRequest, { params }, user) => {
  const isOwner = user.uid === params.id;
  const isAdmin = user.role === 'admin';

  if (!isOwner && !isAdmin) {
    return ApiResponse.forbidden();
  }

  // Validate request body
  const validation = await validateRequest(request, updateStudentSchema);
  if (!validation.valid || !validation.data) {
    return ApiResponse.validationError(validation.error || 'Invalid request data');
  }

  const success = await AdminStudentService.updateStudent(params.id, validation.data);

  if (!success) {
    return ApiResponse.error('Failed to update student', 500);
  }

  return ApiResponse.successMessage('Student updated successfully');
});


