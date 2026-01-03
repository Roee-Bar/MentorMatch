/**
 * POST /api/supervisor-partnerships/[id]/respond
 * 
 * Accept or reject a partnership request
 * 
 * Authorization: Supervisor only (target supervisor)
 */

import { NextRequest } from 'next/server';
import { SupervisorPartnershipWorkflowService } from '@/lib/services/supervisor-partnerships/supervisor-partnership-workflow';
import { withAuth } from '@/lib/middleware/apiHandler';
import { validateRequest, supervisorPartnershipResponseSchema } from '@/lib/middleware/validation';
import { ApiResponse } from '@/lib/middleware/response';
import type { SupervisorPartnershipIdParams } from '@/types/api';

export const POST = withAuth<SupervisorPartnershipIdParams>(
  async (request: NextRequest, { params }, user) => {
    // Validate request body
    const validation = await validateRequest(request, supervisorPartnershipResponseSchema);
    if (!validation.valid || !validation.data) {
      return ApiResponse.validationError(validation.error || 'Invalid request data');
    }

    const { action } = validation.data;

    const result = await SupervisorPartnershipWorkflowService.respondToRequest(
      params.id,
      user.uid,
      action
    );

    if (!result.success) {
      return ApiResponse.error(result.error || 'Failed to respond to request', 400);
    }

    return ApiResponse.success(undefined, `Request ${action}ed successfully`);
  },
  { allowedRoles: ['supervisor'] }
);

