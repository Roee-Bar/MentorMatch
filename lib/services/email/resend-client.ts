/**
 * Resend Client Configuration
 * SERVER-ONLY: This file must ONLY be imported in API routes (server-side)
 * 
 * Handles Resend email client initialization and configuration.
 */

import { Resend } from 'resend';
import { logger } from '@/lib/logger';

const SERVICE_NAME = 'ResendClient';

// Default from email if not configured
const DEFAULT_FROM_EMAIL = 'onboarding@resend.dev';

// Validate API key and initialize Resend client conditionally
const hasApiKey = !!process.env.RESEND_API_KEY;
const isProduction = process.env.NODE_ENV === 'production';
const isVercel = process.env.VERCEL === '1';
const isProductionRuntime = isProduction && isVercel && process.env.CI !== 'true';

if (!hasApiKey) {
  if (isProductionRuntime) {
    // Fail fast in production runtime
    logger.error('CRITICAL: RESEND_API_KEY not configured in production', undefined, {
      context: SERVICE_NAME,
    });
  } else {
    // Warn in development/test
    logger.warn('RESEND_API_KEY not configured - email service will not function', {
      context: SERVICE_NAME,
    });
  }
}

// Initialize Resend client conditionally (only if API key exists)
export const resend = hasApiKey 
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Export configured from email
export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || DEFAULT_FROM_EMAIL;

/**
 * Check if Resend client is available
 */
export function isResendAvailable(): boolean {
  return resend !== null;
}

/**
 * Validate email service configuration for production
 * Throws error if critical configuration is missing in production
 */
export function validateEmailServiceConfig(): void {
  if (isProductionRuntime && !hasApiKey) {
    throw new Error('Email service is not configured. RESEND_API_KEY is required in production.');
  }
}

