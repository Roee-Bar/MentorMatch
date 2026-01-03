/**
 * GET /api/supervisor-partnerships/[id]
 * DELETE /api/supervisor-partnerships/[id]
 * 
 * Get or cancel a specific partnership request
 * 
 * Authorization: Supervisor only (owner of request)
 */

import { NextRequest } from 'next/server';
import { SupervisorPartnershipRequestService } from '@/lib/services/supervisor-partnerships/supervisor-partnership-request-service';
import { SupervisorPartnershipWorkflowService } from '@/lib/services/supervisor-partnerships/supervisor-partnership-workflow';
import { withAuth } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';
import type { SupervisorPartnershipIdParams } from '@/types/api';

export const GET = withAuth<SupervisorPartnershipIdParams>(
  async (request: NextRequest, { params }, user) => {
    const requestData = await SupervisorPartnershipRequestService.getById(params.id);
    
    if (!requestData) {
      return ApiResponse.notFound('Partnership request');
    }

    // Verify user is either requesting or target supervisor
    if (requestData.requestingSupervisorId !== user.uid && requestData.targetSupervisorId !== user.uid) {
      return ApiResponse.forbidden('Unauthorized to view this request');
    }

    return ApiResponse.success(requestData);
  },
  { allowedRoles: ['supervisor'] }
);

export const DELETE = withAuth<SupervisorPartnershipIdParams>(
  async (request: NextRequest, { params }, user) => {
    const result = await SupervisorPartnershipWorkflowService.cancelRequest(
      params.id,
      user.uid
    );

    if (!result.success) {
      return ApiResponse.error(result.error || 'Failed to cancel request', 400);
    }

    return ApiResponse.success(undefined, 'Request cancelled successfully');
  },
  { allowedRoles: ['supervisor'] }
);

