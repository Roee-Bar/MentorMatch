/**
 * Authentication Middleware
 * 
 * Provides authentication and authorization utilities for API routes
 */

import { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { userService } from '@/lib/services/users/user-service';

export interface AuthResult {
  authenticated: boolean;
  user: {
    uid: string;
    email: string | undefined;
    role: string;
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
    // In test mode, we use custom tokens directly (no ID token conversion needed)
    const isTestEnv = process.env.NODE_ENV === 'test' || process.env.E2E_TEST === 'true';
    
    let decodedToken: { uid: string; email: string; [key: string]: any };
    if (isTestEnv) {
      // In test mode, verify custom token directly
      decodedToken = await adminAuth.verifyIdToken(token);
    } else {
      // In production, verify ID token with revocation check
      decodedToken = await adminAuth.verifyIdToken(token, true);
    }
    
    // Get user profile from Firestore using Admin SDK (bypasses security rules)
    if (isTestEnv) {
      console.log('[TEST AUTH] Verifying token for uid:', decodedToken.uid);
    }
    
    if (isTestEnv) {
      console.log('[TEST AUTH] Attempting to get user profile for uid:', decodedToken.uid);
      // Direct check before using service
      try {
        const { testDb } = await import('@/lib/test-db/adapter');
        const userDoc = await testDb.collection('users').doc(decodedToken.uid).get();
        console.log('[TEST AUTH] Direct DB check - doc exists:', userDoc.exists);
        if (userDoc.exists) {
          const docData = userDoc.data();
          console.log('[TEST AUTH] Direct DB check - doc data:', JSON.stringify(docData, null, 2));
          console.log('[TEST AUTH] Direct DB check - doc id:', userDoc.id);
        }
      } catch (dbError: any) {
        console.error('[TEST AUTH] Error in direct DB check:', dbError?.message || dbError);
      }
    }
    
    const profile = await userService.getUserById(decodedToken.uid);
    
    if (isTestEnv) {
      console.log('[TEST AUTH] userService.getUserById result:', profile ? { id: profile.id, email: profile.email, role: profile.role } : null);
    }
    
    if (!profile) {
      // Log this case specifically as it's a common issue
      if (isTestEnv) {
        console.error('[TEST AUTH] User profile not found for uid:', decodedToken.uid);
        // Try repository directly
        try {
          const { userRepository } = await import('@/lib/repositories/user-repository');
          const repoResult = await userRepository.findById(decodedToken.uid);
          console.error('[TEST AUTH] Repository.findById result:', repoResult ? { id: repoResult.id, email: repoResult.email } : null);
        } catch (repoError: any) {
          console.error('[TEST AUTH] Repository error:', repoError?.message || repoError);
        }
      }
      console.warn(`User profile not found for uid: ${decodedToken.uid}`);
      return { authenticated: false, user: null };
    }
    
    if (isTestEnv) {
      console.log('[TEST AUTH] User profile found:', { uid: profile.id, email: profile.email, role: profile.role });
    }

    return {
      authenticated: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        role: profile.role,
      },
    };
  } catch (error: any) {
    // Provide more detailed error logging
    const errorMessage = error?.message || 'Unknown error';
    const errorCode = error?.code || 'unknown';
    
    // Don't log expected errors (like invalid tokens) at error level
    if (errorCode === 'auth/id-token-expired' || errorCode === 'auth/argument-error') {
      console.debug('Auth verification failed (expected):', errorCode, errorMessage);
    } else {
      console.error('Auth verification error:', { code: errorCode, message: errorMessage, error });
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

