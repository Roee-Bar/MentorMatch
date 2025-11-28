/**
 * Authentication Middleware
 * 
 * Provides authentication and authorization utilities for API routes
 */

import { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { getUserProfile } from '@/lib/auth';

export interface AuthResult {
  authenticated: boolean;
  user: {
    uid: string;
    email: string | undefined;
    role: string;
  } | null;
}

export interface RoleAuthResult {
  authorized: boolean;
  user?: {
    uid: string;
    email: string | undefined;
    role: string;
  };
  error?: string;
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

    const token = authHeader.split('Bearer ')[1];
    
    // Verify Firebase token using Admin SDK
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Get user profile from Firestore
    const profile = await getUserProfile(decodedToken.uid);
    
    if (!profile.success || !profile.data) {
      return { authenticated: false, user: null };
    }

    return {
      authenticated: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        role: profile.data.role,
      },
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return { authenticated: false, user: null };
  }
}

/**
 * Create a middleware function that requires specific roles
 */
export function requireRole(allowedRoles: string[]) {
  return async (request: NextRequest): Promise<RoleAuthResult> => {
    const authResult = await verifyAuth(request);
    
    if (!authResult.authenticated) {
      return { authorized: false, error: 'Unauthorized' };
    }
    
    if (!authResult.user || !allowedRoles.includes(authResult.user.role)) {
      return { authorized: false, error: 'Forbidden' };
    }
    
    return { authorized: true, user: authResult.user };
  };
}
