import { NextRequest } from 'next/server';
import { projectService } from '@/lib/services/projects/project-service';
import { withAuth, withRoles } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';
import { withValidatedRequest } from '@/lib/middleware/route-handlers';
import { createProjectSchema } from '@/lib/middleware/validation';

// All authenticated users can view projects (students need to browse for applications)
export const GET = withAuth<Record<string, string>>(async (request: NextRequest, context, user) => {
  const projects = await projectService.getAllProjects();
  return ApiResponse.successWithCount(projects);
});

export const POST = withRoles<Record<string, string>>(['admin'], async (request: NextRequest, context, user) => {
  return withValidatedRequest(
    request,
    createProjectSchema,
    (data) => projectService.createProject(data),
    'Failed to create project',
    (data, result) => ApiResponse.created({ projectId: result.data! }, 'Project created successfully')
  );
});

