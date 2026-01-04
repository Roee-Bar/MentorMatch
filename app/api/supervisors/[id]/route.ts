/**
 * GET /api/supervisors/[id]
 * PUT /api/supervisors/[id]
 * 
 * Get or update a specific supervisor
 */

import { NextRequest } from 'next/server';
import { supervisorService } from '@/lib/services/supervisors/supervisor-service';
import { withAuth } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';
import { updateSupervisorSchema } from '@/lib/middleware/validation';
import { withValidatedRequestAndUser } from '@/lib/middleware/route-handlers';
import { logger } from '@/lib/logger';
import type { SupervisorIdParams } from '@/types/api';

export const GET = withAuth<SupervisorIdParams>(async (request: NextRequest, { params }, user) => {
  // Authorization: All authenticated users can view supervisor profiles
  // This is intentional because:
  // - Students need to browse supervisors to submit applications
  // - Students need to view their assigned supervisor's details
  // - Supervisors can view their own profile
  // - Admins need access for management purposes
  
  const supervisor = await supervisorService.getSupervisorById(params.id);
  
  if (!supervisor) {
    logger.warn('Supervisor not found', { context: 'API', data: { supervisorId: params.id } });
    return ApiResponse.notFound('Supervisor');
  }

  return ApiResponse.success(supervisor);
});

export const PUT = withAuth<SupervisorIdParams>(
  async (request: NextRequest, { params }, user) => {
    return withValidatedRequestAndUser(
      request,
      user,
      updateSupervisorSchema,
      (data, user) => supervisorService.updateSupervisor(params.id, data),
      'Failed to update supervisor',
      () => ApiResponse.successMessage('Supervisor updated successfully')
    );
  },
  { requireOwnerOrAdmin: true, requireVerifiedEmail: true }
);


