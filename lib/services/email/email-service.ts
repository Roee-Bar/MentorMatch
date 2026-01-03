/**
 * Email Service
 * SERVER-ONLY: This file must ONLY be imported in API routes (server-side)
 * 
 * Handles email notifications using Resend for application-related events.
 */

import { Resend } from 'resend';
import { logger } from '@/lib/logger';
import { ApplicationService } from '@/lib/services/applications/application-service';
import { SupervisorService } from '@/lib/services/supervisors/supervisor-service';
import type { ApplicationStatusChangedEvent } from '@/lib/services/shared/events';

const SERVICE_NAME = 'EmailService';

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Escape HTML special characters to prevent XSS attacks
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

// ============================================
// TYPES
// ============================================

interface EmailRecipient {
  email: string;
  name: string;
  userId: string;
}

// ============================================
// RESEND CLIENT INITIALIZATION
// ============================================

// Validate API key and initialize Resend client conditionally
if (!process.env.RESEND_API_KEY) {
  logger.warn('RESEND_API_KEY not configured - email service will not function', {
    context: SERVICE_NAME,
  });
}

// Initialize Resend client conditionally (only if API key exists)
const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Default from email if not configured
const DEFAULT_FROM_EMAIL = 'onboarding@resend.dev';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || DEFAULT_FROM_EMAIL;

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

      // Collect all connected users
      const recipients: EmailRecipient[] = [];

      // Add student (if not the triggerer)
      if (event.studentId !== triggeredByUserId) {
        recipients.push({
          email: event.studentEmail,
          name: event.studentName,
          userId: event.studentId,
        });
      }

      // Add supervisor (need to fetch email, and exclude if triggerer)
      if (event.supervisorId !== triggeredByUserId) {
        const supervisor = await SupervisorService.getSupervisorById(event.supervisorId);
        if (supervisor) {
          recipients.push({
            email: supervisor.email,
            name: event.supervisorName,
            userId: event.supervisorId,
          });
        } else {
          logger.warn('Supervisor not found for email notification', {
            context: SERVICE_NAME,
            data: { supervisorId: event.supervisorId },
          });
        }
      }

      // Add partner (if exists and not the triggerer)
      if (event.hasPartner && event.partnerEmail && application.partnerId) {
        // Exclude partner if they triggered the change
        if (application.partnerId !== triggeredByUserId) {
          recipients.push({
            email: event.partnerEmail,
            name: event.partnerName || 'Partner',
            userId: application.partnerId,
          });
        }
      }

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

    const statusMessages: Record<string, { subject: string; message: string }> = {
      approved: {
        subject: 'Application Approved',
        message: 'Great news! Your application has been approved.',
      },
      rejected: {
        subject: 'Application Update',
        message: 'Your application has been reviewed.',
      },
      revision_requested: {
        subject: 'Revision Requested',
        message: 'Your application requires some revisions.',
      },
      pending: {
        subject: 'Application Status Update',
        message: 'The status of your application has been updated.',
      },
    };

    const statusInfo = statusMessages[event.newStatus] || statusMessages.pending;

    try {
      const html = this.generateStatusChangeEmailHTML(recipient.name, event, statusInfo);

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

  /**
   * Generate HTML email template
   */
  generateStatusChangeEmailHTML(
    recipientName: string,
    event: ApplicationStatusChangedEvent,
    statusInfo: { subject: string; message: string }
  ): string {
    // Escape all user-controlled data to prevent XSS
    const escapedName = escapeHtml(recipientName);
    const escapedProjectTitle = escapeHtml(event.projectTitle);
    const escapedPreviousStatus = escapeHtml(event.previousStatus);
    const escapedNewStatus = escapeHtml(event.newStatus);
    const escapedFeedback = event.feedback ? escapeHtml(event.feedback) : null;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; background-color: #f3f4f6;">
          <div style="max-width: 600px; margin: 0 auto; padding: 16px;">
            <div style="background-color: #ffffff; border-radius: 8px; padding: 32px 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <h2 style="color: #2563eb; margin-top: 0; margin-bottom: 16px; font-size: 24px; font-weight: 600;">${escapeHtml(statusInfo.subject)}</h2>
              <p style="margin: 0 0 16px 0; font-size: 16px;">Hello ${escapedName},</p>
              <p style="margin: 0 0 24px 0; font-size: 16px; color: #4b5563;">${escapeHtml(statusInfo.message)}</p>
              
              <div style="background-color: #f9fafb; padding: 20px; border-radius: 6px; margin: 24px 0; border-left: 4px solid #2563eb;">
                <p style="margin: 8px 0; font-size: 15px;"><strong style="color: #111827;">Project:</strong> <span style="color: #374151;">${escapedProjectTitle}</span></p>
                <p style="margin: 8px 0; font-size: 15px;"><strong style="color: #111827;">Previous Status:</strong> <span style="color: #374151;">${escapedPreviousStatus}</span></p>
                <p style="margin: 8px 0; font-size: 15px;"><strong style="color: #111827;">New Status:</strong> <span style="color: #374151;">${escapedNewStatus}</span></p>
                ${escapedFeedback ? `<p style="margin: 8px 0; font-size: 15px;"><strong style="color: #111827;">Feedback:</strong> <span style="color: #374151;">${escapedFeedback}</span></p>` : ''}
              </div>
              
              <p style="margin: 24px 0 0 0; font-size: 15px; color: #4b5563;">You can view the full details in your MentorMatch dashboard.</p>
              <p style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">Best regards,<br>The MentorMatch Team</p>
            </div>
          </div>
        </body>
      </html>
    `;
  },
};

