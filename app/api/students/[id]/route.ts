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
  // Authorization Rules:
  // 1. Owner can always view their own profile
  // 2. Supervisors and admins can view any student profile
  // 3. Students can view:
  //    - Their actual partner's profile (if they are paired)
  //    - Any unpaired student's profile (for partnership browsing)
  // 4. Students CANNOT view other paired students (who are not their partner)
  
  const isOwner = user.uid === params.id;
  const isSupervisorOrAdmin = ['supervisor', 'admin'].includes(user.role);

  // For students viewing other profiles (not their own)
  if (user.role === 'student' && !isOwner && !isSupervisorOrAdmin) {
    const [requestingStudent, targetStudent] = await Promise.all([
      AdminStudentService.getStudentById(user.uid),
      AdminStudentService.getStudentById(params.id)
    ]);
    
    // Check if student is viewing their actual partner
    const isViewingPartner = requestingStudent?.partnerId === params.id;
    
    // Check if target student is unpaired (available for partnership)
    const targetIsUnpaired = !targetStudent?.partnerId;
    
    // Allow access if viewing partner OR target is unpaired
    // Block access if trying to view a paired student who is not their partner
    if (!isViewingPartner && !targetIsUnpaired) {
      logger.error('Unauthorized student view attempt', undefined, { 
        context: 'API', 
        data: { 
          studentId: params.id, 
          requesterId: user.uid,
          role: user.role,
          reason: 'Attempted to view paired student who is not their partner'
        } 
      });
      return ApiResponse.forbidden();
    }
    
    // Optimization: Return cached targetStudent to avoid redundant database query
    if (!targetStudent) {
      logger.warn('Student not found', { context: 'API', data: { studentId: params.id } });
      return ApiResponse.notFound('Student');
    }
    
    return ApiResponse.success(targetStudent);
  }

  // For owner, supervisor, or admin: fetch the student data
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


