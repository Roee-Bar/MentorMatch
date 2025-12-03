/**
 * POST /api/partnerships/unpair
 * 
 * Unpair from current partner
 * Phase 3: Includes application synchronization
 */

import { NextRequest, NextResponse } from 'next/server';
import { StudentPartnershipService, StudentService } from '@/lib/services/firebase-services.server';
import { verifyAuth } from '@/lib/middleware/auth';

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

    // Verify user is a student by role check
    if (authResult.user?.role !== 'student') {
      return NextResponse.json(
        { error: 'Only students can unpair from partners' },
        { status: 403 }
      );
    }

    // Get student document to retrieve partnerId
    const student = await StudentService.getStudentById(userId);
    
    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Validate student is currently paired
    if (!student.partnerId || student.partnershipStatus !== 'paired') {
      return NextResponse.json(
        { error: 'You are not currently paired with anyone' },
        { status: 400 }
      );
    }

    // Unpair students (includes application synchronization)
    await StudentPartnershipService.unpairStudents(userId, student.partnerId);

    return NextResponse.json({
      success: true,
      message: 'Successfully unpaired from your partner',
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error in POST /api/partnerships/unpair:', error);
    
    let errorMessage = error.message || 'Internal server error';
    let statusCode = 500;

    if (error.message?.includes('not found')) {
      errorMessage = 'Student or partner not found';
      statusCode = 404;
    } else if (error.message?.includes('not paired')) {
      errorMessage = 'You are not currently paired with anyone';
      statusCode = 400;
    }

    return NextResponse.json({
      success: false,
      error: errorMessage,
    }, { status: statusCode });
  }
}

