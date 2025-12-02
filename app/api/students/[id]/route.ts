/**
 * GET /api/students/[id] - Get student by ID
 * PUT /api/students/[id] - Update student
 */

import { NextRequest } from 'next/server';
import { AdminStudentService } from '@/lib/services/admin-services';
import { withAuth } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';
import { validateBody, updateStudentSchema } from '@/lib/middleware/validation';
import { logger } from '@/lib/logger';

export const GET = withAuth(async (request: NextRequest, { params }, user) => {
  // Owner, supervisor, or admin can view
  const isOwner = user.uid === params.id;
  const isSupervisorOrAdmin = ['supervisor', 'admin'].includes(user.role);

  if (!isOwner && !isSupervisorOrAdmin) {
    logger.error('Unauthorized student view attempt', undefined, { 
      context: 'API', 
      data: { studentId: params.id, role: user.role } 
    });
    return ApiResponse.forbidden();
  }

  const student = await AdminStudentService.getStudentById(params.id);
  if (!student) {
    logger.warn('Student not found', { context: 'API', data: { studentId: params.id } });
    return ApiResponse.notFound('Student');
  }

  return ApiResponse.success(student);
});

export const PUT = withAuth(async (request: NextRequest, { params }, user) => {
  const isOwner = user.uid === params.id;
  const isAdmin = user.role === 'admin';

  if (!isOwner && !isAdmin) {
    logger.error('Unauthorized student update attempt', undefined, { 
      context: 'API', 
      data: { studentId: params.id, role: user.role } 
    });
    return ApiResponse.forbidden();
  }

  // Read and validate request body
  const body = await request.json();
  const validation = validateBody(body, updateStudentSchema);
  
  if (!validation.valid || !validation.data) {
    logger.error('Student update validation failed', undefined, { 
      context: 'API', 
      data: { 
        studentId: params.id,
        validationError: validation.error,
        receivedFields: Object.keys(body)
      } 
    });
    return ApiResponse.validationError(validation.error || 'Invalid request data');
  }

  const success = await AdminStudentService.updateStudent(params.id, validation.data);

  if (!success) {
    logger.error('Student database update failed', undefined, { 
      context: 'API', 
      data: { studentId: params.id } 
    });
    return ApiResponse.error('Failed to update student', 500);
  }

  return ApiResponse.successMessage('Student updated successfully');
});


