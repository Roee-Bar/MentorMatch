/**
 * GET /api/students/[id]/applications - Get applications for a specific student
 */

import { NextRequest } from 'next/server';
import { applicationService } from '@/lib/services/applications/application-service';
import { withAuth } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';
import type { StudentIdParams } from '@/types/api';

export const GET = withAuth<StudentIdParams>(
  async (request: NextRequest, { params }, user) => {
    const applications = await applicationService.getStudentApplications(params.id);
    return ApiResponse.successWithCount(applications);
  },
  { requireOwnerOrAdmin: true, allowedRoles: ['supervisor'] }
);

