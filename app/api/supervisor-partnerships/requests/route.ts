/**
 * GET /api/supervisor-partnerships/requests
 * 
 * Get partnership requests for a supervisor
 * Query: ?type=incoming|outgoing|all
 * 
 * Authorization: Supervisor only
 */

import { NextRequest } from 'next/server';
import { SupervisorPartnershipRequestService } from '@/lib/services/supervisor-partnerships/supervisor-partnership-request-service';
import { withAuth } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';
import { getOptionalQueryParam } from '@/lib/utils/query-params';

export const GET = withAuth<Record<string, string>>(
  async (request: NextRequest, context, user) => {
    const { searchParams } = new URL(request.url);
    const type = getOptionalQueryParam(searchParams, 'type') || 'all';

    if (!['incoming', 'outgoing', 'all'].includes(type)) {
      return ApiResponse.validationError('Invalid type parameter. Must be: incoming, outgoing, or all');
    }

    const requests = await SupervisorPartnershipRequestService.getBySupervisor(
      user.uid,
      type as 'incoming' | 'outgoing' | 'all'
    );

    return ApiResponse.successWithCount(requests);
  },
  { allowedRoles: ['supervisor'] }
);

