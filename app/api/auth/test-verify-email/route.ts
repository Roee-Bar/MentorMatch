/**
 * GET /api/auth/test-verify-email
 * 
 * Test mode endpoint to verify email addresses using test database.
 * This endpoint works with the in-memory test database instead of requiring
 * Firebase Auth SDK functions that don't work in test mode.
 * Only available in test mode.
 */

import { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { ApiResponse } from '@/lib/middleware/response';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Only allow in test mode
  const isTestEnv = process.env.NODE_ENV === 'test' || process.env.E2E_TEST === 'true';
  if (!isTestEnv) {
    return ApiResponse.error('Test verify email endpoint only available in test mode', 403);
  }

  try {
    const { searchParams } = new URL(request.url);
    const oobCode = searchParams.get('oobCode');
    const mode = searchParams.get('mode');

    // Validate required parameters
    if (mode !== 'verifyEmail' || !oobCode) {
      return ApiResponse.error('Invalid verification parameters', 400);
    }

    // In test mode, verification codes are in format: test-verification-code-{uid}-{timestamp}
    // Parse the code to extract UID
    // Handle invalid/expired codes for testing
    if (!oobCode.startsWith('test-verification-code-')) {
      // Check if it's a test expired code
      if (oobCode.includes('expired') || oobCode === 'invalid-expired-code') {
        return ApiResponse.error('Verification link has expired', 400);
      }
      return ApiResponse.error('Invalid verification code format', 400);
    }

    const codeParts = oobCode.replace('test-verification-code-', '').split('-');
    if (codeParts.length < 2) {
      return ApiResponse.error('Invalid verification code format', 400);
    }

    // Extract UID (everything except the last part which is timestamp)
    const uid = codeParts.slice(0, -1).join('-');
    const timestamp = parseInt(codeParts[codeParts.length - 1], 10);

    // Check if code is expired (1 hour = 3600000ms)
    const codeAge = Date.now() - timestamp;
    if (codeAge > 3600000) {
      return ApiResponse.error('Verification link has expired', 400);
    }

    // Get user by UID
    let userRecord;
    try {
      userRecord = await adminAuth.getUser(uid);
    } catch (error: any) {
      if (error.message?.includes('not found')) {
        return ApiResponse.error('User not found', 404);
      }
      throw error;
    }

    // Check if already verified
    if (userRecord.emailVerified) {
      return ApiResponse.success({
        verified: true,
        email: userRecord.email,
        message: 'Email already verified',
        alreadyVerified: true,
      });
    }

    // Update user's emailVerified status
    await adminAuth.updateUser(uid, {
      emailVerified: true,
    });

    logger.info('Email verified successfully in test mode', {
      context: 'TestVerifyEmail',
      data: { userId: uid, email: userRecord.email },
    });

    return ApiResponse.success({
      verified: true,
      email: userRecord.email,
      message: 'Email verified successfully',
      alreadyVerified: false,
    });
  } catch (error: any) {
    logger.error('Error verifying email in test mode', error, {
      context: 'TestVerifyEmail',
    });
    return ApiResponse.error(error.message || 'Failed to verify email', 500);
  }
}

