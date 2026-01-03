/**
 * POST /api/projects/[id]/status-change
 * 
 * Handle project status changes
 * When project completes, automatically cleanup partnerships
 * 
 * Authorization: Supervisor/Admin
 */

import { NextRequest } from 'next/server';
import { SupervisorPartnershipPairingService } from '@/lib/services/supervisor-partnerships/supervisor-partnership-pairing';
import { withAuth } from '@/lib/middleware/apiHandler';
import { validateAndExtract, handleValidationError } from '@/lib/middleware/validation-helpers';
import { projectStatusChangeSchema } from '@/lib/middleware/validation';
import { ApiResponse } from '@/lib/middleware/response';
import { verifyProjectAccess } from '@/lib/middleware/authorization-helpers';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/lib/constants/error-messages';
import { logger } from '@/lib/logger';
import { projectRepository } from '@/lib/repositories/project-repository';
import type { ProjectIdParams } from '@/types/api';
import type { Project } from '@/types/database';

export const POST = withAuth<ProjectIdParams>(
  async (request: NextRequest, { params }, user) => {
    try {
      // Validate request body
      const { status } = await validateAndExtract(
        request,
        projectStatusChangeSchema
      );

      const projectId = params.id;

      // Verify user has access to project
      const authResult = await verifyProjectAccess(
        projectId,
        user.uid,
        user.role,
        ['supervisor', 'admin']
      );

      if (!authResult.authorized || !authResult.resource) {
        return authResult.error || ApiResponse.forbidden(ERROR_MESSAGES.UNAUTHORIZED_CHANGE_STATUS);
      }

      const project = authResult.resource;

      // Update project status
      await projectRepository.update(projectId, {
        status,
        ...(status === 'completed' && { completedAt: new Date() }),
      } as Partial<Project>);

      // If project is being completed, cleanup partnerships
      if (status === 'completed' && project.coSupervisorId) {
        const cleanupResult = await SupervisorPartnershipPairingService.cleanupPartnershipsOnProjectCompletion(projectId);
        
        if (!cleanupResult.success) {
          // Log error but don't fail the request - status change succeeded
          logger.service.error('ProjectStatusChange', 'cleanupPartnerships', cleanupResult.error, { projectId });
        }
      }

      return ApiResponse.successMessage(SUCCESS_MESSAGES.PROJECT_STATUS_UPDATED);
    } catch (error) {
      const validationResponse = handleValidationError(error);
      if (validationResponse) return validationResponse;
      throw error;
    }
  },
  { allowedRoles: ['supervisor', 'admin'] }
);

