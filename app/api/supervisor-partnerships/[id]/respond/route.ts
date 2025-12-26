/**
 * POST /api/supervisor-partnerships/[id]/respond
 * 
 * Respond to a supervisor partnership request (accept or reject)
 * 
 * Authorization: Target supervisor of the partnership request
 */

import { NextRequest } from 'next/server';
import { SupervisorPartnershipWorkflowService } from '@/lib/services/partnerships/supervisor-partnership-workflow';
import { SupervisorPartnershipRequestService } from '@/lib/services/partnerships/supervisor-partnership-request-service';
import { withAuth } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';
import { validateRequest, supervisorPartnershipResponseSchema } from '@/lib/middleware/validation';
import { logger } from '@/lib/logger';
import type { SupervisorPartnershipRequest } from '@/types/database';

interface SupervisorPartnershipIdParams {
  id: string;
}

export const POST = withAuth<SupervisorPartnershipIdParams, SupervisorPartnershipRequest>(
  async (request: NextRequest, { params, cachedResource }, user) => {
    // Validate supervisor role
    if (user.role !== 'supervisor') {
      return ApiResponse.forbidden('Only supervisors can access this endpoint');
    }

    const partnershipRequest = cachedResource;
    
    if (!partnershipRequest) {
      return ApiResponse.notFound('Partnership request not found or has expired.');
    }

    // Validate request body
    const validation = await validateRequest(request, supervisorPartnershipResponseSchema);
    if (!validation.valid) {
      return ApiResponse.validationError(validation.error || 'Invalid request data');
    }

    const { action } = validation.data!;

    // Check if request has already been processed
    if (partnershipRequest.status !== 'pending') {
      logger.warn('Supervisor partnership request already processed', {
        context: 'API',
        data: {
          requestId: params.id,
          userId: user.uid,
          currentStatus: partnershipRequest.status
        }
      });
      return ApiResponse.error('This request has already been accepted/rejected.', 400);
    }

    // Call service method to respond to the request
    const result = await SupervisorPartnershipWorkflowService.respondToRequest(
      params.id,
      user.uid,
      action
    );

    if (!result.success) {
      return ApiResponse.error(result.error || 'Failed to respond to partnership request', 400);
    }

    return ApiResponse.successMessage(
      action === 'accept' 
        ? 'Partnership accepted successfully' 
        : 'Partnership request rejected'
    );
  },
  {
    resourceName: 'Supervisor partnership request',
    resourceLoader: async (params) => {
      return await SupervisorPartnershipRequestService.getById(params.id);
    },
    requireResourceAccess: async (user, context, resource) => {
      if (!resource) return false;
      return resource.targetSupervisorId === user.uid;
    }
  }
);

