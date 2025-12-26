/**
 * GET /api/supervisor-partnerships/partner
 * 
 * Get all active partnerships (projects where supervisor is co-supervisor)
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

    // Get all active partnerships (projects where supervisor is co-supervisor)
    const partnerships = await SupervisorPartnershipPairingService.getActivePartnerships(user.uid);
    
    return ApiResponse.successWithCount(partnerships);
  }
);

