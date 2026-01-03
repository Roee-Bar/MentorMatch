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
import { withValidationAndServiceCallForUser } from '@/lib/middleware/route-handlers';
import { unpairCoSupervisorSchema } from '@/lib/middleware/validation';
import { ApiResponse } from '@/lib/middleware/response';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/lib/constants/error-messages';

export const POST = withAuth<Record<string, string>>(
  async (request: NextRequest, context, user) => {
    return withValidationAndServiceCallForUser(
      request,
      user,
      unpairCoSupervisorSchema,
      (data) => SupervisorPartnershipPairingService.unpairCoSupervisor(
        data.projectId,
        user.uid
      ),
      ERROR_MESSAGES.UNPAIR_CO_SUPERVISOR,
      () => ApiResponse.successMessage(SUCCESS_MESSAGES.CO_SUPERVISOR_REMOVED)
    );
  },
  { allowedRoles: ['supervisor'] }
);

