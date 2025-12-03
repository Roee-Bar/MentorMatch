/**
 * GET /api/supervisors/[id]/applications
 * 
 * Get all applications for a specific supervisor
 */

import { NextRequest } from 'next/server';
import { ApplicationService } from '@/lib/services/firebase-services.server';
import { withAuth } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';

export const GET = withAuth(async (request: NextRequest, { params }, user) => {
  // Authorization: user must be the supervisor or admin
  const isOwner = user.uid === params.id;
  const isAdmin = user.role === 'admin';

  if (!isOwner && !isAdmin) {
    return ApiResponse.error('Forbidden', 403);
  }

  const applications = await ApplicationService.getSupervisorApplications(params.id);
  return ApiResponse.successWithCount(applications);
});

