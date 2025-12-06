/**
 * DELETE /api/partnerships/[id]
 * 
 * Cancel a partnership request (by requester only)
 * 
 * Authorization: Requester owns the partnership request
 */

import { NextRequest } from 'next/server';
import { StudentPartnershipService } from '@/lib/services/firebase-services.server';
import { withAuth } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';
import { logger } from '@/lib/logger';

export const DELETE = withAuth(
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

    await StudentPartnershipService.cancelPartnershipRequest(params.id, user.uid);
    return ApiResponse.successMessage('Partnership request cancelled successfully');
  },
  {
    resourceLoader: async (params) => {
      return await StudentPartnershipService.getPartnershipRequest(params.id);
    },
    requireResourceAccess: async (user, context, resource) => {
      if (!resource) return false;
      return resource.requesterId === user.uid;
    }
  }
);

