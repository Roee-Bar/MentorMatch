/**
 * Authentication Middleware
 * 
 * Provides authentication and authorization utilities for API routes
 */

import { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { AdminUserService } from '@/lib/services/admin-services';

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

    const token = authHeader.split('Bearer ')[1];
    
    // Verify Firebase token using Admin SDK
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Get user profile from Firestore using Admin SDK (bypasses security rules)
    const profile = await AdminUserService.getUserById(decodedToken.uid);
    
    if (!profile) {
      return { authenticated: false, user: null };
    }

    return {
      authenticated: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        role: profile.role,
      },
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return { authenticated: false, user: null };
  }
}

