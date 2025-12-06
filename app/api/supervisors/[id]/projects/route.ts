/**
 * GET /api/supervisors/[id]/projects
 * 
 * Get all projects for a specific supervisor
 */

import { NextRequest } from 'next/server';
import { ProjectService } from '@/lib/services/firebase-services.server';
import { withAuth } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';

export const GET = withAuth(
  async (request: NextRequest, { params }, user) => {
    const projects = await ProjectService.getSupervisorProjects(params.id);
    return ApiResponse.successWithCount(projects);
  },
  { requireOwnerOrAdmin: true }
);

