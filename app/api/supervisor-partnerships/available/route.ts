/**
 * GET /api/supervisor-partnerships/available
 * 
 * Get supervisors available for partnership
 * Returns supervisors who are not already co-supervising with the requester in active projects
 * Excludes the current user
 * 
 * Authorization: Authenticated supervisors only
 */

import { NextRequest } from 'next/server';
import { SupervisorPartnershipPairingService } from '@/lib/services/partnerships/supervisor-partnership-pairing';
import { withAuth } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';

export const GET = withAuth<Record<string, string>>(
  async (request: NextRequest, context, user) => {
    // Validate supervisor role
    if (user.role !== 'supervisor') {
      return ApiResponse.forbidden('Only supervisors can access this endpoint');
    }

    // Get available supervisors (excludes those already partnered with in active projects)
    const supervisors = await SupervisorPartnershipPairingService.getAvailableSupervisors(user.uid);
    return ApiResponse.successWithCount(supervisors);
  }
);

