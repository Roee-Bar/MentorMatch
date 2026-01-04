/**
 * Email Verification Service
 * SERVER-ONLY: This file must ONLY be imported in API routes (server-side)
 * 
 * Handles email verification using Firebase Auth's built-in verification system
 * with custom email templates for better UX.
 */

import { adminAuth } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { EmailService } from '@/lib/services/email/email-service';
import { generateVerificationEmailHTML } from '@/lib/services/email/templates';

const SERVICE_NAME = 'EmailVerificationService';

// ============================================
// EMAIL VERIFICATION SERVICE
// ============================================

export const EmailVerificationService = {
  /**
   * Generate email verification link and send verification email
   * @param userId - Firebase user ID
   * @param email - User's email address
   * @param name - User's display name
   * @returns Promise that resolves when email is sent
   */
  async sendVerificationEmail(
    userId: string,
    email: string,
    name: string
  ): Promise<void> {
    try {
      // Get base URL from environment variable
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      
      // Generate Firebase email verification link
      // This creates a secure, time-limited verification link
      const actionCodeSettings = {
        url: `${baseUrl}/login?verified=true`,
        handleCodeInApp: false, // Open link in browser, not app
      };

      const verificationLink = await adminAuth.generateEmailVerificationLink(
        email,
        actionCodeSettings
      );

      // Generate email HTML using custom template
      const html = generateVerificationEmailHTML(name, verificationLink);

      // Send email using critical email mode (throws on failure)
      await EmailService.sendCriticalEmail(
        { email, name },
        'Verify your MentorMatch email address',
        html,
        { userId }
      );

      logger.info('Verification email sent successfully', {
        context: SERVICE_NAME,
        data: { userId, email },
      });
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'sendVerificationEmail', error, {
        userId,
        email,
      });
      throw error;
    }
  },

  /**
   * Check if user's email is verified
   * @param userId - Firebase user ID
   * @returns Promise that resolves to true if email is verified
   */
  async isEmailVerified(userId: string): Promise<boolean> {
    try {
      const userRecord = await adminAuth.getUser(userId);
      return userRecord.emailVerified || false;
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'isEmailVerified', error, {
        userId,
      });
      return false;
    }
  },

  /**
   * Verify email using Firebase's built-in verification
   * This is typically called when user clicks the verification link
   * @param oobCode - The action code from the verification link
   * @returns Promise that resolves when verification is complete
   */
  async verifyEmail(oobCode: string): Promise<{ userId: string; email: string }> {
    try {
      // Firebase handles the verification when the link is clicked
      // This method is for programmatic verification if needed
      // For now, we'll rely on Firebase's built-in handling
      // The verification happens automatically when user clicks the link
      
      logger.debug('Email verification initiated', {
        context: SERVICE_NAME,
        data: { hasOobCode: !!oobCode },
      });

      // Note: Firebase handles verification automatically via the link
      // We just need to check the user's emailVerified status after they click
      throw new Error('Email verification should be handled by Firebase Auth via the verification link');
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'verifyEmail', error, {
        hasOobCode: !!oobCode,
      });
      throw error;
    }
  },
};

