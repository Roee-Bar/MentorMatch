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
import { withRoles } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';

export const GET = withRoles<Record<string, string>>(
  ['supervisor'],
  async (request: NextRequest, context, user) => {
    const partners = await SupervisorPartnershipPairingService.getPartnersWithAvailableCapacity(user.uid);
    return ApiResponse.successWithCount(partners);
  }
);

