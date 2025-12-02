import { NextRequest } from 'next/server';
import { ProjectService } from '@/lib/services/firebase-services.server';
import { withAuth, withRoles } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';

export const GET = withAuth(async (request: NextRequest, context, user) => {
  const projects = await ProjectService.getAllProjects();
  return ApiResponse.successWithCount(projects);
});

export const POST = withRoles(['admin'], async (request: NextRequest, context, user) => {
  const body = await request.json();
  const projectId = await ProjectService.createProject(body);
  return ApiResponse.created({ projectId }, 'Project created successfully');
});

