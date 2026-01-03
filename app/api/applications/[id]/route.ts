/**
 * GET /api/applications/[id] - Get application by ID
 * PUT /api/applications/[id] - Update application
 * DELETE /api/applications/[id] - Delete application
 * 
 * Authorization: 
 * GET - Application owner, supervisor, or admin
 * PUT/DELETE - Application owner or admin only
 */

import { NextRequest } from 'next/server';
import { ApplicationService } from '@/lib/services/applications/application-service';
import { canAccessApplication, canModifyApplication } from '@/lib/services/applications/application-auth';
import { withAuth } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';
import { validateBody, updateApplicationSchema } from '@/lib/middleware/validation';
import { adminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import type { ApplicationIdParams } from '@/types/api';
import type { Application } from '@/types/database';

export const GET = withAuth<ApplicationIdParams, Application>(
  async (request: NextRequest, { params, cachedResource }, user) => {
    const application = cachedResource;
    
    if (!application) {
      return ApiResponse.notFound('Application');
    }

    return ApiResponse.success(application);
  },
  { 
    resourceName: 'Application',
    resourceLoader: async (params) => {
      return await ApplicationService.getApplicationById(params.id);
    },
    requireResourceAccess: async (user, context, application) => {
      return canAccessApplication(user.uid, application, user.role);
    }
  }
);

export const PUT = withAuth<ApplicationIdParams, Application>(
  async (request: NextRequest, { params, cachedResource }, user) => {
    const application = cachedResource;
    
    if (!application) {
      return ApiResponse.notFound('Application');
    }

    // Can only edit if status is 'revision_requested'
    if (application.status !== 'revision_requested') {
      logger.warn('Application edit attempt with wrong status', {
        context: 'API',
        data: {
          applicationId: params.id,
          userId: user.uid,
          currentStatus: application.status
        }
      });
      return ApiResponse.error('Application can only be edited when in revision_requested status', 400);
    }

    const body = await request.json();
    const validation = validateBody(body, updateApplicationSchema);

    if (!validation.valid || !validation.data) {
      return ApiResponse.validationError(validation.error || 'Invalid application data');
    }

    // Prepare update data
    const updateData = {
      projectTitle: validation.data.projectTitle,
      projectDescription: validation.data.projectDescription,
      isOwnTopic: validation.data.isOwnTopic,
      proposedTopicId: validation.data.proposedTopicId,
      studentSkills: validation.data.studentSkills,
      studentInterests: validation.data.studentInterests,
      hasPartner: validation.data.hasPartner,
      partnerName: validation.data.partnerName,
      partnerEmail: validation.data.partnerEmail,
    };

    // Update the application
    const result = await ApplicationService.updateApplication(params.id, updateData);

    if (!result.success) {
      return ApiResponse.error(result.error || 'Failed to update application', 500);
    }
    
    return ApiResponse.success({ message: 'Application updated successfully' });
  },
  { 
    resourceName: 'Application',
    resourceLoader: async (params) => {
      return await ApplicationService.getApplicationById(params.id);
    },
    requireResourceAccess: async (user, context, application) => {
      return canModifyApplication(user.uid, application, user.role);
    }
  }
);

export const DELETE = withAuth<ApplicationIdParams, Application>(
  async (request: NextRequest, { params, cachedResource }, user) => {
    const application = cachedResource;
    
    if (!application) {
      return ApiResponse.notFound('Application');
    }

    if (application.status === 'approved') {
      logger.info('Deleting approved application with capacity adjustment', {
        context: 'API',
        data: {
          applicationId: params.id,
          supervisorId: application.supervisorId
        }
      });
      // Use transaction to ensure atomicity when updating supervisor capacity
      await adminDb.runTransaction(async (transaction) => {
        const supervisorRef = adminDb.collection('supervisors').doc(application.supervisorId);
        const supervisorSnap = await transaction.get(supervisorRef);

        if (supervisorSnap.exists) {
          const supervisorData = supervisorSnap.data();
          const currentCapacity = supervisorData?.currentCapacity || 0;
          const newCapacity = Math.max(0, currentCapacity - 1);

          transaction.update(supervisorRef, {
            currentCapacity: newCapacity,
            updatedAt: new Date()
          });
        }

        // Delete application
        const applicationRef = adminDb.collection('applications').doc(params.id);
        transaction.delete(applicationRef);
      });
    } else {
      // No capacity change needed - delete normally
      const result = await ApplicationService.deleteApplication(params.id);

      if (!result.success) {
        return ApiResponse.error(result.error || 'Failed to delete application', 500);
      }
    }

    return ApiResponse.success({ message: 'Application deleted successfully' });
  },
  { 
    resourceName: 'Application',
    resourceLoader: async (params) => {
      return await ApplicationService.getApplicationById(params.id);
    },
    requireResourceAccess: async (user, context, application) => {
      return canModifyApplication(user.uid, application, user.role);
    }
  }
);
