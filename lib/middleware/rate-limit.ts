/**
 * Rate Limiting Middleware
 * 
 * Provides rate limiting functionality using Firestore for storage.
 * Implements sliding window algorithm for per-user, per-endpoint rate limiting.
 */

import { adminDb } from '@/lib/firebase-admin';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { logger } from '@/lib/logger';

const SERVICE_NAME = 'RateLimitService';

/**
 * Rate limit check result
 */
export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Seconds until the rate limit resets (if not allowed) */
  retryAfter?: number;
  /** Number of requests remaining in the current window */
  remaining?: number;
  /** Total requests in the current window */
  count?: number;
}

/**
 * Rate limit configuration
 */
interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  maxRequests: number;
  /** Window duration in milliseconds */
  windowMs: number;
  /** Fail strategy: 'fail-open' allows requests on error, 'fail-closed' denies them */
  failStrategy?: 'fail-open' | 'fail-closed';
}

/**
 * Rate limit record stored in Firestore
 */
interface RateLimitRecord {
  userId: string;
  endpoint: string;
  count: number;
  windowStart: any; // Firestore Timestamp
  expiresAt: any; // Firestore Timestamp
}

/**
 * Default rate limit configuration
 */
const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: parseInt(process.env.RATE_LIMIT_REQUESTS || '3', 10),
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '3600000', 10), // 1 hour default
};

/**
 * Rate Limiting Service
 * 
 * Uses Firestore to track rate limits per user and endpoint.
 * Implements sliding window algorithm.
 */
export class RateLimitService {
  private collection = 'rate_limits';

  /**
   * Check if a request is within rate limits
   * 
   * @param userId - User ID making the request
   * @param endpoint - Endpoint being accessed (e.g., '/api/auth/resend-verification')
   * @param config - Optional rate limit configuration (defaults to environment variables or 3/hour)
   * @returns Rate limit check result
   */
  async checkRateLimit(
    userId: string,
    endpoint: string,
    config?: Partial<RateLimitConfig>
  ): Promise<RateLimitResult> {
    const finalConfig: RateLimitConfig = {
      ...DEFAULT_CONFIG,
      failStrategy: 'fail-open', // Default to fail-open for backward compatibility
      ...config,
    };

    const now = new Date();
    const windowStart = new Date(now.getTime() - finalConfig.windowMs);
    const expiresAt = new Date(now.getTime() + finalConfig.windowMs);

    // Create a unique document ID for this user-endpoint combination
    const docId = `${userId}:${endpoint}`;

    try {
      const docRef = adminDb.collection(this.collection).doc(docId);
      const doc = await docRef.get();

      if (!doc.exists) {
        // First request - create new record
        await docRef.set({
          userId,
          endpoint,
          count: 1,
          windowStart: Timestamp.fromDate(now),
          expiresAt: Timestamp.fromDate(expiresAt),
        });

        return {
          allowed: true,
          remaining: finalConfig.maxRequests - 1,
          count: 1,
        };
      }

      const data = doc.data() as RateLimitRecord;
      const recordWindowStart = data.windowStart.toDate();
      const recordExpiresAt = data.expiresAt.toDate();

      // Check if the current window has expired
      if (now > recordExpiresAt || now < recordWindowStart) {
        // Window expired or invalid - reset
        await docRef.set({
          userId,
          endpoint,
          count: 1,
          windowStart: Timestamp.fromDate(now),
          expiresAt: Timestamp.fromDate(expiresAt),
        });

        return {
          allowed: true,
          remaining: finalConfig.maxRequests - 1,
          count: 1,
        };
      }

      // Check if within the current window
      if (data.count >= finalConfig.maxRequests) {
        // Rate limit exceeded
          const retryAfter = Math.ceil((recordExpiresAt.getTime() - now.getTime()) / 1000);

          logger.warn('Rate limit exceeded', {
            context: SERVICE_NAME,
            data: {
              userId,
              endpoint,
              count: data.count,
              maxRequests: finalConfig.maxRequests,
              retryAfter,
            },
          });

          return {
            allowed: false,
            retryAfter,
            remaining: 0,
            count: data.count,
          };
        }

      // Increment count
      await docRef.update({
        count: FieldValue.increment(1),
      });

      const newCount = data.count + 1;

      return {
        allowed: true,
        remaining: finalConfig.maxRequests - newCount,
        count: newCount,
      };
    } catch (error) {
      logger.error('Rate limit check failed', error, {
        context: SERVICE_NAME,
        data: { userId, endpoint, failStrategy: finalConfig.failStrategy },
      });

      // Apply fail strategy
      if (finalConfig.failStrategy === 'fail-closed') {
        // Fail closed - deny the request
        return {
          allowed: false,
          remaining: 0,
          count: 0,
        };
      }

      // Fail open - allow the request (default behavior)
      return {
        allowed: true,
        remaining: finalConfig.maxRequests - 1,
        count: 1,
      };
    }
  }

  /**
   * Get rate limit status for a user and endpoint (without incrementing)
   * 
   * @param userId - User ID
   * @param endpoint - Endpoint
   * @param config - Optional rate limit configuration
   * @returns Current rate limit status
   */
  async getRateLimitStatus(
    userId: string,
    endpoint: string,
    config?: Partial<RateLimitConfig>
  ): Promise<RateLimitResult> {
    const finalConfig: RateLimitConfig = {
      ...DEFAULT_CONFIG,
      ...config,
    };

    const now = new Date();
    const docId = `${userId}:${endpoint}`;

    try {
      const docRef = adminDb.collection(this.collection).doc(docId);
      const doc = await docRef.get();

      if (!doc.exists) {
        return {
          allowed: true,
          remaining: finalConfig.maxRequests,
          count: 0,
        };
      }

      const data = doc.data() as RateLimitRecord;
      const recordExpiresAt = data.expiresAt.toDate();

      // Check if expired
      if (now > recordExpiresAt) {
        return {
          allowed: true,
          remaining: finalConfig.maxRequests,
          count: 0,
        };
      }

      const remaining = Math.max(0, finalConfig.maxRequests - data.count);
      const retryAfter = remaining === 0
        ? Math.ceil((recordExpiresAt.getTime() - now.getTime()) / 1000)
        : undefined;

      return {
        allowed: remaining > 0,
        retryAfter,
        remaining,
        count: data.count,
      };
    } catch (error) {
      logger.error('Get rate limit status failed', error, {
        context: SERVICE_NAME,
        data: { userId, endpoint },
      });

      // Always fail open for status checks (non-blocking operation)
      return {
        allowed: true,
        remaining: finalConfig.maxRequests,
        count: 0,
      };
    }
  }
}

/**
 * Singleton instance
 */
export const rateLimitService = new RateLimitService();

