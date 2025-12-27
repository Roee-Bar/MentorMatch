/**
 * GET /api/supervisors/[id]/partnership-requests
 * 
 * Get supervisor partnership requests for a specific supervisor
 * Supports query parameter: ?type=incoming|outgoing|all
 */

import { NextRequest } from 'next/server';
import { SupervisorPartnershipRequestService } from '@/lib/services/partnerships/supervisor-partnership-request-service';
import { withAuth } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';
import { PARTNERSHIP_REQUEST_TYPES, type PartnershipRequestType } from '@/lib/constants/partnership-constants';
import type { SupervisorIdParams } from '@/types/api';

export const GET = withAuth<SupervisorIdParams>(
  async (request: NextRequest, { params }, user) => {
    const { searchParams } = new URL(request.url);
    const type = (searchParams.get('type') || 'all') as PartnershipRequestType;

    if (!PARTNERSHIP_REQUEST_TYPES.includes(type)) {
      return ApiResponse.validationError(`Invalid type parameter. Must be one of: ${PARTNERSHIP_REQUEST_TYPES.join(', ')}`);
    }

    const requests = await SupervisorPartnershipRequestService.getBySupervisor(
      params.id,
      type
    );

    return ApiResponse.successWithCount(requests);
  },
  { requireOwnerOrAdmin: true, allowedRoles: ['supervisor'] }
);

