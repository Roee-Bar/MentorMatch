/**
 * GET /api/students/[id]/applications - Get applications for a specific student
 */

import { NextRequest } from 'next/server';
import { ApplicationService } from '@/lib/services/firebase-services.server';
import { withAuth } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';

export const GET = withAuth(
  async (request: NextRequest, { params }, user) => {
    const applications = await ApplicationService.getStudentApplications(params.id);
    return ApiResponse.successWithCount(applications);
  },
  { requireOwnerOrAdmin: true, allowedRoles: ['supervisor'] }
);

