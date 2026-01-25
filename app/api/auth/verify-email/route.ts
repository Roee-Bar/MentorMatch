/**
 * POST /api/auth/verify-email
 * GET /api/auth/verify-email?token=xxx
 * 
 * Email verification endpoints
 */

import { NextRequest } from 'next/server';
import { ApiResponse } from '@/lib/middleware/response';
import { logger } from '@/lib/logger';
import { EmailVerificationService } from '@/lib/services/email-verification-service';
import { EmailService } from '@/lib/services/email-service';
import { adminAuth } from '@/lib/firebase-admin';

const SERVICE_NAME = 'VerifyEmailAPI';

/**
 * GET /api/auth/verify-email?token=xxx
 * Verifies email using custom token
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return ApiResponse.validationError('Verification token is required');
    }

    const result = await EmailVerificationService.verifyToken(token);

    if (result.success) {
      return ApiResponse.success({ verified: true, message: 'Email verified successfully!' });
    } else {
      return ApiResponse.error(result.error || 'Verification failed', 400);
    }

  } catch (error: any) {
    logger.service.error(SERVICE_NAME, 'verifyEmail', error);
    return ApiResponse.error('Email verification failed. Please try again.', 500);
  }
}

/**
 * POST /api/auth/verify-email
 * Resends verification email
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return ApiResponse.validationError('Email is required');
    }

    // Get user by email
    let userRecord;
    try {
      userRecord = await adminAuth.getUserByEmail(email);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        return ApiResponse.error('User not found', 404);
      }
      throw error;
    }

    // Check if already verified
    if (userRecord.emailVerified) {
      return ApiResponse.error('Email is already verified', 400);
    }

    // Generate new verification token
    const verificationToken = await EmailVerificationService.createVerificationToken(
      userRecord.uid,
      email
    );

    // Get first name from display name or use 'User'
    const firstName = userRecord.displayName?.split(' ')[0] || 'User';

    // Send verification email
    const emailResult = await EmailService.sendVerificationEmail(
      email,
      firstName,
      verificationToken
    );

    if (!emailResult.success) {
      logger.service.error(SERVICE_NAME, 'resendVerification', 
        new Error('Failed to send email'), { email });
      return ApiResponse.error('Failed to send verification email', 500);
    }

    logger.service.success(SERVICE_NAME, 'resendVerification', { email });

    return ApiResponse.successMessage('Verification email sent! Check your inbox.');

  } catch (error: any) {
    logger.service.error(SERVICE_NAME, 'resendVerification', error);
    return ApiResponse.error('Failed to send verification email', 500);
  }
}
