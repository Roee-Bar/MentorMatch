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
import { partnershipResponseSchema } from '@/lib/middleware/validation';
import { validateAndExtract, handleValidationError } from '@/lib/middleware/validation-helpers';
import { handleServiceResult } from '@/lib/middleware/service-result-handler';
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
    let action: 'accept' | 'reject';
    try {
      const validatedData = await validateAndExtract(request, partnershipResponseSchema);
      action = validatedData.action;
    } catch (error) {
      const validationResponse = handleValidationError(error);
      if (validationResponse) return validationResponse;
      throw error;
    }

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
    const result = await StudentPartnershipService.respondToPartnershipRequest(
      params.id,
      user.uid,
      action
    );

    const errorResponse = handleServiceResult(result, 'Failed to respond to partnership request');
    if (errorResponse) return errorResponse;

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

