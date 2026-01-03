/**
 * GET /api/supervisor-partnerships/requests
 * 
 * Get partnership requests for a supervisor
 * Query: ?type=incoming|outgoing|all
 * 
 * Authorization: Supervisor only
 */

import { NextRequest, NextResponse } from 'next/server';
import { SupervisorPartnershipRequestService } from '@/lib/services/supervisor-partnerships/supervisor-partnership-request-service';
import { withAuth } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';
import { extractQueryParams } from '@/lib/middleware/query-params';
import { ERROR_MESSAGES } from '@/lib/constants/error-messages';
import { z } from 'zod';

const requestTypeSchema = z.object({
  type: z.enum(['incoming', 'outgoing', 'all'], {
    errorMap: () => ({ message: ERROR_MESSAGES.INVALID_TYPE_PARAMETER })
  }).default('all'),
});

export const GET = withAuth<Record<string, string>>(
  async (request: NextRequest, context, user) => {
    const params = await extractQueryParams(request, requestTypeSchema);
    
    if (params instanceof NextResponse) {
      return params;
    }

    const requests = await SupervisorPartnershipRequestService.getBySupervisor(
      user.uid,
      params.type
    );

    return ApiResponse.successWithCount(requests);
  },
  { allowedRoles: ['supervisor'] }
);

