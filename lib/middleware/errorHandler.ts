/**
 * Error Handler Middleware
 * 
 * Centralized error handling for API routes
 */

import { NextResponse } from 'next/server';

/**
 * Handle errors and return appropriate NextResponse
 */
export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error);

  if (error instanceof Error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      success: false,
      error: 'An unexpected error occurred',
    },
    { status: 500 }
  );
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

