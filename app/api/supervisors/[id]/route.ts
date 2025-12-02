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
import { validateRequest, updateSupervisorSchema } from '@/lib/middleware/validation';

export const GET = withAuth(async (request: NextRequest, { params }, user) => {
  const supervisor = await SupervisorService.getSupervisorById(params.id);
  
  if (!supervisor) {
    return ApiResponse.notFound('Supervisor');
  }

  return ApiResponse.success(supervisor);
});

export const PUT = withAuth(async (request: NextRequest, { params }, user) => {
  // Check authorization: user must be owner or admin
  const isOwner = user.uid === params.id;
  const isAdmin = user.role === 'admin';

  if (!isOwner && !isAdmin) {
    return ApiResponse.forbidden();
  }

  // Validate request body
  const validation = await validateRequest(request, updateSupervisorSchema);
  if (!validation.valid || !validation.data) {
    return ApiResponse.validationError(validation.error || 'Invalid request data');
  }

  const success = await SupervisorService.updateSupervisor(params.id, validation.data);

  if (!success) {
    return ApiResponse.error('Failed to update supervisor', 500);
  }

  return ApiResponse.successMessage('Supervisor updated successfully');
});


