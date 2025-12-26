/**
 * GET /api/supervisors/available-partners - Get supervisors available for partnership
 * Returns supervisors who are not already co-supervising with the requester in active projects
 * Excludes the current user
 */

import { NextRequest } from 'next/server';
import { SupervisorPartnershipPairingService } from '@/lib/services/partnerships/supervisor-partnership-pairing';
import { withRoles } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';

export const GET = withRoles<Record<string, string>>(['supervisor'], async (request: NextRequest, context, user) => {
  // Get available supervisors (excludes those already partnered with in active projects)
  const supervisors = await SupervisorPartnershipPairingService.getAvailableSupervisors(user.uid);
  return ApiResponse.successWithCount(supervisors);
});

