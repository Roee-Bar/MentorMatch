/**
 * Email Service
 * SERVER-ONLY: This file must ONLY be imported in API routes (server-side)
 * 
 * Handles email notifications using Resend for application-related events.
 */

import { logger } from '@/lib/logger';
import { escapeHtml } from '@/lib/utils/html-escape';
import { ApplicationService } from '@/lib/services/applications/application-service';
import { resend, FROM_EMAIL } from './resend-client';
import { getStatusMessage } from './email-config';
import { generateStatusChangeEmailHTML } from './templates';
import { getApplicationStatusChangeRecipients, type EmailRecipient } from '@/lib/services/shared/notification-helpers';
import type { ApplicationStatusChangedEvent } from '@/lib/services/shared/events';

const SERVICE_NAME = 'EmailService';

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
      const application = await ApplicationService.getApplicationById(event.applicationId);
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

    const statusInfo = getStatusMessage(event.newStatus);

    try {
      const html = generateStatusChangeEmailHTML(recipient.name, event, statusInfo);

      await resend.emails.send({
        from: FROM_EMAIL,
        to: recipient.email,
        subject: `${statusInfo.subject} - ${escapeHtml(event.projectTitle)}`,
        html,
      });

      logger.debug('Status change email sent successfully', {
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
};

