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
import { applicationService } from '@/lib/services/applications/application-service';
import { canAccessApplication, canModifyApplication } from '@/lib/services/applications/application-auth';
import { withAuth } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';
import { validateAndExtract, handleValidationError } from '@/lib/middleware/validation-helpers';
import { handleServiceResult } from '@/lib/middleware/service-result-handler';
import { updateApplicationSchema } from '@/lib/middleware/validation';
import { adminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { supervisorRepository } from '@/lib/repositories/supervisor-repository';
import { applicationRepository } from '@/lib/repositories/application-repository';
import type { ApplicationIdParams } from '@/types/api';
import type { Application, UserRole } from '@/types/database';
import type { Transaction } from 'firebase-admin/firestore';

// Type guard for Transaction
function isTransaction(obj: any): obj is Transaction {
  return obj && typeof obj.get === 'function' && typeof obj.set === 'function';
}

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
      return await applicationService.getApplicationById(params.id);
    },
    requireResourceAccess: async (user, context, application) => {
      return canAccessApplication(user.uid, application, user.role as UserRole);
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

    try {
      // Validate request body
      const validatedData = await validateAndExtract(request, updateApplicationSchema);

      // Prepare update data
      const updateData = {
        projectTitle: validatedData.projectTitle,
        projectDescription: validatedData.projectDescription,
        isOwnTopic: validatedData.isOwnTopic,
        proposedTopicId: validatedData.proposedTopicId,
        studentSkills: validatedData.studentSkills,
        studentInterests: validatedData.studentInterests,
        hasPartner: validatedData.hasPartner,
        partnerName: validatedData.partnerName,
        partnerEmail: validatedData.partnerEmail,
      };

      // Update the application
      const result = await applicationService.updateApplication(params.id, updateData);

      // Handle service result errors
      const errorResponse = handleServiceResult(result, 'Failed to update application');
      if (errorResponse) return errorResponse;
      
      return ApiResponse.success({ message: 'Application updated successfully' });
    } catch (error) {
      const validationResponse = handleValidationError(error);
      if (validationResponse) return validationResponse;
      throw error;
    }
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
      try {
        await adminDb.runTransaction(async (transaction) => {
          const supervisorRef = supervisorRepository.getDocumentRef(application.supervisorId);
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
          const applicationRef = applicationRepository.getDocumentRef(params.id);
          transaction.delete(applicationRef);
        });
      } catch (error) {
        logger.error('Transaction failed while deleting approved application', error, {
          context: 'API',
          data: {
            applicationId: params.id,
            supervisorId: application.supervisorId
          }
        });
        return ApiResponse.error('Failed to delete application', 500);
      }
    } else {
      // No capacity change needed - delete normally
      const result = await applicationService.deleteApplication(params.id);

      const errorResponse = handleServiceResult(result, 'Failed to delete application');
      if (errorResponse) return errorResponse;
    }

    return ApiResponse.success({ message: 'Application deleted successfully' });
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
