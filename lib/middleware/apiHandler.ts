/**
 * API Handler Middleware
 * 
 * Higher-order functions for wrapping API routes with common functionality
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, AuthResult } from './auth';
import { handleApiError } from './errorHandler';
import { ApiResponse } from './response';

/**
 * Authorization options for withAuth middleware
 */
export interface AuthOptions {
  /** User must own the resource (user.uid === resourceId) */
  requireOwner?: boolean;
  
  /** User must own the resource OR be an admin */
  requireOwnerOrAdmin?: boolean;
  
  /** Additional roles that can access (works with requireOwner/requireOwnerOrAdmin) */
  allowedRoles?: string[];
  
  /** Custom resource access check function */
  requireResourceAccess?: (
    user: NonNullable<AuthResult['user']>, 
    context: any,
    resource?: any
  ) => Promise<boolean> | boolean;
  
  /** Which route param contains the resource owner ID (default: 'id') */
  resourceIdParam?: string;
  
  /** Function to load resource once and cache in context */
  resourceLoader?: (params: any) => Promise<any>;
}

/**
 * Wrapper that ensures authentication for API routes
 * Automatically handles authentication and error catching
 * 
 * @example
 * // Simple authentication
 * export const GET = withAuth(async (req, context, user) => {
 *   return ApiResponse.success(data);
 * });
 * 
 * @example
 * // Owner or Admin authorization
 * export const PUT = withAuth(
 *   async (req, context, user) => { ... },
 *   { requireOwnerOrAdmin: true }
 * );
 * 
 * @example
 * // Owner or specific roles
 * export const GET = withAuth(
 *   async (req, context, user) => { ... },
 *   { requireOwnerOrAdmin: true, allowedRoles: ['supervisor'] }
 * );
 * 
 * @example
 * // Custom resource access check
 * export const GET = withAuth(
 *   async (req, context, user) => { ... },
 *   { 
 *     requireResourceAccess: async (user, { params }) => {
 *       const resource = await getResource(params.id);
 *       return user.uid === resource.ownerId || user.role === 'admin';
 *     }
 *   }
 * );
 * 
 * @example
 * // Resource access with caching (prevents duplicate DB calls)
 * export const GET = withAuth(
 *   async (req, { params, cachedResource }, user) => {
 *     const application = cachedResource; // Already loaded by middleware
 *     return ApiResponse.success(application);
 *   },
 *   { 
 *     resourceLoader: async (params) => await getResource(params.id),
 *     requireResourceAccess: async (user, context, resource) => {
 *       if (!resource) return false;
 *       return user.uid === resource.ownerId || user.role === 'admin';
 *     }
 *   }
 * );
 */
export function withAuth(
  handler: (req: NextRequest, context: any, user: NonNullable<AuthResult['user']>) => Promise<NextResponse>,
  options?: AuthOptions
) {
  return async (req: NextRequest, context: any) => {
    const authResult = await verifyAuth(req);
    
    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = authResult.user;
    
    // Apply authorization checks if options provided
    if (options) {
      const resourceId = context?.params?.[options.resourceIdParam || 'id'];
      
      // Load resource once if loader provided
      let cachedResource;
      if (options.resourceLoader && resourceId) {
        cachedResource = await options.resourceLoader(context.params);
        // Attach to context for handler use
        context.cachedResource = cachedResource;
      }
      
      // Check custom resource access first
      if (options.requireResourceAccess) {
        const hasAccess = await options.requireResourceAccess(user, context, cachedResource);
        if (!hasAccess) {
          return ApiResponse.forbidden('You do not have permission to access this resource');
        }
      }
      // Check owner or admin authorization
      else if (options.requireOwnerOrAdmin && resourceId) {
        const isOwner = user.uid === resourceId;
        const isAdmin = user.role === 'admin';
        const hasAllowedRole = options.allowedRoles?.includes(user.role) || false;
        
        if (!isOwner && !isAdmin && !hasAllowedRole) {
          return ApiResponse.forbidden('You do not have permission to access this resource');
        }
      }
      // Check simple owner authorization
      else if (options.requireOwner && resourceId) {
        const isOwner = user.uid === resourceId;
        
        if (!isOwner) {
          return ApiResponse.forbidden('You do not have permission to access this resource');
        }
      }
    }
    
    try {
      return await handler(req, context, user);
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

