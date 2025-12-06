/**
 * POST /api/partnerships/unpair
 * 
 * Unpair from current partner
 * Phase 3: Includes application synchronization
 * 
 * Authorization: Student role required
 * Note: Uses manual auth to validate student role before business logic
 */

import { NextRequest, NextResponse } from 'next/server';
import { StudentPartnershipService, StudentService } from '@/lib/services/firebase-services.server';
import { verifyAuth } from '@/lib/middleware/auth';
import { ApiResponse, AuthMessages } from '@/lib/middleware/response';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated || !authResult.user) {
      return ApiResponse.unauthorized();
    }

    const userId = authResult.user.uid;

    // Verify user is a student by role check
    if (authResult.user.role !== 'student') {
      return ApiResponse.insufficientRole(['student']);
    }

    // Get student document to retrieve partnerId
    const student = await StudentService.getStudentById(userId);
    
    if (!student) {
      return ApiResponse.notFound('Student');
    }

    // Validate student is currently paired
    if (!student.partnerId || student.partnershipStatus !== 'paired') {
      return ApiResponse.error('You are not currently paired with anyone', 400);
    }

    // Unpair students (includes application synchronization)
    await StudentPartnershipService.unpairStudents(userId, student.partnerId);

    return ApiResponse.successMessage('Successfully unpaired from your partner');

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

    return ApiResponse.error(errorMessage, statusCode);
  }
}

