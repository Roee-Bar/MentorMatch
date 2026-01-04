/**
 * Authentication Fixtures for E2E Tests
 * 
 * Playwright fixtures for authenticating users in tests.
 */

import { test as base } from '@playwright/test';
import { adminAuth } from '@/lib/firebase-admin';
import { seedStudent, seedSupervisor, seedAdmin, cleanupUser } from './db-helpers';
import type { Student, Supervisor, Admin } from '@/types/database';
import { verifyAuthenticationComplete } from '../utils/auth-helpers';

/**
 * Extended test context with authentication
 */
type AuthFixtures = {
  authenticatedStudent: {
    uid: string;
    email: string;
    password: string;
    student: Student;
  };
  authenticatedSupervisor: {
    uid: string;
    email: string;
    password: string;
    supervisor: Supervisor;
  };
  authenticatedAdmin: {
    uid: string;
    email: string;
    password: string;
    admin: Admin;
  };
};

/**
 * Create a custom auth token for a user
 */
async function createAuthToken(uid: string): Promise<string> {
  return await adminAuth.createCustomToken(uid);
}

/**
 * Authenticate a user in the browser context using direct Firebase auth injection
 * Uses signInWithCustomToken for fast, reliable authentication
 */
async function authenticateUser(
  page: any,
  email: string,
  password: string,
  authToken: string,
  maxRetries: number = 3
): Promise<void> {
  if (!authToken) {
    throw new Error('Auth token is required for direct authentication');
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Clear any existing auth state before authentication
      await page.evaluate(() => {
        window.localStorage.clear();
        window.sessionStorage.clear();
      });
      await page.context().clearCookies();

      // Navigate to home page first to ensure Firebase is initialized
      await page.goto('/', { waitUntil: 'networkidle' });

      // Wait a bit for Firebase to be fully initialized
      await page.waitForTimeout(500);

      // Inject Firebase auth and sign in with custom token directly
      await page.evaluate(async (token: string) => {
        try {
          // Import Firebase auth functions
          const { signInWithCustomToken } = await import('firebase/auth');
          const { auth } = await import('@/lib/firebase');

          // Sign in with custom token
          await signInWithCustomToken(auth, token);
        } catch (error: any) {
          throw new Error(`Failed to sign in with custom token: ${error?.message || 'Unknown error'}`);
        }
      }, authToken);

      // Wait for authentication to complete
      await verifyAuthenticationComplete(page, 10000);

      // Wait for redirect to role-specific route (handled by app/page.tsx)
      // The app automatically redirects authenticated users to their dashboard
      const startTime = Date.now();
      const timeout = 15000;
      
      while (Date.now() - startTime < timeout) {
        const currentUrl = page.url();
        
        // Check if we're on a role-specific route
        if (currentUrl.includes('/authenticated/')) {
          // Wait for navigation to complete
          await page.waitForLoadState('networkidle', { timeout: 2000 }).catch(() => {});
          return;
        }
        
        // If still on home page, wait a bit for redirect
        if (currentUrl.endsWith('/') || currentUrl.match(/^https?:\/\/[^/]+\/?$/)) {
          await page.waitForTimeout(500);
          continue;
        }
        
        // If we're somewhere else, wait a bit and check again
        await page.waitForTimeout(500);
      }

      // Final check - verify we're authenticated even if redirect didn't happen
      const isAuth = await page.evaluate(async () => {
        const { auth } = await import('@/lib/firebase');
        return auth.currentUser !== null;
      });

      if (!isAuth) {
        throw new Error('Authentication not complete after sign in');
      }

      // If we're authenticated but not redirected, that's acceptable
      // The test can navigate to the dashboard manually if needed
      return;
    } catch (error) {
      lastError = error as Error;
      
      // Log attempt for debugging
      if (process.env.PLAYWRIGHT_VERBOSE === 'true') {
        console.log(`Authentication attempt ${attempt + 1}/${maxRetries} failed:`, error);
      }
      
      // If not the last attempt, wait with exponential backoff
      if (attempt < maxRetries - 1) {
        const backoffDelay = Math.min(1000 * Math.pow(2, attempt), 5000);
        await page.waitForTimeout(backoffDelay);
      }
    }
  }

  // If all retries failed, throw detailed error
  const currentUrl = page.url();
  const authState = await page.evaluate(async () => {
    try {
      const { auth } = await import('@/lib/firebase');
      return {
        currentUser: auth.currentUser !== null,
        currentUserId: auth.currentUser?.uid || null,
      };
    } catch {
      return { currentUser: false, currentUserId: null };
    }
  }).catch(() => ({ currentUser: false, currentUserId: null }));

  throw new Error(
    `Authentication failed after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}\n` +
    `Current URL: ${currentUrl}\n` +
    `Auth state: ${JSON.stringify(authState)}`
  );
}

export const test = base.extend<AuthFixtures>({
  /**
   * Fixture for authenticated student user
   */
  authenticatedStudent: async ({ page }, use) => {
    // Create test student
    const { uid, student } = await seedStudent();
    const email = student.email;
    const password = 'TestPassword123!';

    // Get auth token
    const authToken = await createAuthToken(uid);

    // Authenticate in browser
    await authenticateUser(page, email, password, authToken);

    // Provide to test
    await use({ uid, email, password, student });

    // Cleanup
    await cleanupUser(uid);
  },

  /**
   * Fixture for authenticated supervisor user
   */
  authenticatedSupervisor: async ({ page }, use) => {
    // Create test supervisor
    const { uid, supervisor } = await seedSupervisor();
    const email = supervisor.email;
    const password = 'TestPassword123!';

    // Get auth token
    const authToken = await createAuthToken(uid);

    // Authenticate in browser
    await authenticateUser(page, email, password, authToken);

    // Provide to test
    await use({ uid, email, password, supervisor });

    // Cleanup
    await cleanupUser(uid);
  },

  /**
   * Fixture for authenticated admin user
   */
  authenticatedAdmin: async ({ page }, use) => {
    // Create test admin
    const { uid, admin } = await seedAdmin();
    const email = admin.email;
    const password = 'TestPassword123!';

    // Get auth token
    const authToken = await createAuthToken(uid);

    // Authenticate in browser
    await authenticateUser(page, email, password, authToken);

    // Provide to test
    await use({ uid, email, password, admin });

    // Cleanup
    await cleanupUser(uid);
  },
});

export { expect } from '@playwright/test';


