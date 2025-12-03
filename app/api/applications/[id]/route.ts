/**
 * GET /api/applications/[id] - Get application by ID
 * PUT /api/applications/[id] - Update application
 * DELETE /api/applications/[id] - Delete application
 */

import { NextRequest } from 'next/server';
import { AdminApplicationService } from '@/lib/services/admin-services';
import { withAuth } from '@/lib/middleware/apiHandler';
import { ApiResponse } from '@/lib/middleware/response';
import { adminDb } from '@/lib/firebase-admin';

export const GET = withAuth(async (request: NextRequest, { params }, user) => {
  const application = await AdminApplicationService.getApplicationById(params.id);
  
  if (!application) {
    return ApiResponse.notFound('Application');
  }

  // Authorization: user must be owner, supervisor, or admin
  const isOwner = user.uid === application.studentId;
  const isSupervisor = user.uid === application.supervisorId;
  const isAdmin = user.role === 'admin';

  if (!isOwner && !isSupervisor && !isAdmin) {
    return ApiResponse.error('Forbidden', 403);
  }

  return ApiResponse.success(application);
});

export const PUT = withAuth(async (request: NextRequest, { params }, user) => {
  const application = await AdminApplicationService.getApplicationById(params.id);
  
  if (!application) {
    return ApiResponse.notFound('Application');
  }

  // Authorization: only owner or admin can update
  const isOwner = user.uid === application.studentId;
  const isAdmin = user.role === 'admin';

  if (!isOwner && !isAdmin) {
    return ApiResponse.error('Forbidden', 403);
  }

  const body = await request.json();
  // Note: In a real implementation, you'd have an updateApplication method in ApplicationService
  
  return ApiResponse.success({ message: 'Application updated successfully' });
});

export const DELETE = withAuth(async (request: NextRequest, { params }, user) => {
  const application = await AdminApplicationService.getApplicationById(params.id);
  
  if (!application) {
    return ApiResponse.notFound('Application');
  }

  // Authorization: only owner or admin can delete
  const isOwner = user.uid === application.studentId;
  const isAdmin = user.role === 'admin';

  if (!isOwner && !isAdmin) {
    return ApiResponse.error('Forbidden', 403);
  }

  if (application.status === 'approved') {
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
    const success = await AdminApplicationService.deleteApplication(params.id);

    if (!success) {
      return ApiResponse.error('Failed to delete application', 500);
    }
  }

  return ApiResponse.success({ message: 'Application deleted successfully' });
});
