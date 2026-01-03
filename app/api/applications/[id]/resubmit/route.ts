/**
 * POST /api/applications/[id]/resubmit
 * 
 * Resubmit an application after revision (student only)
 * Transitions status from 'revision_requested' to 'pending'
 * 
 * Authorization: Application owner (student)
 */

import { NextRequest } from 'next/server';
import { applicationService } from '@/lib/services/applications/application-service';
import { ApplicationWorkflowService } from '@/lib/services/applications/application-workflow';
import { canModifyApplication } from '@/lib/services/applications/application-auth';
import { withAuth } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';
import { logger } from '@/lib/logger';
import type { ApplicationIdParams } from '@/types/api';
import type { Application, UserRole } from '@/types/database';

export const POST = withAuth<ApplicationIdParams, Application>(
  async (request: NextRequest, { params, cachedResource }, user) => {
    const application = cachedResource;
    
    if (!application) {
      return ApiResponse.notFound('Application');
    }

    const result = await ApplicationWorkflowService.resubmitApplication(
      params.id,
      user.uid
    );

    if (!result.success) {
      return ApiResponse.error(result.error || 'Failed to resubmit application', 400);
    }

    return ApiResponse.successMessage(result.message || 'Application resubmitted successfully');
  },
  {
    resourceName: 'Application',
    resourceLoader: async (params) => {
      return await applicationService.getApplicationById(params.id);
    },
    requireResourceAccess: async (user, context, application) => {
      return canModifyApplication(user.uid, application, user.role as UserRole);
    }
  }
);

