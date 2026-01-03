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
if (!process.env.RESEND_API_KEY) {
  logger.warn('RESEND_API_KEY not configured - email service will not function', {
    context: SERVICE_NAME,
  });
}

// Initialize Resend client conditionally (only if API key exists)
export const resend = process.env.RESEND_API_KEY 
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

