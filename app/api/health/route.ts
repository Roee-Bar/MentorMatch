/**
 * Health Check Endpoint
 * 
 * Simple endpoint to verify the Next.js server is running and ready.
 * Used by E2E tests and CI/CD pipelines to verify server readiness.
 */

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      service: 'MentorMatch API'
    },
    { status: 200 }
  );
}

