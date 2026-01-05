/**
 * API Response Utilities
 * 
 * Standardized response helpers for API routes
 */

import { NextResponse } from 'next/server';
import { getCorrelationId } from './correlation-id';

/**
 * Standard authorization error messages
 */
export const AuthMessages = {
  NO_PERMISSION: 'You do not have permission to access this resource',
  NO_PERMISSION_UPDATE: 'You do not have permission to update this resource',
  NO_PERMISSION_RESPOND: 'You do not have permission to respond to this request',
} as const;

/**
 * Helper to add correlation ID to response headers
 */
function addCorrelationIdHeader(response: NextResponse): NextResponse {
  const correlationId = getCorrelationId();
  if (correlationId) {
    response.headers.set('X-Correlation-ID', correlationId);
  }
  return response;
}

/**
 * Standard API response helpers
 */
export const ApiResponse = {
  /**
   * Success response with data
   */
  success: (data: any, status = 200) => {
    const response = NextResponse.json({ success: true, data }, { status });
    return addCorrelationIdHeader(response);
  },
  
  /**
   * Success response with data array and count
   */
  successWithCount: (data: any[], status = 200) => {
    const response = NextResponse.json({ success: true, data, count: data.length }, { status });
    return addCorrelationIdHeader(response);
  },
  
  /**
   * Error response with message
   */
  error: (message: string, status = 500) => {
    const correlationId = getCorrelationId();
    const response = NextResponse.json({ 
      success: false, 
      error: message,
      ...(correlationId && { correlationId })
    }, { status });
    return addCorrelationIdHeader(response);
  },
  
  /**
   * 401 Unauthorized response
   */
  unauthorized: () => {
    const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return addCorrelationIdHeader(response);
  },
  
  /**
   * 403 Forbidden response
   */
  forbidden: (message?: string) => {
    const response = NextResponse.json({ 
      success: false, 
      error: message || 'Forbidden' 
    }, { status: 403 });
    return addCorrelationIdHeader(response);
  },
  
  /**
   * 404 Not Found response
   */
  notFound: (resource = 'Resource') => {
    const response = NextResponse.json({ error: `${resource} not found` }, { status: 404 });
    return addCorrelationIdHeader(response);
  },
  
  /**
   * 400 Bad Request response for validation errors
   */
  validationError: (message: string) => {
    const response = NextResponse.json({ error: message }, { status: 400 });
    return addCorrelationIdHeader(response);
  },
  
  /**
   * Success response with message
   */
  successMessage: (message: string, status = 200) => {
    const response = NextResponse.json({ success: true, message }, { status });
    return addCorrelationIdHeader(response);
  },
  
  /**
   * Created response (201)
   */
  created: (data: any, message?: string) => {
    const response = NextResponse.json({ success: true, message: message || 'Created successfully', data }, { status: 201 });
    return addCorrelationIdHeader(response);
  },
  
  /**
   * Authorization-specific error responses
   */
  
  /**
   * Not owner error - user doesn't own the resource
   */
  notOwner: () => {
    const response = NextResponse.json({ 
      success: false, 
      error: 'You do not have permission to access this resource' 
    }, { status: 403 });
    return addCorrelationIdHeader(response);
  },
  
  /**
   * Insufficient role error - user doesn't have required role(s)
   */
  insufficientRole: (requiredRoles?: string[]) => {
    const response = NextResponse.json({ 
      success: false,
      error: requiredRoles 
        ? `This action requires one of the following roles: ${requiredRoles.join(', ')}`
        : 'Insufficient permissions'
    }, { status: 403 });
    return addCorrelationIdHeader(response);
  },
};

