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
import type { SupervisorIdParams } from '@/types/api';

export const GET = withAuth<SupervisorIdParams>(
  async (request: NextRequest, { params }, user) => {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';

    if (!['incoming', 'outgoing', 'all'].includes(type)) {
      return ApiResponse.validationError('Invalid type parameter. Must be: incoming, outgoing, or all');
    }

    const requests = await SupervisorPartnershipRequestService.getBySupervisor(
      params.id,
      type as 'incoming' | 'outgoing' | 'all'
    );

    return ApiResponse.successWithCount(requests);
  },
  { requireOwnerOrAdmin: true, allowedRoles: ['supervisor'] }
);

