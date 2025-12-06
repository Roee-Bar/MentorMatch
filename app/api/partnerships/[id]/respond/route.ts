/**
 * POST /api/partnerships/[id]/respond
 * 
 * Respond to a partnership request (accept or reject)
 * Phase 7.2: Enhanced error messages for partnership operations
 * 
 * Authorization: Target student of the partnership request
 */

import { NextRequest } from 'next/server';
import { StudentPartnershipService } from '@/lib/services/partnerships/partnership-service';
import { withAuth } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';
import { validateRequest, partnershipResponseSchema } from '@/lib/middleware/validation';
import { logger } from '@/lib/logger';
import type { PartnershipIdParams } from '@/types/api';
import type { StudentPartnershipRequest } from '@/types/database';

export const POST = withAuth<PartnershipIdParams, StudentPartnershipRequest>(
  async (request: NextRequest, { params, cachedResource }, user) => {
    const partnershipRequest = cachedResource;
    
    if (!partnershipRequest) {
      return ApiResponse.notFound('Partnership request not found or has expired.');
    }

    // Validate request body
    const validation = await validateRequest(request, partnershipResponseSchema);
    if (!validation.valid) {
      return ApiResponse.validationError(validation.error || 'Invalid request data');
    }

    const { action } = validation.data!;

    // Check if request has already been processed
    if (partnershipRequest.status !== 'pending') {
      logger.warn('Partnership request already processed', {
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
    await StudentPartnershipService.respondToPartnershipRequest(
      params.id,
      user.uid,
      action
    );

    return ApiResponse.successMessage(
      action === 'accept' 
        ? 'Partnership accepted successfully' 
        : 'Partnership request rejected'
    );
  },
  {
    resourceName: 'Partnership request',
    resourceLoader: async (params) => {
      return await StudentPartnershipService.getPartnershipRequest(params.id);
    },
    requireResourceAccess: async (user, context, resource) => {
      if (!resource) return false;
      return resource.targetStudentId === user.uid;
    }
  }
);

