/**
 * PATCH /api/applications/[id]/status
 * 
 * Update application status (supervisor/admin only)
 * 
 * Authorization: Application supervisor or admin
 */

import { NextRequest } from 'next/server';
import { ApplicationService } from '@/lib/services/firebase-services.server';
import { ApplicationWorkflowService } from '@/lib/services/applications/application-workflow';
import { withAuth } from '@/lib/middleware/apiHandler';
import { validateRequest, updateApplicationStatusSchema } from '@/lib/middleware/validation';
import { ApiResponse } from '@/lib/middleware/response';
import { logger } from '@/lib/logger';

export const PATCH = withAuth(
  async (request: NextRequest, { params, cachedResource }, user) => {
    const application = cachedResource;
    
    if (!application) {
      return ApiResponse.notFound('Application not found. It may have been deleted.');
    }

    // Validate request body
    const validation = await validateRequest(request, updateApplicationStatusSchema);
    if (!validation.valid) {
      return ApiResponse.validationError(validation.error || 'Invalid request data');
    }

    const { status, feedback } = validation.data!;

    // Delegate to workflow service
    const result = await ApplicationWorkflowService.updateApplicationStatus(
      params.id,
      status,
      feedback,
      user.uid,
      user.role as 'admin' | 'supervisor' | 'student' | undefined
    );

    if (!result.success) {
      logger.error('Application status update failed', undefined, {
        context: 'API',
        data: {
          applicationId: params.id,
          requestedStatus: status,
          error: result.error
        }
      });
      return ApiResponse.error(result.error || 'Failed to update application', 400);
    }

    return ApiResponse.successMessage('Application status updated successfully');
  },
  {
    resourceLoader: async (params) => {
      return await ApplicationService.getApplicationById(params.id);
    },
    requireResourceAccess: async (user, context, application) => {
      if (!application) return false;
      return user.uid === application.supervisorId || user.role === 'admin';
    }
  }
);

