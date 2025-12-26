// lib/middleware/rateLimiter.ts
// Rate limiting middleware for API routes

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

// In-memory store for rate limiting (in production, use Redis)
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Rate limiter configuration
 */
export interface RateLimitConfig {
  maxRequests: number; // Maximum number of requests
  windowMs: number; // Time window in milliseconds
  message?: string; // Custom error message
}

/**
 * Create a rate limiter middleware
 * 
 * @param config - Rate limit configuration
 * @returns Middleware function
 */
export function createRateLimiter(config: RateLimitConfig) {
  return (request: NextRequest): NextResponse | null => {
    const userId = request.headers.get('x-user-id') || request.headers.get('authorization') || 'anonymous';
    const key = `${userId}:${request.nextUrl.pathname}`;
    const now = Date.now();

    // Get or create rate limit entry
    let entry = rateLimitStore.get(key);
    
    if (!entry || entry.resetTime < now) {
      // Create new entry or reset expired entry
      entry = {
        count: 0,
        resetTime: now + config.windowMs,
      };
      rateLimitStore.set(key, entry);
    }

    // Increment request count
    entry.count++;

    // Check if limit exceeded
    if (entry.count > config.maxRequests) {
      logger.warn('Rate limit exceeded', {
        context: 'RateLimiter',
        data: { userId, path: request.nextUrl.pathname, count: entry.count, maxRequests: config.maxRequests }
      });

      return NextResponse.json(
        { 
          error: config.message || `Rate limit exceeded. Maximum ${config.maxRequests} requests per ${config.windowMs / 1000} seconds.`,
          retryAfter: Math.ceil((entry.resetTime - now) / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((entry.resetTime - now) / 1000).toString(),
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': entry.resetTime.toString(),
          }
        }
      );
    }

    // Add rate limit headers
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', (config.maxRequests - entry.count).toString());
    response.headers.set('X-RateLimit-Reset', entry.resetTime.toString());

    return null; // Continue to next middleware
  };
}

/**
 * Predefined rate limiters for common use cases
 */
export const rateLimiters = {
  partnershipRequest: createRateLimiter({
    maxRequests: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'Too many partnership requests. Please try again later.',
  }),
  
  partnershipResponse: createRateLimiter({
    maxRequests: 20,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'Too many partnership responses. Please try again later.',
  }),
};

