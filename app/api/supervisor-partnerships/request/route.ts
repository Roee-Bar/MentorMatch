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
import { withValidationAndServiceCallForUser } from '@/lib/middleware/route-handlers';
import { supervisorPartnershipRequestSchema } from '@/lib/middleware/validation';
import { ApiResponse } from '@/lib/middleware/response';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/lib/constants/error-messages';

export const POST = withAuth<Record<string, string>>(
  async (request: NextRequest, context, user) => {
    return withValidationAndServiceCallForUser(
      request,
      user,
      supervisorPartnershipRequestSchema,
      (data) => SupervisorPartnershipWorkflowService.createRequest(
        user.uid,
        data.targetSupervisorId,
        data.projectId
      ),
      ERROR_MESSAGES.CREATE_PARTNERSHIP_REQUEST,
      (data, result) => ApiResponse.created(
        { requestId: result.data! },
        SUCCESS_MESSAGES.PARTNERSHIP_REQUEST_SENT
      )
    );
  },
  { allowedRoles: ['supervisor'], requireVerifiedEmail: true }
);

