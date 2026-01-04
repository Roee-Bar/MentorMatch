/**
 * Health Check Endpoint
 * 
 * Simple endpoint to verify the Next.js server is running and ready.
 * Used by E2E tests and CI/CD pipelines to verify server readiness.
 * Also exposes test mode configuration for client-side detection.
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const isTestEnv = process.env.NODE_ENV === 'test' || process.env.E2E_TEST === 'true';
  
  return NextResponse.json(
    { 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      service: 'MentorMatch API',
      // Expose test mode info for client-side detection
      testMode: isTestEnv,
      firebase: {
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        authEmulatorHost: process.env.FIREBASE_AUTH_EMULATOR_HOST || process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST,
        firestoreEmulatorHost: process.env.FIRESTORE_EMULATOR_HOST || process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST,
      }
    },
    { status: 200 }
  );
}

