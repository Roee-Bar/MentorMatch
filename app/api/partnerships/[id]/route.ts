/**
 * DELETE /api/partnerships/[id]
 * 
 * Cancel a partnership request (by requester only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { StudentPartnershipService } from '@/lib/services/firebase-services.server';
import { verifyAuth } from '@/lib/middleware/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = authResult.user?.uid;
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found' },
        { status: 401 }
      );
    }

    const requestId = params.id;

    // Get the partnership request to verify ownership
    const partnershipRequest = await StudentPartnershipService.getPartnershipRequest(requestId);
    
    if (!partnershipRequest) {
      return NextResponse.json(
        { error: 'Partnership request not found' },
        { status: 404 }
      );
    }

    // Verify the authenticated user is the requester
    if (partnershipRequest.requesterId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized to cancel this request' },
        { status: 403 }
      );
    }

    // Cancel the partnership request
    await StudentPartnershipService.cancelPartnershipRequest(requestId, userId);

    return NextResponse.json({
      success: true,
      message: 'Partnership request cancelled successfully',
    }, { status: 200 });

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

    return NextResponse.json({
      success: false,
      error: errorMessage,
    }, { status: statusCode });
  }
}

