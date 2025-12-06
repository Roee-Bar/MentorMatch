/**
 * GET /api/supervisors/[id]
 * PUT /api/supervisors/[id]
 * 
 * Get or update a specific supervisor
 */

import { NextRequest } from 'next/server';
import { SupervisorService } from '@/lib/services/firebase-services.server';
import { withAuth } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';
import { validateBody, updateSupervisorSchema } from '@/lib/middleware/validation';
import { logger } from '@/lib/logger';

export const GET = withAuth(async (request: NextRequest, { params }, user) => {
  // Authorization: All authenticated users can view supervisor profiles
  // This is intentional because:
  // - Students need to browse supervisors to submit applications
  // - Students need to view their assigned supervisor's details
  // - Supervisors can view their own profile
  // - Admins need access for management purposes
  
  const supervisor = await SupervisorService.getSupervisorById(params.id);
  
  if (!supervisor) {
    logger.warn('Supervisor not found', { context: 'API', data: { supervisorId: params.id } });
    return ApiResponse.notFound('Supervisor');
  }

  return ApiResponse.success(supervisor);
});

export const PUT = withAuth(async (request: NextRequest, { params }, user) => {
  // Check authorization: user must be owner or admin
  const isOwner = user.uid === params.id;
  const isAdmin = user.role === 'admin';

  if (!isOwner && !isAdmin) {
    logger.error('Unauthorized supervisor update attempt', undefined, { 
      context: 'API', 
      data: { supervisorId: params.id, role: user.role } 
    });
    return ApiResponse.forbidden();
  }

  // Read and validate request body
  const body = await request.json();
  const validation = validateBody(body, updateSupervisorSchema);
  
  if (!validation.valid || !validation.data) {
    logger.error('Supervisor update validation failed', undefined, { 
      context: 'API', 
      data: { 
        supervisorId: params.id,
        validationError: validation.error,
        receivedFields: Object.keys(body)
      } 
    });
    return ApiResponse.validationError(validation.error || 'Invalid request data');
  }

  const success = await SupervisorService.updateSupervisor(params.id, validation.data);

  if (!success) {
    logger.error('Supervisor database update failed', undefined, { 
      context: 'API', 
      data: { supervisorId: params.id } 
    });
    return ApiResponse.error('Failed to update supervisor', 500);
  }

  return ApiResponse.successMessage('Supervisor updated successfully');
});


