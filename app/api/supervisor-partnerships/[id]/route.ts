/**
 * GET /api/supervisor-partnerships/[id]
 * DELETE /api/supervisor-partnerships/[id]
 * 
 * Get partnership request details or cancel a partnership request (by requester only)
 * 
 * Authorization: Authenticated supervisor
 */

import { NextRequest } from 'next/server';
import { SupervisorPartnershipRequestService } from '@/lib/services/partnerships/supervisor-partnership-request-service';
import { SupervisorPartnershipWorkflowService } from '@/lib/services/partnerships/supervisor-partnership-workflow';
import { withAuth } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';
import { logger } from '@/lib/logger';
import type { SupervisorPartnershipRequest } from '@/types/database';

interface SupervisorPartnershipIdParams {
  id: string;
}

export const GET = withAuth<SupervisorPartnershipIdParams, SupervisorPartnershipRequest>(
  async (request: NextRequest, { params, cachedResource }, user) => {
    // Validate supervisor role
    if (user.role !== 'supervisor') {
      return ApiResponse.forbidden('Only supervisors can access this endpoint');
    }

    const partnershipRequest = cachedResource;
    
    if (!partnershipRequest) {
      return ApiResponse.notFound('Partnership request');
    }

    return ApiResponse.success(partnershipRequest);
  },
  {
    resourceName: 'Supervisor partnership request',
    resourceLoader: async (params) => {
      return await SupervisorPartnershipRequestService.getById(params.id);
    },
    requireResourceAccess: async (user, context, resource) => {
      if (!resource) return false;
      // Allow access if user is requester or target
      return resource.requesterId === user.uid || resource.targetSupervisorId === user.uid;
    }
  }
);

export const DELETE = withAuth<SupervisorPartnershipIdParams, SupervisorPartnershipRequest>(
  async (request: NextRequest, { params, cachedResource }, user) => {
    // Validate supervisor role
    if (user.role !== 'supervisor') {
      return ApiResponse.forbidden('Only supervisors can access this endpoint');
    }

    const partnershipRequest = cachedResource;
    
    if (!partnershipRequest) {
      logger.warn('Supervisor partnership request not found', {
        context: 'API',
        data: { requestId: params.id, userId: user.uid }
      });
      return ApiResponse.notFound('Partnership request');
    }

    // Check if request can be cancelled
    if (partnershipRequest.status !== 'pending') {
      return ApiResponse.error('Can only cancel pending requests', 400);
    }

    const result = await SupervisorPartnershipWorkflowService.cancelRequest(params.id, user.uid);
    
    if (!result.success) {
      return ApiResponse.error(result.error || 'Failed to cancel partnership request', 400);
    }
    
    return ApiResponse.successMessage('Partnership request cancelled successfully');
  },
  {
    resourceName: 'Supervisor partnership request',
    resourceLoader: async (params) => {
      return await SupervisorPartnershipRequestService.getById(params.id);
    },
    requireResourceAccess: async (user, context, resource) => {
      if (!resource) return false;
      return resource.requesterId === user.uid;
    }
  }
);

