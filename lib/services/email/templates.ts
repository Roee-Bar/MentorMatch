/**
 * Email Templates
 * SERVER-ONLY: This file must ONLY be imported in API routes (server-side)
 * 
 * HTML email templates for various notification types.
 */

import { escapeHtml } from '@/lib/utils/html-escape';
import type { ApplicationStatusChangedEvent } from '@/lib/services/shared/events';
import { emailStyles, styleObjectToString } from './email-styles';

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
      <body style="${styleObjectToString(emailStyles.body)}">
        <div style="${styleObjectToString(emailStyles.container)}">
          <div style="${styleObjectToString(emailStyles.card)}">
            <h2 style="${styleObjectToString(emailStyles.heading)}">${escapeHtml(statusInfo.subject)}</h2>
            <p style="${styleObjectToString(emailStyles.paragraph)}">Hello ${escapedName},</p>
            <p style="${styleObjectToString(emailStyles.paragraphMuted)}">${escapeHtml(statusInfo.message)}</p>
            
            <div style="${styleObjectToString(emailStyles.infoBox)}">
              <p style="${styleObjectToString(emailStyles.infoBoxLabel)}"><strong style="${styleObjectToString({ color: emailStyles.infoBoxLabel.color })}">Project:</strong> <span style="${styleObjectToString({ color: emailStyles.infoBoxValue.color })}">${escapedProjectTitle}</span></p>
              <p style="${styleObjectToString(emailStyles.infoBoxLabel)}"><strong style="${styleObjectToString({ color: emailStyles.infoBoxLabel.color })}">Previous Status:</strong> <span style="${styleObjectToString({ color: emailStyles.infoBoxValue.color })}">${escapedPreviousStatus}</span></p>
              <p style="${styleObjectToString(emailStyles.infoBoxLabel)}"><strong style="${styleObjectToString({ color: emailStyles.infoBoxLabel.color })}">New Status:</strong> <span style="${styleObjectToString({ color: emailStyles.infoBoxValue.color })}">${escapedNewStatus}</span></p>
              ${escapedFeedback ? `<p style="${styleObjectToString(emailStyles.infoBoxLabel)}"><strong style="${styleObjectToString({ color: emailStyles.infoBoxLabel.color })}">Feedback:</strong> <span style="${styleObjectToString({ color: emailStyles.infoBoxValue.color })}">${escapedFeedback}</span></p>` : ''}
            </div>
            
            <p style="${styleObjectToString({ margin: '24px 0 0 0', fontSize: emailStyles.infoBoxValue.fontSize, color: emailStyles.paragraphMuted.color })}">You can view the full details in your MentorMatch dashboard.</p>
            <p style="${styleObjectToString(emailStyles.footer)}">Best regards,<br>The MentorMatch Team</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

