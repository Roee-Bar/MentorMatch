/**
 * Email Verification Service
 * 
 * Handles generation and verification of email verification tokens
 */

import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

const SERVICE_NAME = 'EmailVerificationService';

export interface VerificationToken {
  token: string;
  userId: string;
  email: string;
  expiresAt: Date;
  createdAt: Date;
  used: boolean;
  usedAt?: Date;
}

export class EmailVerificationService {
  /**
   * Generate and store verification token
   */
  static async createVerificationToken(userId: string, email: string): Promise<string> {
    try {
      const token = uuidv4();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiration

      const tokenData: VerificationToken = {
        token,
        userId,
        email,
        expiresAt,
        createdAt: new Date(),
        used: false,
      };

      await adminDb.collection('email_verification_tokens').doc(token).set(tokenData);

      logger.service.success(SERVICE_NAME, 'createVerificationToken', { userId, email });

      return token;
    } catch (error: any) {
      logger.service.error(SERVICE_NAME, 'createVerificationToken', error, { userId, email });
      throw error;
    }
  }

  /**
   * Verify token and mark user as verified
   */
  static async verifyToken(token: string): Promise<{ success: boolean; error?: string }> {
    try {
      const tokenDoc = await adminDb.collection('email_verification_tokens').doc(token).get();

      if (!tokenDoc.exists) {
        logger.service.warn(SERVICE_NAME, 'verifyToken', 'Token not found', { token });
        return { success: false, error: 'Invalid verification token' };
      }

      const tokenData = tokenDoc.data() as VerificationToken;

      // Check if already used
      if (tokenData.used) {
        logger.service.warn(SERVICE_NAME, 'verifyToken', 'Token already used', { token });
        return { success: false, error: 'Verification token has already been used' };
      }

      // Check if expired
      const now = new Date();
      const expiresAt = tokenData.expiresAt instanceof Date 
        ? tokenData.expiresAt 
        : new Date(tokenData.expiresAt);

      if (now > expiresAt) {
        logger.service.warn(SERVICE_NAME, 'verifyToken', 'Token expired', { token });
        return { success: false, error: 'Verification token has expired' };
      }

      // Mark token as used
      await adminDb.collection('email_verification_tokens').doc(token).update({
        used: true,
        usedAt: new Date(),
      });

      // Update Firebase Auth emailVerified flag
      await adminAuth.updateUser(tokenData.userId, {
        emailVerified: true,
      });

      // Update user document
      await adminDb.collection('users').doc(tokenData.userId).update({
        emailVerified: true,
        emailVerifiedAt: new Date(),
        updatedAt: new Date(),
      });

      // Update student document
      const studentDoc = await adminDb.collection('students').doc(tokenData.userId).get();
      if (studentDoc.exists) {
        await adminDb.collection('students').doc(tokenData.userId).update({
          emailVerified: true,
          emailVerifiedAt: new Date(),
          updatedAt: new Date(),
        });
      }

      logger.service.success(SERVICE_NAME, 'verifyToken', { 
        userId: tokenData.userId, 
        email: tokenData.email 
      });

      return { success: true };

    } catch (error: any) {
      logger.service.error(SERVICE_NAME, 'verifyToken', error, { token });
      return { success: false, error: 'Verification failed' };
    }
  }

  /**
   * Delete expired tokens (cleanup)
   * Can be run periodically as a maintenance task
   */
  static async cleanupExpiredTokens(): Promise<void> {
    try {
      const now = new Date();
      const expiredTokens = await adminDb
        .collection('email_verification_tokens')
        .where('expiresAt', '<', now)
        .get();

      if (expiredTokens.empty) {
        logger.service.operation(SERVICE_NAME, 'cleanupExpiredTokens', { 
          message: 'No expired tokens to clean up' 
        });
        return;
      }

      const batch = adminDb.batch();
      expiredTokens.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      logger.service.success(SERVICE_NAME, 'cleanupExpiredTokens', { 
        count: expiredTokens.size 
      });
    } catch (error: any) {
      logger.service.error(SERVICE_NAME, 'cleanupExpiredTokens', error);
    }
  }
}
