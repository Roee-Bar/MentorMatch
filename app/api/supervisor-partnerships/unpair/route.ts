/**
 * POST /api/supervisor-partnerships/unpair
 * 
 * Remove co-supervisor from a project
 * 
 * Authorization: Supervisor only (project supervisor)
 */

import { NextRequest } from 'next/server';
import { SupervisorPartnershipPairingService } from '@/lib/services/supervisor-partnerships/supervisor-partnership-pairing';
import { withAuth } from '@/lib/middleware/apiHandler';
import { validateRequest, unpairCoSupervisorSchema } from '@/lib/middleware/validation';
import { ApiResponse } from '@/lib/middleware/response';

export const POST = withAuth<Record<string, string>>(
  async (request: NextRequest, context, user) => {
    // Validate request body
    const validation = await validateRequest(request, unpairCoSupervisorSchema);
    if (!validation.valid || !validation.data) {
      return ApiResponse.validationError(validation.error || 'Invalid request data');
    }

    const { projectId } = validation.data;

    const result = await SupervisorPartnershipPairingService.unpairCoSupervisor(
      projectId,
      user.uid
    );

    if (!result.success) {
      return ApiResponse.error(result.error || 'Failed to unpair co-supervisor', 400);
    }

    return ApiResponse.successMessage('Co-supervisor removed successfully');
  },
  { allowedRoles: ['supervisor'] }
);

