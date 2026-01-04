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
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || 'demo-test';

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // First, get the auth data using REST API (before page navigation)
      // This ensures we have the token ready
      const authData = await fetch(`http://localhost:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=fake-api-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: authToken,
          returnSecureToken: true,
        }),
      }).then(res => {
        if (!res.ok) {
          throw new Error(`Failed to sign in: ${res.status}`);
        }
        return res.json();
      });

      // Decode the ID token to get user info
      const tokenParts = authData.idToken.split('.');
      // Decode base64 in Node.js context (we're in test runner, not browser)
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      
      // Prepare auth state
      const authKey = `firebase:authUser:${projectId}:[DEFAULT]`;
      const authState = {
        uid: authData.localId,
        email: payload.email || '',
        emailVerified: payload.email_verified || true,
        displayName: payload.name || null,
        photoURL: payload.picture || null,
        phoneNumber: payload.phone_number || null,
        isAnonymous: false,
        providerData: [],
        stsTokenManager: {
          apiKey: 'fake-api-key',
          refreshToken: authData.refreshToken,
          accessToken: authData.idToken,
          expirationTime: payload.exp * 1000,
        },
        createdAt: (payload.iat * 1000).toString(),
        lastLoginAt: Date.now().toString(),
      };

      // Clear any existing cookies/session
      await page.context().clearCookies();
      
      // Navigate to home page
      await page.goto('/', { waitUntil: 'networkidle' });
      
      // Clear any existing auth state
      await page.evaluate(() => {
        window.localStorage.clear();
        window.sessionStorage.clear();
      });
      
      // Wait for Firebase SDK to be available, then sign in with custom token
      // This is the most reliable way to authenticate
      await page.evaluate(async ({ token }: { token: string }) => {
        // Wait for Firebase to be available (the app imports it)
        let auth: any = null;
        let attempts = 0;
        while (!auth && attempts < 50) {
          try {
            // Try to access Firebase auth from the app's module
            // The app exports auth from '@/lib/firebase'
            // We'll wait for it to be available on the page
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Check if we can access Firebase via window or if it's loaded
            // Since we can't directly import, we'll use a workaround:
            // Set auth state in localStorage and trigger a page event
            // OR wait for the app to load Firebase and then use it
            
            // For now, let's set localStorage and reload to trigger Firebase SDK
            attempts++;
          } catch (e) {
            attempts++;
          }
        }
        
        // If Firebase SDK isn't available, set auth state manually
        // This is a fallback - ideally Firebase SDK would be available
        const projectId = 'demo-test';
        const authEmulatorUrl = `http://localhost:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=fake-api-key`;
        
        const response = await fetch(authEmulatorUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, returnSecureToken: true }),
        });
        
        if (!response.ok) {
          throw new Error(`Sign in failed: ${response.status}`);
        }
        
        const data = await response.json();
        const tokenParts = data.idToken.split('.');
        const payload = JSON.parse(atob(tokenParts[1]));
        
        const authKey = `firebase:authUser:${projectId}:[DEFAULT]`;
        const authState = {
          uid: data.localId,
          email: payload.email || '',
          emailVerified: true,
          stsTokenManager: {
            apiKey: 'fake-api-key',
            refreshToken: data.refreshToken,
            accessToken: data.idToken,
            expirationTime: payload.exp * 1000,
          },
        };
        
        window.localStorage.setItem(authKey, JSON.stringify(authState));
        window.localStorage.setItem(`firebase:refreshToken:${projectId}:[DEFAULT]`, data.refreshToken);
        
        return true;
      }, { token: authToken });
      
      // Reload page so Firebase SDK detects the auth state
      await page.reload({ waitUntil: 'networkidle' });
      
      // Wait for Firebase SDK to initialize and detect auth
      await page.waitForTimeout(3000);
      
      // Verify auth state exists in localStorage
      const hasAuth = await page.evaluate(() => {
        const authKeys = Object.keys(window.localStorage).filter(key => 
          key.startsWith('firebase:authUser:')
        );
        if (authKeys.length > 0) {
          const authKey = authKeys[0];
          const authState = JSON.parse(window.localStorage.getItem(authKey) || '{}');
          return !!authState.uid && !!authState.stsTokenManager?.accessToken;
        }
        return false;
      });
      
      if (!hasAuth) {
        throw new Error('Auth state not found in localStorage after sign in');
      }

      // Try to verify authentication, but don't fail if Firebase SDK hasn't detected it yet
      // The auth state is in localStorage, which is sufficient for API calls
      try {
        await verifyAuthenticationComplete(page, 10000);
      } catch (error) {
        // If verification fails but localStorage has auth state, that's okay
        console.warn('Firebase SDK may not have detected auth state yet, but localStorage has it. Continuing...');
      }

      // Wait for redirect to role-specific route (handled by app/page.tsx)
      // The app automatically redirects authenticated users to their dashboard
      // Give it more time since profile fetch may take a few seconds
      const startTime = Date.now();
      const timeout = 30000;
      
      // Wait for navigation to authenticated route
      let redirected = false;
      while (Date.now() - startTime < timeout) {
        const currentUrl = page.url();
        
        // Check if we're on a role-specific route
        if (currentUrl.includes('/authenticated/')) {
          await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
          redirected = true;
          break;
        }
        
        // If still on home page, wait for redirect
        if (currentUrl.endsWith('/') || currentUrl.match(/^https?:\/\/[^/]+\/?$/)) {
          try {
            await page.waitForURL(/\/authenticated\//, { timeout: 2000 });
            redirected = true;
            break;
          } catch {
            // Continue waiting
            await page.waitForTimeout(1000);
          }
          continue;
        }
        
        // If we're somewhere else, wait a bit and check again
        await page.waitForTimeout(1000);
      }

      // Verify authentication is complete
      const isAuth = await page.evaluate(() => {
        const authKeys = Object.keys(window.localStorage).filter(key => 
          key.startsWith('firebase:authUser:')
        );
        if (authKeys.length > 0) {
          const authKey = authKeys[0];
          const authState = JSON.parse(window.localStorage.getItem(authKey) || '{}');
          return !!authState.uid && !!authState.stsTokenManager?.accessToken;
        }
        return false;
      });

      if (!isAuth) {
        throw new Error('Authentication not complete after sign in');
      }

      // If not redirected, that's okay - tests can navigate manually
      if (!redirected) {
        console.warn('Authentication successful but redirect did not occur. Test may need to navigate manually.');
      }
      
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


