/**
 * POST /api/supervisor-partnerships/request
 * 
 * Create a new supervisor partnership request
 * 
 * Authorization: Authenticated supervisors only
 */

import { NextRequest } from 'next/server';
import { SupervisorPartnershipWorkflowService } from '@/lib/services/partnerships/supervisor-partnership-workflow';
import { withRoles } from '@/lib/middleware/apiHandler';
import { validateRequest, supervisorPartnershipRequestSchema } from '@/lib/middleware/validation';
import { ApiResponse } from '@/lib/middleware/response';
import { rateLimiters } from '@/lib/middleware/rateLimiter';
import { logger } from '@/lib/logger';

export const POST = withRoles<Record<string, string>>(['supervisor'], async (request: NextRequest, context, user) => {
  // Apply rate limiting
  const rateLimitResponse = rateLimiters.partnershipRequest(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // Validate request body
  const validation = await validateRequest(request, supervisorPartnershipRequestSchema);
  if (!validation.valid) {
    return ApiResponse.validationError(validation.error || 'Invalid request data');
  }

  const { targetSupervisorId, projectId } = validation.data!;

  // Prevent self-partnership
  if (targetSupervisorId === user.uid) {
    logger.warn('Self-partnership attempt blocked', {
      context: 'API',
      data: { userId: user.uid }
    });
    return ApiResponse.error('You cannot send a partnership request to yourself', 400);
  }

  // Create partnership request (includes duplicate detection in service layer)
  const result = await SupervisorPartnershipWorkflowService.createRequest(
    user.uid,
    targetSupervisorId,
    projectId
  );

  if (!result.success || !result.data) {
    return ApiResponse.error(result.error || 'Failed to create partnership request', 400);
  }

  return ApiResponse.created({ requestId: result.data }, 'Partnership request sent successfully');
});

