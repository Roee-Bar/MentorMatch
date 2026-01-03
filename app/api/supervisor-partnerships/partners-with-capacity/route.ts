/**
 * GET /api/supervisor-partnerships/partners-with-capacity
 * 
 * Get potential co-supervisors with available capacity
 * Query: ?projectId=string
 * 
 * Authorization: Supervisor only
 */

import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/middleware/apiHandler';
import { handleGetPartnersWithCapacity } from '@/lib/middleware/handlers/supervisor-partnership-handlers';
import { ERROR_MESSAGES } from '@/lib/constants/error-messages';

export const GET = withAuth<Record<string, string>>(
  async (request: NextRequest, context, user) => {
    return handleGetPartnersWithCapacity(request, user.uid, true);
  },
  { allowedRoles: ['supervisor'] }
);

