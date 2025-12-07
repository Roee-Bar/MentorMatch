/**
 * DELETE /api/partnerships/[id]
 * 
 * Cancel a partnership request (by requester only)
 * 
 * Authorization: Requester owns the partnership request
 */

import { NextRequest } from 'next/server';
import { StudentPartnershipService } from '@/lib/services/partnerships/partnership-service';
import { withAuth } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';
import { logger } from '@/lib/logger';
import type { PartnershipIdParams } from '@/types/api';
import type { StudentPartnershipRequest } from '@/types/database';

export const DELETE = withAuth<PartnershipIdParams, StudentPartnershipRequest>(
  async (request: NextRequest, { params, cachedResource }, user) => {
    const partnershipRequest = cachedResource;
    
    if (!partnershipRequest) {
      logger.warn('Partnership request not found', {
        context: 'API',
        data: { requestId: params.id, userId: user.uid }
      });
      return ApiResponse.notFound('Partnership request');
    }

    // Check if request can be cancelled
    if (partnershipRequest.status !== 'pending') {
      return ApiResponse.error('Can only cancel pending requests', 400);
    }

    const result = await StudentPartnershipService.cancelPartnershipRequest(params.id, user.uid);
    
    if (!result.success) {
      return ApiResponse.error(result.error || 'Failed to cancel partnership request', 400);
    }
    
    return ApiResponse.successMessage('Partnership request cancelled successfully');
  },
  {
    resourceName: 'Partnership request',
    resourceLoader: async (params) => {
      return await StudentPartnershipService.getPartnershipRequest(params.id);
    },
    requireResourceAccess: async (user, context, resource) => {
      if (!resource) return false;
      return resource.requesterId === user.uid;
    }
  }
);

