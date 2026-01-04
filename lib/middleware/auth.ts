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
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/b58b9ea6-ea87-472c-b297-772b0ab30cc5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/middleware/auth.ts:25',message:'verifyAuth entry',data:{hasAuthHeader:!!request.headers.get('authorization')},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
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
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/b58b9ea6-ea87-472c-b297-772b0ab30cc5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/middleware/auth.ts:44',message:'Before verifyIdToken',data:{isTestEnv,tokenLength:token.length},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    let decodedToken: DecodedIdToken;
    if (isTestEnv) {
      // In test mode, verify custom token directly
      try {
        decodedToken = await withAuthTimeout(
          adminAuth.verifyIdToken(token) as Promise<DecodedIdToken>,
          'verifyIdToken (test)'
        );
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/b58b9ea6-ea87-472c-b297-772b0ab30cc5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/middleware/auth.ts:48',message:'verifyIdToken success',data:{uid:decodedToken.uid},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
      } catch (verifyError: any) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/b58b9ea6-ea87-472c-b297-772b0ab30cc5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/middleware/auth.ts:52',message:'verifyIdToken error',data:{error:verifyError?.message,code:verifyError?.code},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        throw verifyError;
      }
    } else {
      // In production, verify ID token with revocation check
      decodedToken = await withAuthTimeout(
        adminAuth.verifyIdToken(token, true) as Promise<DecodedIdToken>,
        'verifyIdToken (production)'
      );
    }
    
    // Get user profile from Firestore using Admin SDK (bypasses security rules)
    if (isTestEnv) {
      logger.debug('[TEST AUTH] Verifying token for uid', {
        context: 'Auth',
        data: { uid: decodedToken.uid }
      });
    }
    
    if (isTestEnv) {
      logger.debug('[TEST AUTH] Attempting to get user profile for uid', {
        context: 'Auth',
        data: { uid: decodedToken.uid }
      });
      // Direct check before using service
      try {
        const { testDb } = await import('@/lib/test-db/adapter');
        const userDoc = await testDb.collection('users').doc(decodedToken.uid).get();
        logger.debug('[TEST AUTH] Direct DB check - doc exists', {
          context: 'Auth',
          data: { uid: decodedToken.uid, exists: userDoc.exists }
        });
        if (userDoc.exists) {
          const docData = userDoc.data();
          logger.debug('[TEST AUTH] Direct DB check - doc data', {
            context: 'Auth',
            data: { uid: decodedToken.uid, docData: JSON.stringify(docData, null, 2), docId: userDoc.id }
          });
        }
      } catch (dbError: any) {
        logger.error('[TEST AUTH] Error in direct DB check', dbError, {
          context: 'Auth',
          data: { uid: decodedToken.uid }
        });
      }
    }
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/b58b9ea6-ea87-472c-b297-772b0ab30cc5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/middleware/auth.ts:75',message:'Before getUserById',data:{uid:decodedToken.uid},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    let profile;
    try {
      profile = await withAuthTimeout(
        userService.getUserById(decodedToken.uid),
        'getUserById'
      );
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/b58b9ea6-ea87-472c-b297-772b0ab30cc5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/middleware/auth.ts:79',message:'getUserById success',data:{profile:profile?{id:profile.id,email:profile.email,role:profile.role}:null},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
    } catch (serviceError: any) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/b58b9ea6-ea87-472c-b297-772b0ab30cc5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/middleware/auth.ts:83',message:'getUserById error',data:{error:serviceError?.message,stack:serviceError?.stack?.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      throw serviceError;
    }
    
    if (isTestEnv) {
      logger.debug('[TEST AUTH] userService.getUserById result', {
        context: 'Auth',
        data: { profile: profile ? { id: profile.id, email: profile.email, role: profile.role } : null }
      });
    }
    
    if (!profile) {
      // Log this case specifically as it's a common issue
      if (isTestEnv) {
        logger.error('[TEST AUTH] User profile not found for uid', new Error('User profile not found'), {
          context: 'Auth',
          data: { uid: decodedToken.uid }
        });
        // Try repository directly
        try {
          const { userRepository } = await import('@/lib/repositories/user-repository');
          const repoResult = await userRepository.findById(decodedToken.uid);
          logger.error('[TEST AUTH] Repository.findById result', new Error('Repository check'), {
            context: 'Auth',
            data: { repoResult: repoResult ? { id: repoResult.id, email: repoResult.email } : null }
          });
        } catch (repoError: any) {
          logger.error('[TEST AUTH] Repository error', repoError, {
            context: 'Auth',
            data: { uid: decodedToken.uid }
          });
        }
      }
      logger.warn('User profile not found for uid', {
        context: 'Auth',
        data: { uid: decodedToken.uid }
      });
      return { authenticated: false, user: null };
    }
    
    if (isTestEnv) {
      logger.debug('[TEST AUTH] User profile found', {
        context: 'Auth',
        data: { uid: profile.id, email: profile.email, role: profile.role }
      });
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
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/b58b9ea6-ea87-472c-b297-772b0ab30cc5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/middleware/auth.ts:110',message:'verifyAuth catch block',data:{error:error?.message,code:error?.code,stack:error?.stack?.substring(0,300)},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
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

