/**
 * API Handler Middleware
 * 
 * Higher-order functions for wrapping API routes with common functionality
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, AuthResult } from './auth';
import { handleApiError } from './errorHandler';
import { ApiResponse } from './response';
import { logger } from '@/lib/logger';

/**
 * API Context with typed parameters and optional cached resource
 */
export interface ApiContext<TParams = Record<string, string>, TCached = undefined> {
  params: TParams;
  cachedResource?: TCached;
}

/**
 * Authorization options for withAuth middleware
 */
export interface AuthOptions<TParams = Record<string, string>, TCached = undefined> {
  /** User must own the resource (user.uid === resourceId) */
  requireOwner?: boolean;
  
  /** User must own the resource OR be an admin */
  requireOwnerOrAdmin?: boolean;
  
  /** Additional roles that can access (works with requireOwner/requireOwnerOrAdmin) */
  allowedRoles?: string[];
  
  /** Custom resource access check function */
  requireResourceAccess?: (
    user: NonNullable<AuthResult['user']>, 
    context: ApiContext<TParams, TCached>,
    resource?: TCached | null
  ) => Promise<boolean> | boolean;
  
  /** Which route param contains the resource owner ID (default: 'id') */
  resourceIdParam?: string;
  
  /** Function to load resource once and cache in context */
  resourceLoader?: (params: TParams) => Promise<TCached | null>;
  
  /** Name of the resource for better error messages (e.g., "Application", "Partnership") */
  resourceName?: string;
}

/**
 * Wraps a resource loader with standardized error handling and logging
 * 
 * @param loader - The resource loader function to wrap
 * @param resourceName - Name of the resource being loaded (for logging)
 * @returns Wrapped loader that catches errors and returns null on failure
 */
function wrapResourceLoader<TParams, TCached>(
  loader: (params: TParams) => Promise<TCached | null>,
  resourceName: string
): (params: TParams) => Promise<TCached | null> {
  return async (params: TParams) => {
    try {
      return await loader(params);
    } catch (error) {
      logger.error(`Failed to load ${resourceName}`, error, {
        context: 'ResourceLoader',
        data: { params }
      });
      return null;
    }
  };
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
export function withAuth<TParams = Record<string, string>, TCached = undefined>(
  handler: (req: NextRequest, context: ApiContext<TParams, TCached>, user: NonNullable<AuthResult['user']>) => Promise<NextResponse>,
  options?: AuthOptions<TParams, TCached>
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
      let cachedResource: TCached | null | undefined;
      if (options.resourceLoader && resourceId) {
        const wrappedLoader = wrapResourceLoader(
          options.resourceLoader,
          options.resourceName || 'resource'
        );
        cachedResource = await wrappedLoader(context.params);
        // Attach to context for handler use
        context.cachedResource = cachedResource ?? undefined;
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
          // Log authorization failure for debugging (only in development/test)
          if (process.env.NODE_ENV !== 'production') {
            console.debug('Authorization check failed', {
              userUid: user.uid,
              resourceId,
              isOwner,
              isAdmin,
              userRole: user.role,
              hasAllowedRole,
              allowedRoles: options.allowedRoles
            });
          }
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
export function withRoles<TParams = Record<string, string>>(
  allowedRoles: string[],
  handler: (req: NextRequest, context: ApiContext<TParams, undefined>, user: NonNullable<AuthResult['user']>) => Promise<NextResponse>
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

