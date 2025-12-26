/**
 * GET /api/supervisor-partnerships/partners-with-capacity
 * 
 * Get partners with available capacity for the authenticated supervisor
 * Used for project creation/editing to suggest co-supervisors
 * 
 * Authorization: Supervisor role required
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

    const partners = await SupervisorPartnershipPairingService.getPartnersWithAvailableCapacity(user.uid);
    return ApiResponse.successWithCount(partners);
  }
);

