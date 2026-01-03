/**
 * GET /api/supervisor-partnerships/available
 * 
 * Get available supervisors for partnership (with capacity)
 * Query: ?projectId=string (optional)
 * 
 * Authorization: Supervisor only
 */

import { NextRequest } from 'next/server';
import { SupervisorPartnershipPairingService } from '@/lib/services/supervisor-partnerships/supervisor-partnership-pairing';
import { withAuth } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';

export const GET = withAuth<Record<string, string>>(
  async (request: NextRequest, context, user) => {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId') || '';

    const supervisors = await SupervisorPartnershipPairingService.getPartnersWithCapacity(
      user.uid,
      projectId
    );

    return ApiResponse.successWithCount(supervisors);
  },
  { allowedRoles: ['supervisor'] }
);

