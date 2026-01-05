/**
 * POST /api/auth/verify-email-metric
 * 
 * Endpoint for logging verification metrics from client-side
 * This allows the verification page (client component) to log metrics
 * without importing server-only services.
 */

import { NextRequest } from 'next/server';
import { ApiResponse } from '@/lib/middleware/response';
import { EmailVerificationService } from '@/lib/services/auth/email-verification-service';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/verify-email-metric
 * Log a verification metric
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { metric, email, userId, errorCode } = body;

    // Validate metric type
    const validMetrics = [
      'verification_attempted',
      'verification_succeeded',
      'verification_failed',
      'verification_expired',
      'verification_invalid',
    ];

    if (!validMetrics.includes(metric)) {
      return ApiResponse.error('Invalid metric type', 400);
    }

    // Log the metric using the service
    switch (metric) {
      case 'verification_attempted':
        EmailVerificationService.logVerificationAttempt({ email, userId });
        break;
      case 'verification_succeeded':
        EmailVerificationService.logVerificationSuccess({ email, userId });
        break;
      case 'verification_failed':
        if (!errorCode) {
          return ApiResponse.error('errorCode required for verification_failed', 400);
        }
        EmailVerificationService.logVerificationFailure({ email, userId, errorCode });
        break;
      case 'verification_expired':
        EmailVerificationService.logVerificationFailure({ email, userId, errorCode: 'auth/expired-action-code' });
        break;
      case 'verification_invalid':
        EmailVerificationService.logVerificationFailure({ email, userId, errorCode: 'auth/invalid-action-code' });
        break;
    }

    return ApiResponse.success({ message: 'Metric logged' });
  } catch (error: any) {
    logger.error('Error logging verification metric', error, {
      context: 'VerifyEmailMetric',
    });
    return ApiResponse.error(error.message || 'Failed to log metric', 500);
  }
}

