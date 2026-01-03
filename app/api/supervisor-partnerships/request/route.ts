/**
 * POST /api/supervisor-partnerships/request
 * 
 * Create a new supervisor partnership request
 * 
 * Authorization: Supervisor only
 */

import { NextRequest } from 'next/server';
import { SupervisorPartnershipWorkflowService } from '@/lib/services/supervisor-partnerships/supervisor-partnership-workflow';
import { withAuth } from '@/lib/middleware/apiHandler';
import { validateAndExtract, handleValidationError } from '@/lib/middleware/validation-helpers';
import { supervisorPartnershipRequestSchema } from '@/lib/middleware/validation';
import { ApiResponse } from '@/lib/middleware/response';
import { handleServiceResult } from '@/lib/middleware/service-result-handler';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/lib/constants/error-messages';
import { logger } from '@/lib/logger';

export const POST = withAuth<Record<string, string>>(
  async (request: NextRequest, context, user) => {
    try {
      // Validate request body
      const { targetSupervisorId, projectId } = await validateAndExtract(
        request,
        supervisorPartnershipRequestSchema
      );

      // Prevent self-partnership
      if (targetSupervisorId === user.uid) {
        logger.warn('Self-partnership attempt blocked', {
          context: 'API',
          data: { userId: user.uid }
        });
        return ApiResponse.error(ERROR_MESSAGES.SELF_PARTNERSHIP_BLOCKED, 400);
      }

      // Create partnership request
      const result = await SupervisorPartnershipWorkflowService.createRequest(
        user.uid,
        targetSupervisorId,
        projectId
      );

      const errorResponse = handleServiceResult(result, ERROR_MESSAGES.CREATE_PARTNERSHIP_REQUEST);
      if (errorResponse) return errorResponse;

      if (!result.data) {
        return ApiResponse.error(ERROR_MESSAGES.CREATE_PARTNERSHIP_REQUEST, 400);
      }

      return ApiResponse.created({ requestId: result.data }, SUCCESS_MESSAGES.PARTNERSHIP_REQUEST_SENT);
    } catch (error) {
      const validationResponse = handleValidationError(error);
      if (validationResponse) return validationResponse;
      throw error;
    }
  },
  { allowedRoles: ['supervisor'] }
);

