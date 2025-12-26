/**
 * POST /api/supervisor-partnerships/unpair
 * 
 * Remove co-supervisor from a specific project (partnership ends for that project)
 * 
 * Authorization: Supervisor role required
 * 
 * NOTE: Partnerships are project-based. This endpoint removes the co-supervisor from
 * a specific project. Partnerships automatically end when projects complete or are deleted.
 * This route can be used to manually remove co-supervisor from a project before it ends.
 * 
 * Terminology: The endpoint path uses "unpair" for backward compatibility, but the
 * operation is "remove co-supervisor" (project-specific, not a general unpairing).
 */

import { NextRequest } from 'next/server';
import { ProjectService } from '@/lib/services/projects/project-service';
import { withRoles } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';
import { validateRequest } from '@/lib/middleware/validation';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const removeCoSupervisorSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
}).strict();

export const POST = withRoles<Record<string, string>>(
  ['supervisor'],
  async (request: NextRequest, context, user) => {
    // Validate request body
    const validation = await validateRequest(request, removeCoSupervisorSchema);
    if (!validation.valid) {
      return ApiResponse.validationError(validation.error || 'Invalid request data');
    }

    const { projectId } = validation.data!;

    // Get project to verify supervisor has permission
    const project = await ProjectService.getProjectById(projectId);
    
    if (!project) {
      return ApiResponse.notFound('Project');
    }

    // Verify user is the project supervisor or co-supervisor
    if (project.supervisorId !== user.uid && project.coSupervisorId !== user.uid) {
      return ApiResponse.forbidden('You can only remove co-supervisor from your own projects');
    }

    // Remove co-supervisor from project
    const result = await ProjectService.updateProject(projectId, {
      coSupervisorId: undefined,
      coSupervisorName: undefined
    });

    if (!result.success) {
      return ApiResponse.error(result.error || 'Failed to remove co-supervisor', 400);
    }

    return ApiResponse.successMessage('Co-supervisor removed successfully');
  }
);

