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
      // Navigate to home page first to ensure we have a valid page context
      // (Can't access localStorage on about:blank)
      await page.goto('/', { waitUntil: 'networkidle' });

      // Clear any existing auth state after navigation
      await page.evaluate(() => {
        window.localStorage.clear();
        window.sessionStorage.clear();
      });
      await page.context().clearCookies();

      // Wait a bit for Firebase to be fully initialized
      await page.waitForTimeout(1000);

      // Use Firebase REST API from browser context to sign in with custom token
      // This avoids module resolution issues and works with the emulator
      const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || 'demo-test';
      
      const authData = await page.evaluate(async ({ token, projectId }: { token: string; projectId: string }) => {
        // Use Firebase Auth Emulator REST API
        const authEmulatorUrl = `http://localhost:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=fake-api-key`;
        
        const response = await fetch(authEmulatorUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: token,
            returnSecureToken: true,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to sign in with custom token: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        
        // Decode the ID token to get user info
        const tokenParts = data.idToken.split('.');
        const payload = JSON.parse(atob(tokenParts[1]));
        
        // Firebase stores auth state in localStorage with this key format
        const authKey = `firebase:authUser:${projectId}:[DEFAULT]`;
        const authState = {
          uid: data.localId,
          email: payload.email || '',
          emailVerified: payload.email_verified || true,
          displayName: payload.name || null,
          photoURL: payload.picture || null,
          phoneNumber: payload.phone_number || null,
          isAnonymous: false,
          providerData: [],
          stsTokenManager: {
            apiKey: 'fake-api-key',
            refreshToken: data.refreshToken,
            accessToken: data.idToken,
            expirationTime: payload.exp * 1000, // Convert to milliseconds
          },
          createdAt: (payload.iat * 1000).toString(),
          lastLoginAt: Date.now().toString(),
        };
        
        window.localStorage.setItem(authKey, JSON.stringify(authState));
        
        // Also set the refresh token separately (Firebase format)
        const refreshKey = `firebase:refreshToken:${projectId}:[DEFAULT]`;
        window.localStorage.setItem(refreshKey, data.refreshToken);
        
        // Trigger Firebase to check auth state by dispatching a storage event
        // This helps Firebase SDK recognize the auth state change
        window.dispatchEvent(new StorageEvent('storage', {
          key: authKey,
          newValue: JSON.stringify(authState),
          storageArea: window.localStorage
        }));
        
        return data;
      }, { token: authToken, projectId });

      // Wait a bit for Firebase to process the auth state
      await page.waitForTimeout(1000);
      
      // Reload the page to pick up the auth state and trigger onAuthStateChanged
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);

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
      const isAuth = await page.evaluate(() => {
        // Check localStorage for Firebase auth state
        const authKeys = Object.keys(window.localStorage).filter(key => 
          key.startsWith('firebase:authUser:')
        );
        return authKeys.length > 0;
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
  const authState = await page.evaluate(() => {
    try {
      // Check localStorage for Firebase auth state
      const authKeys = Object.keys(window.localStorage).filter(key => 
        key.startsWith('firebase:authUser:')
      );
      if (authKeys.length > 0) {
        const authKey = authKeys[0];
        const authState = JSON.parse(window.localStorage.getItem(authKey) || '{}');
        return {
          currentUser: !!authState.uid,
          currentUserId: authState.uid || null,
        };
      }
      return { currentUser: false, currentUserId: null };
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


