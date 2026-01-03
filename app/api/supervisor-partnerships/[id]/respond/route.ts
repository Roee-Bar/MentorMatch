/**
 * POST /api/supervisor-partnerships/[id]/respond
 * 
 * Accept or reject a partnership request
 * 
 * Authorization: Supervisor only (target supervisor)
 */

import { NextRequest } from 'next/server';
import { SupervisorPartnershipWorkflowService } from '@/lib/services/supervisor-partnerships/supervisor-partnership-workflow';
import { withAuth } from '@/lib/middleware/apiHandler';
import { withValidationAndServiceCallForUser } from '@/lib/middleware/route-handlers';
import { supervisorPartnershipResponseSchema } from '@/lib/middleware/validation';
import { ApiResponse } from '@/lib/middleware/response';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/lib/constants/error-messages';
import type { SupervisorPartnershipIdParams } from '@/types/api';

export const POST = withAuth<SupervisorPartnershipIdParams>(
  async (request: NextRequest, { params }, user) => {
    return withValidationAndServiceCallForUser(
      request,
      user,
      supervisorPartnershipResponseSchema,
      (data) => SupervisorPartnershipWorkflowService.respondToRequest(
        params.id,
        user.uid,
        data.action
      ),
      ERROR_MESSAGES.RESPOND_TO_REQUEST,
      (data, result) => {
        const successMessage = data.action === 'accept' 
          ? SUCCESS_MESSAGES.REQUEST_ACCEPTED 
          : SUCCESS_MESSAGES.REQUEST_REJECTED;
        return ApiResponse.successMessage(successMessage);
      }
    );
  },
  { allowedRoles: ['supervisor'] }
);

