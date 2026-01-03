/**
 * GET /api/supervisor-partnerships/partner
 * 
 * Get active partnerships for a supervisor
 * Query: ?projectId=string (optional)
 * 
 * Authorization: Supervisor only
 */

import { NextRequest } from 'next/server';
import { SupervisorPartnershipPairingService } from '@/lib/services/supervisor-partnerships/supervisor-partnership-pairing';
import { withAuth } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';
import { getOptionalQueryParam } from '@/lib/utils/query-params';

export const GET = withAuth<Record<string, string>>(
  async (request: NextRequest, context, user) => {
    const { searchParams } = new URL(request.url);
    const projectId = getOptionalQueryParam(searchParams, 'projectId');

    const partnerships = await SupervisorPartnershipPairingService.getActivePartnerships(
      user.uid,
      projectId
    );

    return ApiResponse.successWithCount(partnerships);
  },
  { allowedRoles: ['supervisor'] }
);

