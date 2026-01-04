/**
 * POST /api/auth/test-login
 * 
 * Test mode login endpoint - works with in-memory test database
 * Only available in test mode
 */

import { NextRequest } from 'next/server';
import { testAuthStore } from '@/lib/test-db/auth-store';
import { ApiResponse } from '@/lib/middleware/response';

export async function POST(request: NextRequest) {
  // Only allow in test mode
  const isTestEnv = process.env.NODE_ENV === 'test' || process.env.E2E_TEST === 'true';
  if (!isTestEnv) {
    return ApiResponse.error('Test login endpoint only available in test mode', 403);
  }

  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return ApiResponse.validationError('Email and password are required');
    }

    // Verify password against test auth store
    const user = testAuthStore.verifyPassword(email, password);
    if (!user) {
      return ApiResponse.error('Invalid email or password', 401);
    }

    // Create custom token
    const token = testAuthStore.createCustomToken(user.uid);

    return ApiResponse.success({
      token,
      uid: user.uid,
      email: user.email,
    });
  } catch (error: any) {
    return ApiResponse.error(error.message || 'Login failed', 500);
  }
}

