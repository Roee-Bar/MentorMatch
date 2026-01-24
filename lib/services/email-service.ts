/**
 * Email Service
 * 
 * Handles sending emails via Resend
 */

import { Resend } from 'resend';
import { logger } from '@/lib/logger';

const SERVICE_NAME = 'EmailService';

const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export class EmailService {
  /**
   * Check if Resend is configured
   */
  static isConfigured(): boolean {
    return resend !== null;
  }

  /**
   * Send verification email via Resend
   */
  static async sendVerificationEmail(
    email: string, 
    firstName: string, 
    verificationToken: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!resend) {
      logger.service.error(SERVICE_NAME, 'sendVerificationEmail', 
        new Error('Resend not configured'), { email });
      return { success: false, error: 'Email service not configured' };
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verificationLink = `${appUrl}/verify-email?token=${verificationToken}`;

    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'MentorMatch <onboarding@resend.dev>',
        to: email,
        subject: 'Verify your MentorMatch account',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to MentorMatch!</h1>
              </div>
              
              <div style="background: #f9fafb; padding: 40px 30px; border-radius: 0 0 10px 10px;">
                <p style="font-size: 16px; margin-bottom: 20px;">Hi ${firstName},</p>
                
                <p style="font-size: 16px; margin-bottom: 20px;">
                  Thank you for registering with MentorMatch! To complete your registration and start connecting with supervisors, please verify your email address.
                </p>
                
                <div style="text-align: center; margin: 35px 0;">
                  <a href="${verificationLink}" 
                     style="background: #3b82f6; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px;">
                    Verify Email Address
                  </a>
                </div>
                
                <p style="font-size: 14px; color: #666; margin-bottom: 15px;">
                  Or copy and paste this link into your browser:
                </p>
                <p style="font-size: 13px; color: #3b82f6; word-break: break-all; background: white; padding: 12px; border-radius: 6px; border: 1px solid #e5e7eb;">
                  ${verificationLink}
                </p>
                
                <p style="font-size: 14px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                  <strong>⏰ This link will expire in 24 hours.</strong>
                </p>
                
                <p style="font-size: 13px; color: #999; margin-top: 20px;">
                  If you didn't create a MentorMatch account, you can safely ignore this email.
                </p>
              </div>
              
              <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="font-size: 12px; color: #999;">
                  © 2026 MentorMatch - Braude College of Engineering
                </p>
              </div>
            </body>
          </html>
        `,
      });

      logger.service.success(SERVICE_NAME, 'sendVerificationEmail', { email });
      return { success: true };

    } catch (error: any) {
      logger.service.error(SERVICE_NAME, 'sendVerificationEmail', error, { email });
      return { success: false, error: error.message || 'Failed to send email' };
    }
  }

  /**
   * Send password reset email (for future use)
   */
  static async sendPasswordResetEmail(
    email: string, 
    resetLink: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!resend) {
      logger.service.error(SERVICE_NAME, 'sendPasswordResetEmail', 
        new Error('Resend not configured'), { email });
      return { success: false, error: 'Email service not configured' };
    }

    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'MentorMatch <onboarding@resend.dev>',
        to: email,
        subject: 'Reset your MentorMatch password',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset Request</h1>
              </div>
              
              <div style="background: #f9fafb; padding: 40px 30px; border-radius: 0 0 10px 10px;">
                <p style="font-size: 16px; margin-bottom: 20px;">
                  We received a request to reset your MentorMatch password. Click the button below to reset it:
                </p>
                
                <div style="text-align: center; margin: 35px 0;">
                  <a href="${resetLink}" 
                     style="background: #3b82f6; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px;">
                    Reset Password
                  </a>
                </div>
                
                <p style="font-size: 14px; color: #666; margin-bottom: 15px;">
                  Or copy and paste this link into your browser:
                </p>
                <p style="font-size: 13px; color: #3b82f6; word-break: break-all; background: white; padding: 12px; border-radius: 6px; border: 1px solid #e5e7eb;">
                  ${resetLink}
                </p>
                
                <p style="font-size: 14px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                  <strong>⏰ This link will expire in 1 hour.</strong>
                </p>
                
                <p style="font-size: 13px; color: #999; margin-top: 20px;">
                  If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
                </p>
              </div>
              
              <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="font-size: 12px; color: #999;">
                  © 2026 MentorMatch - Braude College of Engineering
                </p>
              </div>
            </body>
          </html>
        `,
      });

      logger.service.success(SERVICE_NAME, 'sendPasswordResetEmail', { email });
      return { success: true };

    } catch (error: any) {
      logger.service.error(SERVICE_NAME, 'sendPasswordResetEmail', error, { email });
      return { success: false, error: error.message || 'Failed to send email' };
    }
  }
}
