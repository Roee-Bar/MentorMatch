/**
 * GET /api/students/[id] - Get student by ID
 * PUT /api/students/[id] - Update student
 * 
 * Authorization Rules:
 * GET - Complex conditional access (see canViewStudentProfile helper)
 * PUT - Owner or Admin only
 */

import { NextRequest } from 'next/server';
import { StudentService } from '@/lib/services/firebase-services.server';
import { withAuth } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';
import { validateBody, updateStudentSchema } from '@/lib/middleware/validation';
import { logger } from '@/lib/logger';
import { canViewStudentProfile } from '@/lib/middleware/authorization';

export const GET = withAuth(async (request: NextRequest, { params }, user) => {
  // Use authorization helper for complex student profile viewing logic
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
        role: user.role,
        reason: 'Attempted to view paired student who is not their partner'
      } 
    });
    return ApiResponse.forbidden('You do not have permission to view this student profile');
  }

  if (!student) {
    logger.warn('Student not found', { context: 'API', data: { studentId: params.id } });
    return ApiResponse.notFound('Student');
  }

  return ApiResponse.success(student);
});

export const PUT = withAuth(
  async (request: NextRequest, { params }, user) => {
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

    const success = await StudentService.updateStudent(params.id, validation.data);

    if (!success) {
      logger.error('Student database update failed', undefined, { 
        context: 'API', 
        data: { studentId: params.id } 
      });
      return ApiResponse.error('Failed to update student', 500);
    }

    return ApiResponse.successMessage('Student updated successfully');
  },
  { requireOwnerOrAdmin: true }
);


