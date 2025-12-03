/**
 * POST /api/partnerships/[id]/respond
 * 
 * Respond to a partnership request (accept or reject)
 * Phase 7.2: Enhanced error messages for partnership operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { StudentPartnershipService } from '@/lib/services/firebase-services.server';
import { verifyAuth } from '@/lib/middleware/auth';
import { validateRequest, partnershipResponseSchema } from '@/lib/middleware/validation';

export async function POST(
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

    // Validate request body
    const validation = await validateRequest(request, partnershipResponseSchema);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { action } = validation.data!;
    const requestId = params.id;

    // Get the partnership request to verify authorization
    const partnershipRequest = await StudentPartnershipService.getPartnershipRequest(requestId);
    
    if (!partnershipRequest) {
      return NextResponse.json(
        { error: 'Partnership request not found or has expired.' },
        { status: 404 }
      );
    }

    // Verify the authenticated user is the target of the request
    if (partnershipRequest.targetStudentId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized to respond to this request' },
        { status: 403 }
      );
    }

    // Check if request has already been processed
    if (partnershipRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'This request has already been accepted/rejected.' },
        { status: 400 }
      );
    }

    // Call service method to respond to the request
    await StudentPartnershipService.respondToPartnershipRequest(
      requestId,
      userId,
      action
    );

    return NextResponse.json({
      success: true,
      message: action === 'accept' 
        ? 'Partnership accepted successfully' 
        : 'Partnership request rejected',
    }, { status: 200 });

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

    return NextResponse.json({
      success: false,
      error: errorMessage,
    }, { status: statusCode });
  }
}

