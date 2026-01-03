/**
 * GET /api/supervisor-partnerships/available
 * 
 * Get available supervisors for partnership (with capacity)
 * Query: ?projectId=string (optional)
 * 
 * Authorization: Supervisor only
 */

import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/middleware/apiHandler';
import { handleGetPartnersWithCapacity } from '@/lib/middleware/handlers/supervisor-partnership-handlers';

export const GET = withAuth<Record<string, string>>(
  async (request: NextRequest, context, user) => {
    return handleGetPartnersWithCapacity(request, user.uid, false);
  },
  { allowedRoles: ['supervisor'] }
);

