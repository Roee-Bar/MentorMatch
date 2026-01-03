import { NextRequest } from 'next/server';
import { projectService } from '@/lib/services/projects/project-service';
import { withAuth } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';
import type { ProjectIdParams } from '@/types/api';

// All authenticated users can view project details
export const GET = withAuth<ProjectIdParams>(async (request: NextRequest, { params }, user) => {
  const project = await projectService.getProjectById(params.id);
  if (!project) return ApiResponse.notFound('Project');
  return ApiResponse.success(project);
});

