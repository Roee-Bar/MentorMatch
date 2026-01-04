/**
 * Error Handler Middleware
 * 
 * Centralized error handling for API routes
 */

import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getCorrelationId } from './correlation-id';
import {
  ApiError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  InternalServerError,
  TimeoutError,
} from './errors';

/**
 * Handle errors and return appropriate NextResponse
 */
export function handleApiError(error: unknown): NextResponse {
  const correlationId = getCorrelationId();
  
  // Log error with full context
  logger.error('API Error', error, {
    context: 'ErrorHandler',
    data: { correlationId }
  });

  // Handle custom error classes
  if (error instanceof ApiError) {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const response = NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
        ...(correlationId && { correlationId }),
        ...(isDevelopment && error.details && { details: error.details }),
      },
      { status: error.statusCode }
    );
    
    // Add correlation ID to header
    if (correlationId) {
      response.headers.set('X-Correlation-ID', correlationId);
    }
    
    // Add retry-after header for rate limit errors
    if (error instanceof RateLimitError && error.retryAfter) {
      response.headers.set('Retry-After', error.retryAfter.toString());
    }
    
    return response;
  }

  // Handle generic Error instances
  if (error instanceof Error) {
    const response = NextResponse.json(
      {
        success: false,
        error: error.message,
        code: 'INTERNAL_ERROR',
        ...(correlationId && { correlationId }),
      },
      { status: 500 }
    );
    
    if (correlationId) {
      response.headers.set('X-Correlation-ID', correlationId);
    }
    
    return response;
  }

  // Handle unknown error types
  const response = NextResponse.json(
    {
      success: false,
      error: 'An unexpected error occurred',
      code: 'INTERNAL_ERROR',
      ...(correlationId && { correlationId }),
    },
    { status: 500 }
  );
  
  if (correlationId) {
    response.headers.set('X-Correlation-ID', correlationId);
  }
  
  return response;
}

/**
 * Standard HTTP error codes and messages
 */
export const ErrorCodes = {
  UNAUTHORIZED: { code: 401, message: 'Unauthorized' },
  FORBIDDEN: { code: 403, message: 'Forbidden' },
  NOT_FOUND: { code: 404, message: 'Resource not found' },
  VALIDATION_ERROR: { code: 400, message: 'Validation error' },
  INTERNAL_ERROR: { code: 500, message: 'Internal server error' },
};

