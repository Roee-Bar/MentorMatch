import { NextRequest } from 'next/server';
import { projectService } from '@/lib/services/projects/project-service';
import { withAuth, withRoles } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';

export const GET = withAuth<Record<string, string>>(async (request: NextRequest, context, user) => {
  const projects = await projectService.getAllProjects();
  return ApiResponse.successWithCount(projects);
});

export const POST = withRoles<Record<string, string>>(['admin'], async (request: NextRequest, context, user) => {
  const body = await request.json();
  const result = await projectService.createProject(body);
  
  if (!result.success || !result.data) {
    return ApiResponse.error(result.error || 'Failed to create project', 500);
  }
  
  return ApiResponse.created({ projectId: result.data }, 'Project created successfully');
});

