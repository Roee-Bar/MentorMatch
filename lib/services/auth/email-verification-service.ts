/**
 * Email Verification Service
 * SERVER-ONLY: This file must ONLY be imported in API routes (server-side)
 * 
 * Handles email verification using Firebase Auth's built-in verification system
 * with custom email templates for better UX.
 */

import { adminAuth } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { EmailService } from '@/lib/services/email/email-service';
import { generateVerificationEmailHTML } from '@/lib/services/email/templates';

const SERVICE_NAME = 'EmailVerificationService';

// ============================================
// METRICS TYPES
// ============================================

type VerificationMetric = 
  | 'verification_email_sent'
  | 'verification_attempted'
  | 'verification_succeeded'
  | 'verification_failed'
  | 'verification_expired'
  | 'verification_invalid'
  | 'verification_already_verified'
  | 'resend_requested';

interface MetricData {
  userId?: string;
  email?: string;
  errorCode?: string;
  [key: string]: unknown;
}

// ============================================
// METRICS HELPERS
// ============================================

/**
 * Log verification metric
 */
function logMetric(metric: VerificationMetric, data?: MetricData): void {
  logger.info(`Metric: ${metric}`, {
    context: SERVICE_NAME,
    data: {
      metric,
      timestamp: new Date().toISOString(),
      ...data,
    },
  });
}

// ============================================
// CONFIGURATION VALIDATION
// ============================================

/**
 * Validate email verification configuration
 * Ensures required environment variables are set in production
 */
function validateEmailVerificationConfig(): void {
  if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_APP_URL) {
    const error = new Error(
      'NEXT_PUBLIC_APP_URL is required in production for email verification. ' +
      'Please set this environment variable to your production domain.'
    );
    logger.error('Email verification configuration error', error, {
      context: SERVICE_NAME,
    });
    throw error;
  }
}

// Validate configuration on module load (production only)
if (process.env.NODE_ENV === 'production') {
  validateEmailVerificationConfig();
}

// ============================================
// EMAIL VERIFICATION SERVICE
// ============================================

export const EmailVerificationService = {
  /**
   * Generate email verification link and send verification email
   * @param userId - Firebase user ID
   * @param email - User's email address
   * @param name - User's display name
   * @returns Promise that resolves when email is sent
   */
  async sendVerificationEmail(
    userId: string,
    email: string,
    name: string
  ): Promise<void> {
    try {
      // Validate configuration before proceeding
      validateEmailVerificationConfig();
      
      // Get base URL from environment variable
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      
      // Generate Firebase email verification link
      // This creates a secure, time-limited verification link
      const actionCodeSettings = {
        url: `${baseUrl}/verify-email`,
        handleCodeInApp: false, // Open link in browser, not app
      };

      const verificationLink = await adminAuth.generateEmailVerificationLink(
        email,
        actionCodeSettings
      );

      // Generate email HTML using custom template
      const html = generateVerificationEmailHTML(name, verificationLink);

      // Send email using critical email mode (throws on failure)
      await EmailService.sendCriticalEmail(
        { email, name },
        'Verify your MentorMatch email address',
        html,
        { userId }
      );

      // Log metrics
      logMetric('verification_email_sent', { userId, email });

      logger.info('Verification email sent successfully', {
        context: SERVICE_NAME,
        data: { userId, email },
      });
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'sendVerificationEmail', error, {
        userId,
        email,
      });
      throw error;
    }
  },

  /**
   * Check if user's email is verified
   * @param userId - Firebase user ID
   * @returns Promise that resolves to true if email is verified
   */
  async isEmailVerified(userId: string): Promise<boolean> {
    try {
      const userRecord = await adminAuth.getUser(userId);
      return userRecord.emailVerified || false;
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'isEmailVerified', error, {
        userId,
      });
      return false;
    }
  },

  /**
   * Log verification attempt metric
   * Call this when a verification link is clicked
   */
  logVerificationAttempt(data: { userId?: string; email?: string; errorCode?: string }): void {
    logMetric('verification_attempted', data);
  },

  /**
   * Log verification success metric
   */
  logVerificationSuccess(data: { userId?: string; email?: string }): void {
    logMetric('verification_succeeded', data);
  },

  /**
   * Log verification failure metric
   */
  logVerificationFailure(data: { userId?: string; email?: string; errorCode: string }): void {
    logMetric('verification_failed', data);
    
    // Also log specific failure types
    if (data.errorCode === 'auth/expired-action-code') {
      logMetric('verification_expired', data);
    } else if (data.errorCode === 'auth/invalid-action-code') {
      logMetric('verification_invalid', data);
    }
  },

  /**
   * Log resend request metric
   */
  logResendRequest(data: { userId?: string; email?: string }): void {
    logMetric('resend_requested', data);
  },
};

