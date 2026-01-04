/**
 * POST /api/auth/resend-verification
 * 
 * Resend email verification endpoint - allows authenticated users to request a new verification email
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/middleware/auth';
import { ApiResponse } from '@/lib/middleware/response';
import { EmailVerificationService } from '@/lib/services/auth/email-verification-service';
import { userRepository } from '@/lib/repositories/user-repository';
import { rateLimitService } from '@/lib/middleware/rate-limit';
import { logger } from '@/lib/logger';
import { SUCCESS_MESSAGES } from '@/lib/constants/error-messages';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/resend-verification
 * Resend verification email to the authenticated user
 */
export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const authResult = await verifyAuth(request);
    
    if (!authResult.authenticated || !authResult.user) {
      return ApiResponse.unauthorized();
    }

    const userId = authResult.user.uid;
    const email = authResult.user.email;

    if (!email) {
      return ApiResponse.error('User email not found', 400);
    }

    // Check rate limit (3 requests per hour)
    const rateLimitResult = await rateLimitService.checkRateLimit(
      userId,
      '/api/auth/resend-verification'
    );

    if (!rateLimitResult.allowed) {
      const response = NextResponse.json(
        {
          success: false,
          error: 'Too many requests. Please wait before requesting another verification email.',
        },
        { status: 429 }
      );
      
      // Add rate limit headers
      if (rateLimitResult.retryAfter) {
        response.headers.set('Retry-After', rateLimitResult.retryAfter.toString());
      }
      if (rateLimitResult.remaining !== undefined) {
        response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
      }
      if (rateLimitResult.count !== undefined) {
        response.headers.set('X-RateLimit-Limit', '3');
        response.headers.set('X-RateLimit-Used', rateLimitResult.count.toString());
      }

      logger.warn('Rate limit exceeded for resend verification', {
        context: 'ResendVerification',
        data: { userId, email, retryAfter: rateLimitResult.retryAfter },
      });

      return response;
    }

    // Check if email is already verified (use value from auth result if available)
    const isVerified = authResult.user.emailVerified ?? false;
    
    // Only make additional call if not available from auth result
    if (!isVerified && authResult.user.emailVerified === undefined) {
      const verifiedStatus = await EmailVerificationService.isEmailVerified(userId);
      if (verifiedStatus) {
        return ApiResponse.success(
          { message: 'Email is already verified' },
          'Email already verified'
        );
      }
    } else if (isVerified) {
      return ApiResponse.success(
        { message: 'Email is already verified' },
        'Email already verified'
      );
    }

    // Get user profile to get display name
    const userProfile = await userRepository.findById(userId);
    const displayName = userProfile?.name || email;

    // Log resend request metric
    EmailVerificationService.logResendRequest({ userId, email });

    // Send verification email
    await EmailVerificationService.sendVerificationEmail(
      userId,
      email,
      displayName
    );

    logger.info('Verification email resent successfully', {
      context: 'ResendVerification',
      data: { userId, email },
    });

    // Add rate limit headers to successful response
    const response = ApiResponse.success(
      { message: SUCCESS_MESSAGES.VERIFICATION_EMAIL_SENT },
      'Verification email sent'
    );

    if (rateLimitResult.remaining !== undefined) {
      response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    }
    if (rateLimitResult.count !== undefined) {
      response.headers.set('X-RateLimit-Limit', '3');
      response.headers.set('X-RateLimit-Used', rateLimitResult.count.toString());
    }

    return response;
  } catch (error: any) {
    logger.error('Error resending verification email', error, {
      context: 'ResendVerification',
    });
    return ApiResponse.error(
      error.message || 'Failed to resend verification email. Please try again later.',
      500
    );
  }
}

