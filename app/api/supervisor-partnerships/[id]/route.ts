/**
 * GET /api/supervisor-partnerships/[id]
 * DELETE /api/supervisor-partnerships/[id]
 * 
 * Get or cancel a specific partnership request
 * 
 * Authorization: Supervisor only (owner of request)
 */

import { NextRequest } from 'next/server';
import { SupervisorPartnershipWorkflowService } from '@/lib/services/supervisor-partnerships/supervisor-partnership-workflow';
import { withAuth } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';
import { verifyRequestAccess } from '@/lib/middleware/authorization-helpers';
import { handleServiceResult } from '@/lib/middleware/service-result-handler';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/lib/constants/error-messages';
import type { SupervisorPartnershipIdParams } from '@/types/api';

export const GET = withAuth<SupervisorPartnershipIdParams>(
  async (request: NextRequest, { params }, user) => {
    const authResult = await verifyRequestAccess(params.id, user.uid);
    
    if (!authResult.authorized || !authResult.resource) {
      return authResult.error || ApiResponse.forbidden(ERROR_MESSAGES.UNAUTHORIZED_VIEW_REQUEST);
    }

    return ApiResponse.success(authResult.resource);
  },
  { allowedRoles: ['supervisor'] }
);

export const DELETE = withAuth<SupervisorPartnershipIdParams>(
  async (request: NextRequest, { params }, user) => {
    const result = await SupervisorPartnershipWorkflowService.cancelRequest(
      params.id,
      user.uid
    );

    const errorResponse = handleServiceResult(result, ERROR_MESSAGES.CANCEL_REQUEST);
    if (errorResponse) return errorResponse;

    return ApiResponse.successMessage(SUCCESS_MESSAGES.REQUEST_CANCELLED);
  },
  { allowedRoles: ['supervisor'] }
);

