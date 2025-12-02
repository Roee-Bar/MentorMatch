/**
 * API Handler Middleware
 * 
 * Higher-order functions for wrapping API routes with common functionality
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, AuthResult } from './auth';
import { handleApiError } from './errorHandler';

/**
 * Wrapper that ensures authentication for API routes
 * Automatically handles authentication and error catching
 * 
 * @example
 * export const GET = withAuth(async (req, context, user) => {
 *   // user is guaranteed to be authenticated
 *   return ApiResponse.success(data);
 * });
 */
export function withAuth(
  handler: (req: NextRequest, context: any, user: NonNullable<AuthResult['user']>) => Promise<NextResponse>
) {
  return async (req: NextRequest, context: any) => {
    const authResult = await verifyAuth(req);
    
    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    try {
      return await handler(req, context, authResult.user);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

/**
 * Wrapper that ensures authentication and role-based authorization
 * 
 * @example
 * export const GET = withRoles(['admin', 'supervisor'], async (req, context, user) => {
 *   // user is guaranteed to be authenticated with one of the specified roles
 *   return ApiResponse.success(data);
 * });
 */
export function withRoles(
  allowedRoles: string[],
  handler: (req: NextRequest, context: any, user: NonNullable<AuthResult['user']>) => Promise<NextResponse>
) {
  return async (req: NextRequest, context: any) => {
    const authResult = await verifyAuth(req);
    
    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (!allowedRoles.includes(authResult.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    try {
      return await handler(req, context, authResult.user);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

