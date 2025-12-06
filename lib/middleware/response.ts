/**
 * API Response Utilities
 * 
 * Standardized response helpers for API routes
 */

import { NextResponse } from 'next/server';

/**
 * Standard authorization error messages
 */
export const AuthMessages = {
  NO_PERMISSION: 'You do not have permission to access this resource',
  NO_PERMISSION_UPDATE: 'You do not have permission to update this resource',
  NO_PERMISSION_RESPOND: 'You do not have permission to respond to this request',
} as const;

/**
 * Standard API response helpers
 */
export const ApiResponse = {
  /**
   * Success response with data
   */
  success: (data: any, status = 200) => 
    NextResponse.json({ success: true, data }, { status }),
  
  /**
   * Success response with data array and count
   */
  successWithCount: (data: any[], status = 200) => 
    NextResponse.json({ success: true, data, count: data.length }, { status }),
  
  /**
   * Error response with message
   */
  error: (message: string, status = 500) => 
    NextResponse.json({ success: false, error: message }, { status }),
  
  /**
   * 401 Unauthorized response
   */
  unauthorized: () => 
    NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
  
  /**
   * 403 Forbidden response
   */
  forbidden: (message?: string) => 
    NextResponse.json({ 
      success: false, 
      error: message || 'Forbidden' 
    }, { status: 403 }),
  
  /**
   * 404 Not Found response
   */
  notFound: (resource = 'Resource') => 
    NextResponse.json({ error: `${resource} not found` }, { status: 404 }),
  
  /**
   * 400 Bad Request response for validation errors
   */
  validationError: (message: string) =>
    NextResponse.json({ error: message }, { status: 400 }),
  
  /**
   * Success response with message
   */
  successMessage: (message: string, status = 200) =>
    NextResponse.json({ success: true, message }, { status }),
  
  /**
   * Created response (201)
   */
  created: (data: any, message?: string) =>
    NextResponse.json({ success: true, message: message || 'Created successfully', data }, { status: 201 }),
  
  /**
   * Authorization-specific error responses
   */
  
  /**
   * Not owner error - user doesn't own the resource
   */
  notOwner: () => 
    NextResponse.json({ 
      success: false, 
      error: 'You do not have permission to access this resource' 
    }, { status: 403 }),
  
  /**
   * Insufficient role error - user doesn't have required role(s)
   */
  insufficientRole: (requiredRoles?: string[]) => 
    NextResponse.json({ 
      success: false,
      error: requiredRoles 
        ? `This action requires one of the following roles: ${requiredRoles.join(', ')}`
        : 'Insufficient permissions'
    }, { status: 403 }),
};

