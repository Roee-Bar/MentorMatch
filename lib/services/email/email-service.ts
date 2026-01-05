/**
 * Email Service
 * SERVER-ONLY: This file must ONLY be imported in API routes (server-side)
 * 
 * Handles email notifications using Resend for application-related events.
 */

import { logger } from '@/lib/logger';
import { escapeHtml } from '@/lib/utils/html-escape';
import { applicationService } from '@/lib/services/applications/application-service';
import { resend, FROM_EMAIL, isResendAvailable } from './resend-client';
import { getStatusMessage } from './email-config';
import { generateStatusChangeEmailHTML } from './templates';
import { getApplicationStatusChangeRecipients, type EmailRecipient } from '@/lib/services/shared/notification-helpers';
import { withEmailTimeout } from '@/lib/middleware/timeout';
import type { ApplicationStatusChangedEvent } from '@/lib/services/shared/events';

const SERVICE_NAME = 'EmailService';

// ============================================
// EMAIL VALIDATION
// ============================================

/**
 * Validate email format
 * @param email - Email address to validate
 * @returns true if email format is valid
 */
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// ============================================
// RETRY LOGIC
// ============================================

/**
 * Retry a function with exponential backoff
 * @param fn - Function to retry
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @returns Result of the function
 * @throws Last error if all retries fail
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error | unknown;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on certain errors (validation, auth, etc.)
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        if (
          errorMessage.includes('invalid') ||
          errorMessage.includes('unauthorized') ||
          errorMessage.includes('forbidden') ||
          errorMessage.includes('not found')
        ) {
          throw error;
        }
      }
      
      // If this is the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Calculate delay: 2^attempt seconds (2s, 4s, 8s)
      const delayMs = Math.pow(2, attempt) * 1000;
      
      logger.debug(`Email send attempt ${attempt} failed, retrying in ${delayMs}ms`, {
        context: SERVICE_NAME,
        data: { attempt, maxRetries, error: error instanceof Error ? error.message : String(error) },
      });
      
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  throw lastError;
}

// ============================================
// EMAIL SERVICE
// ============================================

export const EmailService = {
  /**
   * Send status change notification to all connected users except the triggerer
   */
  async sendStatusChangeNotification(
    event: ApplicationStatusChangedEvent,
    triggeredByUserId: string
  ): Promise<void> {
    try {
      // Skip if no triggeredByUserId provided
      if (!triggeredByUserId) {
        logger.debug('Skipping email notification: no triggeredByUserId provided', {
          context: SERVICE_NAME,
          data: { applicationId: event.applicationId },
        });
        return;
      }

      // Fetch application to get partnerId for accurate exclusion
      const application = await applicationService.getApplicationById(event.applicationId);
      if (!application) {
        logger.warn('Application not found for email notification', {
          context: SERVICE_NAME,
          data: { applicationId: event.applicationId },
        });
        return;
      }

      // Collect all connected users using helper function
      const recipients = await getApplicationStatusChangeRecipients(
        event,
        application,
        triggeredByUserId
      );

      // If no recipients, log and return
      if (recipients.length === 0) {
        logger.debug('No recipients for status change email notification', {
          context: SERVICE_NAME,
          data: {
            applicationId: event.applicationId,
            triggeredBy: triggeredByUserId,
          },
        });
        return;
      }

      // Send emails to all recipients in parallel
      const emailPromises = recipients.map(recipient =>
        this.sendStatusChangeEmail(recipient, event)
      );

      const results = await Promise.allSettled(emailPromises);

      // Log results
      const succeeded = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      logger.debug('Status change emails sent', {
        context: SERVICE_NAME,
        data: {
          applicationId: event.applicationId,
          recipientsCount: recipients.length,
          succeeded,
          failed,
          triggeredBy: triggeredByUserId,
        },
      });

      // Log detailed error information for failed emails
      if (failed > 0) {
        const failedRecipients: string[] = [];
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            const recipient = recipients[index];
            failedRecipients.push(recipient?.email || 'unknown');
            logger.error('Email send failed', result.reason, {
              context: SERVICE_NAME,
              data: {
                recipient: recipient?.email,
                recipientName: recipient?.name,
                applicationId: event.applicationId,
              },
            });
          }
        });

        logger.warn(`Some status change emails failed: ${failed} failed, ${succeeded} succeeded`, {
          context: SERVICE_NAME,
          data: {
            applicationId: event.applicationId,
            failedRecipients,
            succeeded,
            failed,
          },
        });
      }
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'sendStatusChangeNotification', error, {
        applicationId: event.applicationId,
        triggeredBy: triggeredByUserId,
      });
      // Don't throw - email failures shouldn't break the status update
    }
  },

  /**
   * Send individual status change email
   */
  async sendStatusChangeEmail(
    recipient: EmailRecipient,
    event: ApplicationStatusChangedEvent
  ): Promise<void> {
    // Check if Resend client is available
    if (!resend) {
      logger.warn('Cannot send email: RESEND_API_KEY not configured', {
        context: SERVICE_NAME,
        data: {
          recipient: recipient.email,
          applicationId: event.applicationId,
        },
      });
      return;
    }

    // Validate email format
    if (!validateEmail(recipient.email)) {
      logger.warn('Invalid email format, skipping send', {
        context: SERVICE_NAME,
        data: {
          recipient: recipient.email,
          applicationId: event.applicationId,
        },
      });
      return;
    }

    const statusInfo = getStatusMessage(event.newStatus);

    try {
      const html = generateStatusChangeEmailHTML(recipient.name, event, statusInfo);

      // Use retry logic for transient failures with timeout
      await retryWithBackoff(async () => {
        if (!resend) {
          throw new Error('Resend client is not available');
        }
        await withEmailTimeout(
          resend.emails.send({
            from: FROM_EMAIL,
            to: recipient.email,
            subject: `${statusInfo.subject} - ${escapeHtml(event.projectTitle)}`,
            html,
          }),
          'sendStatusChangeEmail'
        );
      });

      logger.info('Status change email sent successfully', {
        context: SERVICE_NAME,
        data: {
          recipient: recipient.email,
          applicationId: event.applicationId,
          status: event.newStatus,
        },
      });
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'sendStatusChangeEmail', error, {
        recipient: recipient.email,
        applicationId: event.applicationId,
      });
      throw error; // Re-throw so Promise.allSettled can track it
    }
  },

  /**
   * Send critical email (e.g., verification emails)
   * Throws errors instead of silently failing
   * @param recipient - Email recipient
   * @param subject - Email subject
   * @param html - Email HTML content
   * @param context - Additional context for logging
   */
  async sendCriticalEmail(
    recipient: { email: string; name: string },
    subject: string,
    html: string,
    context?: Record<string, unknown>
  ): Promise<void> {
    // Validate email service is available
    if (!isResendAvailable()) {
      const error = new Error('Email service unavailable: RESEND_API_KEY not configured');
      logger.error('Cannot send critical email: email service unavailable', error, {
        context: SERVICE_NAME,
        data: {
          recipient: recipient.email,
          ...context,
        },
      });
      throw error;
    }

    // Validate email format
    if (!validateEmail(recipient.email)) {
      const error = new Error(`Invalid email address: ${recipient.email}`);
      logger.error('Cannot send critical email: invalid email format', error, {
        context: SERVICE_NAME,
        data: {
          recipient: recipient.email,
          ...context,
        },
      });
      throw error;
    }

    try {
      // Use retry logic for transient failures with timeout
      await retryWithBackoff(async () => {
        await withEmailTimeout(
          resend!.emails.send({
            from: FROM_EMAIL,
            to: recipient.email,
            subject,
            html,
          }),
          'sendCriticalEmail'
        );
      });

      logger.info('Critical email sent successfully', {
        context: SERVICE_NAME,
        data: {
          recipient: recipient.email,
          ...context,
        },
      });
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'sendCriticalEmail', error, {
        recipient: recipient.email,
        ...context,
      });
      throw error; // Re-throw for critical emails
    }
  },
};

