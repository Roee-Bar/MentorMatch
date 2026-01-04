/**
 * POST /api/auth/test-seed
 * 
 * Test mode endpoint to seed users and get tokens in the server process.
 * This ensures tokens are created in the same process where they're verified.
 * Only available in test mode.
 */

import { NextRequest } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { ApiResponse } from '@/lib/middleware/response';
import type { Student, Supervisor, Admin } from '@/types/database';

export async function POST(request: NextRequest) {
  // Only allow in test mode
  const isTestEnv = process.env.NODE_ENV === 'test' || process.env.E2E_TEST === 'true';
  if (!isTestEnv) {
    return ApiResponse.error('Test seed endpoint only available in test mode', 403);
  }

  try {
    const body = await request.json();
    const { role = 'student', userData } = body;

    // Create auth user
    const email = userData?.email || `test-${Date.now()}-${Math.random().toString(36).substring(7)}@test.example.com`;
    const password = userData?.password || 'TestPassword123!';
    const displayName = userData?.displayName || userData?.fullName || 'Test User';

    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName,
      emailVerified: true,
    });

    const uid = userRecord.uid;

    // Create user document
    await adminDb.collection('users').doc(uid).set({
      email,
      name: displayName,
      role,
      department: userData?.department || 'Computer Science',
      createdAt: new Date(),
    });

    // Create role-specific document
    if (role === 'student' && userData) {
      await adminDb.collection('students').doc(uid).set({
        ...userData,
        email,
        fullName: displayName,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } else if (role === 'supervisor' && userData) {
      await adminDb.collection('supervisors').doc(uid).set({
        ...userData,
        email,
        fullName: displayName,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } else if (role === 'admin' && userData) {
      await adminDb.collection('admins').doc(uid).set({
        ...userData,
        email,
        fullName: displayName,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Create custom token in server process
    const token = await adminAuth.createCustomToken(uid);

    return ApiResponse.success({
      uid,
      email,
      token,
      role,
    });
  } catch (error: any) {
    return ApiResponse.error(error.message || 'Seed failed', 500);
  }
}

