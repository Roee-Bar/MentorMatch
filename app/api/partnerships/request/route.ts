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
import { partnershipRequestSchema } from '@/lib/middleware/validation';
import { ApiResponse } from '@/lib/middleware/response';
import { withValidatedRequestAndUser } from '@/lib/middleware/route-handlers';
import { logger } from '@/lib/logger';

export const POST = withAuth<Record<string, string>>(
  async (request: NextRequest, context, user) => {
    return withValidatedRequestAndUser(
      request,
      user,
      partnershipRequestSchema,
      async (data, user) => {
        // Prevent self-partnership
        if (data.targetStudentId === user.uid) {
          logger.warn('Self-partnership attempt blocked', {
            context: 'API',
            data: { userId: user.uid }
          });
          return { success: false, error: 'You cannot send a partnership request to yourself' };
        }

        // Create partnership request (includes duplicate detection in service layer)
        return await StudentPartnershipService.createPartnershipRequest(
          user.uid,
          data.targetStudentId
        );
      },
      'Failed to create partnership request',
      (data, result) => ApiResponse.created({ requestId: result.data! }, 'Partnership request sent successfully')
    );
  },
  { allowedRoles: ['student'], requireVerifiedEmail: true }
);

