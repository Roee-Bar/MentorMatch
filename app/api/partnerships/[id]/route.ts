/**
 * DELETE /api/partnerships/[id]
 * 
 * Cancel a partnership request (by requester only)
 * 
 * Authorization: Requester owns the partnership request
 * Note: Uses manual auth to verify ownership after fetching resource
 */

import { NextRequest, NextResponse } from 'next/server';
import { StudentPartnershipService } from '@/lib/services/firebase-services.server';
import { verifyAuth } from '@/lib/middleware/auth';
import { ApiResponse, AuthMessages } from '@/lib/middleware/response';

export async function DELETE(
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
    const requestId = params.id;

    // Get the partnership request to verify ownership
    const partnershipRequest = await StudentPartnershipService.getPartnershipRequest(requestId);
    
    if (!partnershipRequest) {
      return ApiResponse.notFound('Partnership request');
    }

    // Verify the authenticated user is the requester
    if (partnershipRequest.requesterId !== userId) {
      return ApiResponse.forbidden(AuthMessages.NO_PERMISSION);
    }

    // Cancel the partnership request
    await StudentPartnershipService.cancelPartnershipRequest(requestId, userId);

    return ApiResponse.successMessage('Partnership request cancelled successfully');

  } catch (error: any) {
    console.error('Error in DELETE /api/partnerships/[id]:', error);
    
    let errorMessage = error.message || 'Internal server error';
    let statusCode = 500;

    if (error.message?.includes('not found')) {
      errorMessage = 'Partnership request not found';
      statusCode = 404;
    } else if (error.message?.includes('Unauthorized')) {
      statusCode = 403;
    } else if (error.message?.includes('Can only cancel pending requests')) {
      errorMessage = 'Can only cancel pending requests';
      statusCode = 400;
    }

    return ApiResponse.error(errorMessage, statusCode);
  }
}

