/**
 * POST /api/partnerships/request
 * 
 * Create a new partnership request
 * Phase 4: Includes duplicate request prevention
 * 
 * Authorization: Authenticated users only
 */

import { NextRequest } from 'next/server';
import { StudentPartnershipService } from '@/lib/services/partnerships/partnership-service';
import { withAuth } from '@/lib/middleware/apiHandler';
import { validateRequest, partnershipRequestSchema } from '@/lib/middleware/validation';
import { ApiResponse } from '@/lib/middleware/response';
import { logger } from '@/lib/logger';

export const POST = withAuth<Record<string, string>>(
  async (request: NextRequest, context, user) => {
  // Validate request body
  const validation = await validateRequest(request, partnershipRequestSchema);
  if (!validation.valid) {
    return ApiResponse.validationError(validation.error || 'Invalid request data');
  }

  const { targetStudentId } = validation.data!;

  // Prevent self-partnership
  if (targetStudentId === user.uid) {
    logger.warn('Self-partnership attempt blocked', {
      context: 'API',
      data: { userId: user.uid }
    });
    return ApiResponse.error('You cannot send a partnership request to yourself', 400);
  }

  // Create partnership request (includes duplicate detection in service layer)
  const result = await StudentPartnershipService.createPartnershipRequest(
    user.uid,
    targetStudentId
  );

  if (!result.success || !result.data) {
    return ApiResponse.error(result.error || 'Failed to create partnership request', 400);
  }

  return ApiResponse.created({ requestId: result.data }, 'Partnership request sent successfully');
  },
  { allowedRoles: ['student'] }
);

