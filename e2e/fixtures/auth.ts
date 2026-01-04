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
      // If we have a custom token, use it to authenticate via browser context
      if (authToken) {
        // Get Firebase config from environment
        // In test mode, force 'demo-test' to match admin SDK configuration
        const isTestEnv = process.env.NODE_ENV === 'test' || process.env.E2E_TEST === 'true';
        const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'test-api-key';
        const authEmulatorHost = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST || 'localhost:9099';
        const projectId = isTestEnv 
          ? 'demo-test'  // Force demo-test in test mode to match admin SDK
          : (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-test');
        const isEmulator = authEmulatorHost && !authEmulatorHost.includes('undefined');

        // Inject script to authenticate using Firebase SDK before page loads
        await page.addInitScript(
          ({ token, apiKey, authEmulatorHost, projectId, isEmulator }: { 
            token: string; 
            apiKey: string; 
            authEmulatorHost: string; 
            projectId: string;
            isEmulator: boolean;
          }) => {
            // Function to load Firebase SDK and authenticate
            const authenticate = async () => {
              try {
                // Load Firebase SDK from CDN if not already loaded
                if (!(window as any).firebase) {
                  await new Promise<void>((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js';
                    script.onload = () => {
                      const authScript = document.createElement('script');
                      authScript.src = 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js';
                      authScript.onload = () => resolve();
                      authScript.onerror = reject;
                      document.head.appendChild(authScript);
                    };
                    script.onerror = reject;
                    document.head.appendChild(script);
                  });
                }

                const firebase = (window as any).firebase;
                
                // In test mode, always re-initialize with correct project ID
                // Clear any existing apps to ensure we use demo-test
                let app;
                try {
                  const existingApp = firebase.app();
                  // If existing app has wrong project ID, delete it
                  if (existingApp.options?.projectId !== projectId) {
                    firebase.app().delete();
                    app = firebase.initializeApp({
                      apiKey: apiKey,
                      authDomain: isEmulator ? authEmulatorHost.split(':')[0] : `${projectId}.firebaseapp.com`,
                      projectId: projectId,
                    });
                  } else {
                    app = existingApp;
                  }
                } catch (e) {
                  // No existing app, initialize new one
                  app = firebase.initializeApp({
                    apiKey: apiKey,
                    authDomain: isEmulator ? authEmulatorHost.split(':')[0] : `${projectId}.firebaseapp.com`,
                    projectId: projectId,
                  });
                }

                // Connect to emulator if needed
                if (isEmulator) {
                  try {
                    firebase.auth(app).useEmulator(`http://${authEmulatorHost}`);
                  } catch (e) {
                    // Emulator already connected, ignore
                  }
                }

                // Sign in with custom token
                const auth = firebase.auth(app);
                await auth.signInWithCustomToken(token);
              } catch (error) {
                console.error('Firebase authentication error:', error);
                throw error;
              }
            };

            // Run authentication
            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', authenticate);
            } else {
              authenticate();
            }
          },
          { token: authToken, apiKey, authEmulatorHost, projectId, isEmulator }
        );

        // Navigate to the app
        await page.goto('/');
        
        // Wait for authentication to complete using Firebase-specific checks
        await verifyAuthenticationComplete(page, 15000);
        
        // Wait for redirect to authenticated route
        await page.waitForURL(/\/(authenticated|dashboard|supervisor|admin|$)/, { timeout: 15000 });
        return;
      }

      // Fallback: use email/password login
      await page.goto('/login');
      await page.fill('input[type="email"]', email);
      await page.fill('input[type="password"]', password);
      await page.click('button[type="submit"]');
      
      // Wait for authentication and redirect
      await verifyAuthenticationComplete(page, 15000);
      await page.waitForURL(/\/(authenticated|dashboard|supervisor|admin|$)/, { timeout: 15000 });
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
          if ((window as any).firebase?.auth) {
            (window as any).firebase.auth().signOut();
          }
        });
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

