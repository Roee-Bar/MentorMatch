/**
 * POST /api/supervisor-partnerships/unpair
 * 
 * Remove co-supervisor from a project
 * 
 * Authorization: Supervisor only (project supervisor)
 */

import { NextRequest } from 'next/server';
import { SupervisorPartnershipPairingService } from '@/lib/services/supervisor-partnerships/supervisor-partnership-pairing';
import { withAuth } from '@/lib/middleware/apiHandler';
import { validateAndExtract, handleValidationError } from '@/lib/middleware/validation-helpers';
import { unpairCoSupervisorSchema } from '@/lib/middleware/validation';
import { ApiResponse } from '@/lib/middleware/response';
import { handleServiceResult } from '@/lib/middleware/service-result-handler';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/lib/constants/error-messages';

export const POST = withAuth<Record<string, string>>(
  async (request: NextRequest, context, user) => {
    try {
      // Validate request body
      const { projectId } = await validateAndExtract(
        request,
        unpairCoSupervisorSchema
      );

      const result = await SupervisorPartnershipPairingService.unpairCoSupervisor(
        projectId,
        user.uid
      );

      const errorResponse = handleServiceResult(result, ERROR_MESSAGES.UNPAIR_CO_SUPERVISOR);
      if (errorResponse) return errorResponse;

      return ApiResponse.successMessage(SUCCESS_MESSAGES.CO_SUPERVISOR_REMOVED);
    } catch (error) {
      const validationResponse = handleValidationError(error);
      if (validationResponse) return validationResponse;
      throw error;
    }
  },
  { allowedRoles: ['supervisor'] }
);

