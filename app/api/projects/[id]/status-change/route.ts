/**
 * POST /api/projects/[id]/status-change
 * 
 * Handle project status changes
 * When project completes, automatically cleanup partnerships
 * 
 * Authorization: Supervisor/Admin
 */

import { NextRequest } from 'next/server';
import { ProjectService } from '@/lib/services/projects/project-service';
import { SupervisorPartnershipPairingService } from '@/lib/services/supervisor-partnerships/supervisor-partnership-pairing';
import { withAuth } from '@/lib/middleware/apiHandler';
import { validateRequest, projectStatusChangeSchema } from '@/lib/middleware/validation';
import { ApiResponse } from '@/lib/middleware/response';
import { adminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import type { ProjectIdParams } from '@/types/api';

export const POST = withAuth<ProjectIdParams>(
  async (request: NextRequest, { params }, user) => {
    // Validate request body
    const validation = await validateRequest(request, projectStatusChangeSchema);
    if (!validation.valid || !validation.data) {
      return ApiResponse.validationError(validation.error || 'Invalid request data');
    }

    const { status } = validation.data;
    const projectId = params.id;

    // Get project to verify ownership/authorization
    const project = await ProjectService.getProjectById(projectId);
    
    if (!project) {
      return ApiResponse.notFound('Project');
    }

    // Verify user is supervisor or admin
    const isSupervisor = project.supervisorId === user.uid || project.coSupervisorId === user.uid;
    const isAdmin = user.role === 'admin';

    if (!isSupervisor && !isAdmin) {
      return ApiResponse.forbidden('Unauthorized to change project status');
    }

    // Update project status
    await adminDb.collection('projects').doc(projectId).update({
      status,
      updatedAt: new Date(),
      ...(status === 'completed' && { completedAt: new Date() }),
    });

    // If project is being completed, cleanup partnerships
    if (status === 'completed' && project.coSupervisorId) {
      const cleanupResult = await SupervisorPartnershipPairingService.cleanupPartnershipsOnProjectCompletion(projectId);
      
      if (!cleanupResult.success) {
        // Log error but don't fail the request - status change succeeded
        logger.service.error('ProjectStatusChange', 'cleanupPartnerships', cleanupResult.error, { projectId });
      }
    }

    return ApiResponse.successMessage('Project status updated successfully');
  },
  { allowedRoles: ['supervisor', 'admin'] }
);

