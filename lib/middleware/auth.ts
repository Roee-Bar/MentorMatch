/**
 * Authentication Middleware
 * 
 * Provides authentication and authorization utilities for API routes
 */

import { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { userService } from '@/lib/services/users/user-service';
import { logger } from '@/lib/logger';
import { withAuthTimeout } from '@/lib/middleware/timeout';
import type { DecodedIdToken } from 'firebase-admin/auth';

export interface AuthResult {
  authenticated: boolean;
  user: {
    uid: string;
    email: string | undefined;
    role: string;
    emailVerified?: boolean;
  } | null;
}

/**
 * Verify Firebase ID token and return user information
 */
export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { authenticated: false, user: null };
    }

    // Extract token using regex for robustness (handles multiple spaces, case variations)
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    
    if (!token) {
      return { authenticated: false, user: null };
    }
    
    // Verify Firebase token using Admin SDK
    // In production, verify ID token with revocation check
    const decodedToken = await withAuthTimeout(
      adminAuth.verifyIdToken(token, true) as Promise<DecodedIdToken>,
      'verifyIdToken'
    );
    
    // Get user profile from Firestore using Admin SDK (bypasses security rules)
    let profile;
    try {
      profile = await withAuthTimeout(
        userService.getUserById(decodedToken.uid),
        'getUserById'
      );
    } catch (serviceError: any) {
      throw serviceError;
    }
    
    if (!profile) {
      logger.warn('User profile not found for uid', {
        context: 'Auth',
        data: { uid: decodedToken.uid }
      });
      return { authenticated: false, user: null };
    }

    // Check email verification status
    const emailVerified = decodedToken.email_verified || false;

    return {
      authenticated: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        role: profile.role,
        emailVerified, // Include verification status in user object
      },
    };
  } catch (error: any) {
    // Provide more detailed error logging
    const errorMessage = error?.message || 'Unknown error';
    const errorCode = error?.code || 'unknown';
    
    // Don't log expected errors (like invalid tokens) at error level
    if (errorCode === 'auth/id-token-expired' || errorCode === 'auth/argument-error') {
      logger.debug('Auth verification failed (expected)', {
        context: 'Auth',
        data: { code: errorCode, message: errorMessage }
      });
    } else {
      logger.error('Auth verification error', error, {
        context: 'Auth',
        data: { code: errorCode, message: errorMessage }
      });
    }
    
    return { authenticated: false, user: null };
  }
}

export interface AuthorizationResult {
  authorized: boolean;
  status: number;
  error?: string;
  user: AuthResult['user'];
}

/**
 * Verify user has one of the required roles
 */
export async function requireRole(request: NextRequest, ...allowedRoles: string[]): Promise<AuthorizationResult> {
  const authResult = await verifyAuth(request);
  
  if (!authResult.authenticated || !authResult.user) {
    return { authorized: false, status: 401, error: 'Unauthorized', user: null };
  }
  
  if (!allowedRoles.includes(authResult.user.role)) {
    return { authorized: false, status: 403, error: 'Forbidden', user: authResult.user };
  }
  
  return { authorized: true, status: 200, user: authResult.user };
}

/**
 * Verify user is either the resource owner or an admin
 */
export async function requireOwnerOrAdmin(request: NextRequest, resourceUserId: string): Promise<AuthorizationResult> {
  const authResult = await verifyAuth(request);
  
  if (!authResult.authenticated || !authResult.user) {
    return { authorized: false, status: 401, error: 'Unauthorized', user: null };
  }
  
  const isOwner = authResult.user.uid === resourceUserId;
  const isAdmin = authResult.user.role === 'admin';
  
  if (!isOwner && !isAdmin) {
    return { authorized: false, status: 403, error: 'Forbidden', user: authResult.user };
  }
  
  return { authorized: true, status: 200, user: authResult.user };
}

/**
 * Verify user is authenticated and has verified their email
 * @param request - Next.js request object
 * @returns Authorization result with email verification check
 */
export async function requireVerifiedEmail(request: NextRequest): Promise<AuthorizationResult> {
  const authResult = await verifyAuth(request);
  
  if (!authResult.authenticated || !authResult.user) {
    return { authorized: false, status: 401, error: 'Unauthorized', user: null };
  }
  
  // Check if email is verified
  if (!authResult.user.emailVerified) {
    return { 
      authorized: false, 
      status: 403, 
      error: 'Email verification required. Please verify your email address to access this resource.', 
      user: authResult.user 
    };
  }
  
  return { authorized: true, status: 200, user: authResult.user };
}

