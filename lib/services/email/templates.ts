/**
 * Email Templates
 * SERVER-ONLY: This file must ONLY be imported in API routes (server-side)
 * 
 * HTML email templates for various notification types.
 */

import { escapeHtml } from '@/lib/utils/html-escape';
import type { ApplicationStatusChangedEvent } from '@/lib/services/shared/events';

/**
 * Generate HTML email template for application status change notifications
 * 
 * @param recipientName - Name of the email recipient
 * @param event - Application status changed event
 * @param statusInfo - Status message configuration (subject and message)
 * @returns HTML email template string
 */
export function generateStatusChangeEmailHTML(
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
}

