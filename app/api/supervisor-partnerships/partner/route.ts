/**
 * GET /api/supervisor-partnerships/partner
 * 
 * Get all active partnerships (projects where supervisor is co-supervisor)
 * 
 * Authorization: Supervisor role required
 */

import { NextRequest } from 'next/server';
import { SupervisorPartnershipPairingService } from '@/lib/services/partnerships/supervisor-partnership-pairing';
import { withRoles } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';

export const GET = withRoles<Record<string, string>>(
  ['supervisor'],
  async (request: NextRequest, context, user) => {
    // Get all active partnerships (projects where supervisor is co-supervisor)
    const partnerships = await SupervisorPartnershipPairingService.getActivePartnerships(user.uid);
    
    return ApiResponse.successWithCount(partnerships);
  }
);

