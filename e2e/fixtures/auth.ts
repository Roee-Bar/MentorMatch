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
 * Authenticate a user in the browser context with retry logic
 * Uses email/password login for reliability
 */
async function authenticateUser(
  page: any,
  email: string,
  password: string,
  authToken?: string,
  maxRetries: number = 3
): Promise<void> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Always use email/password login for reliability
      // The custom token approach is complex with modular Firebase SDK
      await page.goto('/login');
      
      // Wait for login form to be ready
      await page.waitForSelector('input[type="email"]', { timeout: 10000 });
      await page.waitForSelector('input[type="password"]', { timeout: 10000 });
      
      // Fill and submit login form
      await page.fill('input[type="email"]', email);
      await page.fill('input[type="password"]', password);
      await page.click('button[type="submit"]');
      
      // Wait for authentication to complete
      await verifyAuthenticationComplete(page, 20000);
      
      // Wait for redirect - could be to home page first, then to role-specific route
      await page.waitForURL(/\/(authenticated|dashboard|supervisor|admin|login|$)/, { timeout: 20000 });
      
      // If we're still on login page, authentication might have failed
      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        // Check for error message
        const errorMessage = await page.locator('[role="alert"], .error, .text-red').first().textContent().catch(() => null);
        if (errorMessage) {
          throw new Error(`Login failed: ${errorMessage}`);
        }
        // Wait a bit more in case redirect is delayed
        await page.waitForTimeout(2000);
        const newUrl = page.url();
        if (newUrl.includes('/login')) {
          throw new Error('Login failed - still on login page after submission');
        }
      }
      
      // If we're on home page, wait for redirect to role-specific route
      if (currentUrl.endsWith('/') || currentUrl.match(/^https?:\/\/[^/]+\/?$/)) {
        // Wait for redirect to role-specific route (handled by app/page.tsx)
        await page.waitForURL(/\/authenticated\/(student|supervisor|admin)/, { timeout: 15000 }).catch(() => {
          // If redirect doesn't happen, check if we're authenticated
          // Sometimes the redirect happens but URL check fails
          const finalUrl = page.url();
          if (!finalUrl.includes('/authenticated/')) {
            // Give it one more chance
            await page.waitForTimeout(2000);
            const checkUrl = page.url();
            if (!checkUrl.includes('/authenticated/')) {
              // Still not redirected, but authentication might be complete
              // Verify auth state
              const isAuth = await page.evaluate(() => {
                try {
                  // Check if Firebase auth is available (app uses modular SDK)
                  // The app might expose auth differently
                  return window.localStorage.getItem('firebase:authUser') !== null;
                } catch {
                  return false;
                }
              });
              if (!isAuth) {
                throw new Error('Authentication not complete after login');
              }
            }
          }
        });
      }
      
      // Verify we're authenticated by checking URL or auth state
      const finalUrl = page.url();
      if (!finalUrl.includes('/authenticated/') && !finalUrl.endsWith('/')) {
        // Might be on an error page or something else
        throw new Error(`Unexpected URL after login: ${finalUrl}`);
      }
      
      return;
    } catch (error) {
      lastError = error as Error;
      
      // If not the last attempt, wait with exponential backoff
      if (attempt < maxRetries - 1) {
        const backoffDelay = Math.min(1000 * Math.pow(2, attempt), 5000);
        await page.waitForTimeout(backoffDelay);
        
        // Clear any existing auth state before retry
        await page.evaluate(() => {
          window.localStorage.clear();
          window.sessionStorage.clear();
        });
        await page.context().clearCookies();
      }
    }
  }

  // If all retries failed, throw the last error
  throw new Error(`Authentication failed after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
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

