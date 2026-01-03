/**
 * GET /api/supervisors/[id]/applications
 * 
 * Get all applications for a specific supervisor
 */

import { NextRequest } from 'next/server';
import { applicationService } from '@/lib/services/applications/application-service';
import { withAuth } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';
import type { SupervisorIdParams } from '@/types/api';

export const GET = withAuth<SupervisorIdParams>(
  async (request: NextRequest, { params }, user) => {
    const applications = await applicationService.getSupervisorApplications(params.id);
    return ApiResponse.successWithCount(applications);
  },
  { requireOwnerOrAdmin: true }
);

