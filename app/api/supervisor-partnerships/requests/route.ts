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
import { withAuth } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';

export const GET = withAuth<Record<string, string>>(
  async (request: NextRequest, context, user) => {
    // Validate supervisor role
    if (user.role !== 'supervisor') {
      return ApiResponse.forbidden('Only supervisors can access this endpoint');
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';

    if (!['incoming', 'outgoing', 'all'].includes(type)) {
      return ApiResponse.validationError('Invalid type parameter. Must be: incoming, outgoing, or all');
    }

    // Use authenticated user's ID (not from params)
    const requests = await SupervisorPartnershipRequestService.getBySupervisor(
      user.uid,
      type as 'incoming' | 'outgoing' | 'all'
    );

    return ApiResponse.successWithCount(requests);
  }
);

