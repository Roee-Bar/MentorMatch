/**
 * POST /api/partnerships/request
 * 
 * Create a new partnership request
 * Phase 4: Includes duplicate request prevention
 */

import { NextRequest, NextResponse } from 'next/server';
import { StudentPartnershipService } from '@/lib/services/firebase-services.server';
import { verifyAuth } from '@/lib/middleware/auth';
import { validateRequest, partnershipRequestSchema } from '@/lib/middleware/validation';

export async function POST(request: NextRequest) {
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
    const validation = await validateRequest(request, partnershipRequestSchema);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { targetStudentId } = validation.data!;

    // Prevent self-partnership
    if (targetStudentId === userId) {
      return NextResponse.json(
        { error: 'You cannot send a partnership request to yourself' },
        { status: 400 }
      );
    }

    // Create partnership request (includes duplicate detection in service layer)
    const requestId = await StudentPartnershipService.createPartnershipRequest(
      userId,
      targetStudentId
    );

    return NextResponse.json({
      success: true,
      message: 'Partnership request sent successfully',
      data: { requestId },
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error in POST /api/partnerships/request:', error);
    
    // Extract error message (includes duplicate detection messages)
    let errorMessage = error.message || 'Internal server error';
    let statusCode = 500;

    if (error.message?.includes('already have a pending request')) {
      statusCode = 400;
    } else if (error.message?.includes('already sent you a request')) {
      statusCode = 400;
    } else if (error.message?.includes('not found')) {
      statusCode = 404;
    } else if (error.message?.includes('already paired')) {
      statusCode = 400;
    } else if (error.message?.includes('cannot send a request') || error.message?.includes('cannot receive requests')) {
      statusCode = 400;
    }

    return NextResponse.json({
      success: false,
      error: errorMessage,
    }, { status: statusCode });
  }
}

