/**
 * PATCH /api/applications/[id]/status
 * 
 * Update application status (supervisor/admin only)
 * 
 * Authorization: Application supervisor or admin
 * Note: Uses manual auth to delegate complex workflow validation to service layer
 */

import { NextRequest, NextResponse } from 'next/server';
import { ApplicationService } from '@/lib/services/firebase-services.server';
import { ApplicationWorkflowService } from '@/lib/services/applications/application-workflow';
import { verifyAuth } from '@/lib/middleware/auth';
import { validateRequest, updateApplicationStatusSchema } from '@/lib/middleware/validation';
import { ApiResponse, AuthMessages } from '@/lib/middleware/response';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated || !authResult.user) {
      return ApiResponse.unauthorized();
    }

    const application = await ApplicationService.getApplicationById(params.id);
    
    if (!application) {
      return ApiResponse.notFound('Application not found. It may have been deleted.');
    }

    // Only the supervisor or admin can update status
    const isSupervisor = authResult.user.uid === application.supervisorId;
    const isAdmin = authResult.user.role === 'admin';

    if (!isSupervisor && !isAdmin) {
      return ApiResponse.forbidden(AuthMessages.NO_PERMISSION_UPDATE);
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
      authResult.user.uid,
      authResult.user.role as 'admin' | 'supervisor' | 'student' | undefined
    );

    if (!result.success) {
      return ApiResponse.error(result.error || 'Failed to update application', 400);
    }

    return ApiResponse.successMessage('Application status updated successfully');

  } catch (error: any) {
    console.error('Error in PATCH /api/applications/[id]/status:', error);
    return ApiResponse.error(error.message || 'Internal server error', 500);
  }
}

