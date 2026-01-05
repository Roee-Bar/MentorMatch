/**
 * GET /api/auth/verify-email
 * 
 * Email verification endpoint - handles verification status checks
 * Note: Firebase handles the actual verification when user clicks the link.
 * This endpoint is for checking verification status programmatically.
 */

import { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { ApiResponse } from '@/lib/middleware/response';
import { verifyAuth } from '@/lib/middleware/auth';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/verify-email
 * Check if the authenticated user's email is verified
 */
export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated
    const authResult = await verifyAuth(request);
    
    if (!authResult.authenticated || !authResult.user) {
      return ApiResponse.unauthorized();
    }

    // Get user's email verification status from Firebase Auth
    const userRecord = await adminAuth.getUser(authResult.user.uid);
    const isVerified = userRecord.emailVerified || false;

    return ApiResponse.success({
      verified: isVerified,
      email: userRecord.email,
    });
  } catch (error: any) {
    logger.error('Error checking email verification status', error, {
      context: 'VerifyEmail',
    });
    return ApiResponse.error(error.message || 'Failed to check verification status', 500);
  }
}

