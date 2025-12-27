/**
 * GET /api/supervisor-partnerships/requests
 * 
 * Get supervisor partnership requests for the authenticated supervisor
 * Supports query parameter: ?type=incoming|outgoing|all
 * 
 * Authorization: Authenticated supervisors only
 */

import { NextRequest } from 'next/server';
import { SupervisorPartnershipRequestService } from '@/lib/services/partnerships/supervisor-partnership-request-service';
import { withRoles } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';
import { PARTNERSHIP_REQUEST_TYPES, type PartnershipRequestType } from '@/lib/constants/partnership-constants';

export const GET = withRoles<Record<string, string>>(
  ['supervisor'],
  async (request: NextRequest, context, user) => {
    const { searchParams } = new URL(request.url);
    const type = (searchParams.get('type') || 'all') as PartnershipRequestType;

    if (!PARTNERSHIP_REQUEST_TYPES.includes(type)) {
      return ApiResponse.validationError(`Invalid type parameter. Must be one of: ${PARTNERSHIP_REQUEST_TYPES.join(', ')}`);
    }

    // Use authenticated user's ID (not from params)
    const requests = await SupervisorPartnershipRequestService.getBySupervisor(
      user.uid,
      type
    );

    return ApiResponse.successWithCount(requests);
  }
);

