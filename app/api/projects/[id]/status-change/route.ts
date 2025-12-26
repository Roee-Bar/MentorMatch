/**
 * POST /api/projects/[id]/status-change
 * 
 * Handle project status changes and automatically manage partnership cleanup
 * 
 * Authorization: Project supervisor or admin only
 */

import { NextRequest } from 'next/server';
import { ProjectService } from '@/lib/services/projects/project-service';
import { withAuth } from '@/lib/middleware/apiHandler';
import { validateRequest } from '@/lib/middleware/validation';
import { ApiResponse } from '@/lib/middleware/response';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import type { ProjectIdParams } from '@/types/api';

const projectStatusChangeSchema = z.object({
  status: z.enum(['pending_approval', 'approved', 'in_progress', 'completed'], {
    message: 'Invalid project status'
  }),
}).strict();

export const POST = withAuth<ProjectIdParams>(async (request: NextRequest, { params }, user) => {
  const projectId = params.id;

  // Validate request body
  const validation = await validateRequest(request, projectStatusChangeSchema);
  if (!validation.valid) {
    return ApiResponse.validationError(validation.error || 'Invalid request data');
  }

  const { status } = validation.data!;

  // Get project to verify permissions
  const project = await ProjectService.getProjectById(projectId);
  if (!project) {
    return ApiResponse.notFound('Project');
  }

  // Verify user has permission (project supervisor or admin)
  if (user.role !== 'admin' && project.supervisorId !== user.uid) {
    logger.warn('Unauthorized project status change attempt', {
      context: 'API',
      data: { userId: user.uid, projectId, requestedStatus: status }
    });
    return ApiResponse.forbidden('Only the project supervisor or admin can change project status');
  }

  // Handle status change (includes partnership cleanup if status is 'completed')
  const result = await ProjectService.handleProjectStatusChange(projectId, status);

  if (!result.success) {
    return ApiResponse.error(result.error || 'Failed to update project status', 400);
  }

  return ApiResponse.successMessage('Project status updated successfully');
});

