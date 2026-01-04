/**
 * Email Templates
 * SERVER-ONLY: This file must ONLY be imported in API routes (server-side)
 * 
 * HTML email templates for various notification types.
 */

import { escapeHtml } from '@/lib/utils/html-escape';
import type { ApplicationStatusChangedEvent } from '@/lib/services/shared/events';
import { emailStyles, styleObjectToString, emailColors, emailSpacing, emailTypography } from './email-styles';

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

/**
 * Generate HTML email template for email verification
 * 
 * @param recipientName - Name of the email recipient
 * @param verificationLink - Firebase-generated email verification link
 * @returns HTML email template string
 */
export function generateVerificationEmailHTML(
  recipientName: string,
  verificationLink: string
): string {
  // Escape user-controlled data
  const escapedName = escapeHtml(recipientName);
  const escapedLink = escapeHtml(verificationLink);

  // Button styles matching the design system
  const buttonStyles = {
    display: 'inline-block',
    padding: `${emailSpacing.md} ${emailSpacing.xl}`,
    backgroundColor: emailColors.blue600,
    color: emailColors.white,
    textDecoration: 'none',
    borderRadius: '6px',
    fontWeight: '600',
    fontSize: emailStyles.paragraph.fontSize,
    margin: `${emailSpacing.lg} 0`,
  };

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
            <h2 style="${styleObjectToString(emailStyles.heading)}">Verify your email address</h2>
            <p style="${styleObjectToString(emailStyles.paragraph)}">Hello ${escapedName},</p>
            <p style="${styleObjectToString(emailStyles.paragraphMuted)}">Thank you for registering with MentorMatch! Please verify your email address to complete your registration and access all features.</p>
            
            <div style="text-align: center; margin: ${emailSpacing.xl} 0;">
              <a href="${escapedLink}" style="${styleObjectToString(buttonStyles)}">Verify Email Address</a>
            </div>
            
            <div style="${styleObjectToString(emailStyles.infoBox)}">
              <p style="${styleObjectToString({ ...emailStyles.infoBoxLabel, marginBottom: emailSpacing.xs })}"><strong style="${styleObjectToString({ color: emailStyles.infoBoxLabel.color })}">Important:</strong></p>
              <ul style="${styleObjectToString({ margin: '0', paddingLeft: emailSpacing.lg, color: emailStyles.infoBoxValue.color, fontSize: emailStyles.infoBoxValue.fontSize })}">
                <li style="${styleObjectToString({ margin: `${emailSpacing.xs} 0` })}">This verification link will expire in 1 hour</li>
                <li style="${styleObjectToString({ margin: `${emailSpacing.xs} 0` })}">If you didn't create a MentorMatch account, you can safely ignore this email</li>
                <li style="${styleObjectToString({ margin: `${emailSpacing.xs} 0` })}">If the button doesn't work, copy and paste this link into your browser:</li>
              </ul>
              <p style="${styleObjectToString({ margin: `${emailSpacing.sm} 0 0 0`, fontSize: emailTypography.textSm, color: emailColors.gray600, wordBreak: 'break-all' })}">${escapedLink}</p>
            </div>
            
            <p style="${styleObjectToString({ margin: '24px 0 0 0', fontSize: emailStyles.infoBoxValue.fontSize, color: emailStyles.paragraphMuted.color })}">Once verified, you'll be able to access your MentorMatch dashboard and start applying for projects.</p>
            <p style="${styleObjectToString(emailStyles.footer)}">Best regards,<br>The MentorMatch Team</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

