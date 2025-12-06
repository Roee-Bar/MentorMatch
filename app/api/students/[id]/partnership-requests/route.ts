/**
 * GET /api/students/[id]/partnership-requests
 * 
 * Get partnership requests for a specific student
 * Supports query parameter: ?type=incoming|outgoing|all
 */

import { NextRequest } from 'next/server';
import { StudentPartnershipService } from '@/lib/services/partnerships/partnership-service';
import { withAuth } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';
import type { StudentIdParams } from '@/types/api';

export const GET = withAuth<StudentIdParams>(
  async (request: NextRequest, { params }, user) => {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';

    if (!['incoming', 'outgoing', 'all'].includes(type)) {
      return ApiResponse.validationError('Invalid type parameter. Must be: incoming, outgoing, or all');
    }

    const requests = await StudentPartnershipService.getPartnershipRequests(
      params.id,
      type as 'incoming' | 'outgoing' | 'all'
    );

    return ApiResponse.successWithCount(requests);
  },
  { requireOwnerOrAdmin: true, allowedRoles: ['supervisor'] }
);

