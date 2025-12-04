import { NextRequest } from 'next/server';
import { ProjectService } from '@/lib/services/firebase-services.server';
import { withAuth } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';

// All authenticated users can view project details
export const GET = withAuth(async (request: NextRequest, { params }, user) => {
  const project = await ProjectService.getProjectById(params.id);
  if (!project) return ApiResponse.notFound('Project');
  return ApiResponse.success(project);
});

