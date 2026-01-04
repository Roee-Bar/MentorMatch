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
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/b58b9ea6-ea87-472c-b297-772b0ab30cc5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/middleware/errorHandler.ts:13',message:'handleApiError called',data:{isError:error instanceof Error,message:error instanceof Error?error.message:'unknown',stack:error instanceof Error?error.stack?.substring(0,300):'none'},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
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

