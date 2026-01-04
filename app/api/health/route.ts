/**
 * Health Check Endpoint
 * 
 * Enhanced endpoint to verify the Next.js server and all dependencies are running and ready.
 * Used by E2E tests and CI/CD pipelines to verify server readiness.
 * Also exposes test mode configuration for client-side detection.
 */

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { withHealthCheckTimeout } from '@/lib/middleware/timeout';
import { generateCorrelationId, withCorrelationId } from '@/lib/middleware/correlation-id';
import { isResendAvailable } from '@/lib/services/email/resend-client';
import { logger } from '@/lib/logger';

interface HealthCheckResult {
  status: 'ok' | 'error';
  latency?: number;
  error?: string;
}

async function checkFirestore(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  try {
    await withHealthCheckTimeout(
      adminDb.collection('_health').limit(1).get(),
      'firestore-health-check'
    );
    const latency = Date.now() - startTime;
    return { status: 'ok', latency };
  } catch (error: any) {
    const latency = Date.now() - startTime;
    logger.error('Firestore health check failed', error, {
      context: 'HealthCheck',
      data: { latency }
    });
    return { status: 'error', latency, error: error.message || 'Firestore check failed' };
  }
}

async function checkEmailService(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  try {
    // Check if Resend is configured
    const available = isResendAvailable();
    const latency = Date.now() - startTime;
    if (!available) {
      return { status: 'error', latency, error: 'Email service not configured' };
    }
    return { status: 'ok', latency };
  } catch (error: any) {
    const latency = Date.now() - startTime;
    logger.error('Email service health check failed', error, {
      context: 'HealthCheck',
      data: { latency }
    });
    return { status: 'error', latency, error: error.message || 'Email service check failed' };
  }
}

async function checkRateLimitCollection(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  try {
    await withHealthCheckTimeout(
      adminDb.collection('rate_limits').limit(1).get(),
      'rate-limit-health-check'
    );
    const latency = Date.now() - startTime;
    return { status: 'ok', latency };
  } catch (error: any) {
    const latency = Date.now() - startTime;
    logger.error('Rate limit collection health check failed', error, {
      context: 'HealthCheck',
      data: { latency }
    });
    return { status: 'error', latency, error: error.message || 'Rate limit collection check failed' };
  }
}

export async function GET() {
  const correlationId = generateCorrelationId();
  
  return withCorrelationId(correlationId, async () => {
    const isTestEnv = process.env.NODE_ENV === 'test' || process.env.E2E_TEST === 'true';
    
    // Run all health checks in parallel
    const [firestoreCheck, emailCheck, rateLimitCheck] = await Promise.all([
      checkFirestore(),
      checkEmailService(),
      checkRateLimitCollection(),
    ]);

    // Determine overall status
    const allChecksOk = firestoreCheck.status === 'ok' && 
                       emailCheck.status === 'ok' && 
                       rateLimitCheck.status === 'ok';
    
    const criticalChecksOk = firestoreCheck.status === 'ok' && rateLimitCheck.status === 'ok';
    
    let overallStatus: 'ok' | 'degraded' | 'down';
    if (allChecksOk) {
      overallStatus = 'ok';
    } else if (criticalChecksOk) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'down';
    }

    const response = NextResponse.json(
      { 
        status: overallStatus,
        timestamp: new Date().toISOString(),
        service: 'MentorMatch API',
        correlationId,
        checks: {
          firestore: firestoreCheck,
          email: emailCheck,
          rateLimit: rateLimitCheck,
        },
        // Expose test mode info for client-side detection
        testMode: isTestEnv,
        firebase: {
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          authEmulatorHost: process.env.FIREBASE_AUTH_EMULATOR_HOST || process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST,
          firestoreEmulatorHost: process.env.FIRESTORE_EMULATOR_HOST || process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST,
        }
      },
      { status: overallStatus === 'down' ? 503 : overallStatus === 'degraded' ? 200 : 200 }
    );
    
    response.headers.set('X-Correlation-ID', correlationId);
    return response;
  });
}

