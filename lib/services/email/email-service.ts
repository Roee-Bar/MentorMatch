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

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Default from email if not configured
const DEFAULT_FROM_EMAIL = 'onboarding@resend.dev';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || DEFAULT_FROM_EMAIL;

// ============================================
// TYPES
// ============================================

interface EmailRecipient {
  email: string;
  name: string;
  userId: string;
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

      if (failed > 0) {
        logger.warn(`Some status change emails failed: ${failed} failed, ${succeeded} succeeded`, {
          context: SERVICE_NAME,
          data: { applicationId: event.applicationId },
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
        subject: `${statusInfo.subject} - ${event.projectTitle}`,
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
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #ffffff; border-radius: 5px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h2 style="color: #2563eb; margin-top: 0;">${statusInfo.subject}</h2>
              <p>Hello ${recipientName},</p>
              <p>${statusInfo.message}</p>
              
              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #2563eb;">
                <p style="margin: 5px 0;"><strong>Project:</strong> ${event.projectTitle}</p>
                <p style="margin: 5px 0;"><strong>Previous Status:</strong> ${event.previousStatus}</p>
                <p style="margin: 5px 0;"><strong>New Status:</strong> ${event.newStatus}</p>
                ${event.feedback ? `<p style="margin: 5px 0;"><strong>Feedback:</strong> ${event.feedback}</p>` : ''}
              </div>
              
              <p>You can view the full details in your MentorMatch dashboard.</p>
              <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">Best regards,<br>The MentorMatch Team</p>
            </div>
          </div>
        </body>
      </html>
    `;
  },
};

