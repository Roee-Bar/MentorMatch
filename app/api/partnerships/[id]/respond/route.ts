/**
 * POST /api/partnerships/[id]/respond
 * 
 * Respond to a partnership request (accept or reject)
 * Phase 7.2: Enhanced error messages for partnership operations
 * 
 * Authorization: Target student of the partnership request
 * Note: Uses manual auth to verify target ownership after fetching resource
 */

import { NextRequest, NextResponse } from 'next/server';
import { StudentPartnershipService } from '@/lib/services/firebase-services.server';
import { verifyAuth } from '@/lib/middleware/auth';
import { validateRequest, partnershipResponseSchema } from '@/lib/middleware/validation';
import { ApiResponse, AuthMessages } from '@/lib/middleware/response';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated || !authResult.user) {
      return ApiResponse.unauthorized();
    }

    const userId = authResult.user.uid;

    // Validate request body
    const validation = await validateRequest(request, partnershipResponseSchema);
    if (!validation.valid) {
      return ApiResponse.validationError(validation.error || 'Invalid request data');
    }

    const { action } = validation.data!;
    const requestId = params.id;

    // Get the partnership request to verify authorization
    const partnershipRequest = await StudentPartnershipService.getPartnershipRequest(requestId);
    
    if (!partnershipRequest) {
      return ApiResponse.notFound('Partnership request not found or has expired.');
    }

    // Verify the authenticated user is the target of the request
    if (partnershipRequest.targetStudentId !== userId) {
      return ApiResponse.forbidden(AuthMessages.NO_PERMISSION_RESPOND);
    }

    // Check if request has already been processed
    if (partnershipRequest.status !== 'pending') {
      return ApiResponse.error('This request has already been accepted/rejected.', 400);
    }

    // Call service method to respond to the request
    await StudentPartnershipService.respondToPartnershipRequest(
      requestId,
      userId,
      action
    );

    return ApiResponse.successMessage(
      action === 'accept' 
        ? 'Partnership accepted successfully' 
        : 'Partnership request rejected'
    );

  } catch (error: any) {
    console.error('Error in POST /api/partnerships/[id]/respond:', error);
    
    // Enhanced error messages per Phase 7.2
    let errorMessage = error.message || 'Internal server error';
    let statusCode = 500;

    if (error.message?.includes('already paired')) {
      errorMessage = 'Cannot accept request - you are already paired with another student. Please unpair first.';
      statusCode = 400;
    } else if (error.message?.includes('not found')) {
      errorMessage = 'Partnership request not found or has expired.';
      statusCode = 404;
    } else if (error.message?.includes('already processed') || error.message?.includes('no longer in pending state')) {
      errorMessage = 'This request has already been accepted/rejected.';
      statusCode = 400;
    }

    return ApiResponse.error(errorMessage, statusCode);
  }
}

