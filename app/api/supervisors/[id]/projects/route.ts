/**
 * GET /api/supervisors/[id]/projects
 * 
 * Get all projects for a specific supervisor
 */

import { NextRequest } from 'next/server';
import { ProjectService } from '@/lib/services/projects/project-service';
import { withAuth } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';
import type { SupervisorIdParams } from '@/types/api';

export const GET = withAuth<SupervisorIdParams>(
  async (request: NextRequest, { params }, user) => {
    const projects = await ProjectService.getSupervisorProjects(params.id);
    return ApiResponse.successWithCount(projects);
  },
  { requireOwnerOrAdmin: true }
);

