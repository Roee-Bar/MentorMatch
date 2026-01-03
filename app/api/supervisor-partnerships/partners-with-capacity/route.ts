/**
 * GET /api/supervisor-partnerships/partners-with-capacity
 * 
 * Get potential co-supervisors with available capacity
 * Query: ?projectId=string
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

    if (!projectId) {
      return ApiResponse.validationError('Project ID is required');
    }

    const supervisors = await SupervisorPartnershipPairingService.getPartnersWithCapacity(
      user.uid,
      projectId
    );

    return ApiResponse.successWithCount(supervisors);
  },
  { allowedRoles: ['supervisor'] }
);

