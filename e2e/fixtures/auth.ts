/**
 * Authentication Fixtures for E2E Tests
 * 
 * Playwright fixtures for authenticating users in tests.
 */

import { test as base } from '@playwright/test';
import { adminAuth } from '@/lib/firebase-admin';
import { seedStudent, seedSupervisor, seedAdmin, cleanupUser } from './db-helpers';
import type { Student, Supervisor, Admin } from '@/types/database';

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
 * Authenticate a user in the browser context
 */
async function authenticateUser(
  page: any,
  email: string,
  password: string,
  authToken?: string
): Promise<void> {
  // If we have a custom token, use it to authenticate via browser context
  if (authToken) {
    // Get Firebase config from environment
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'test-api-key';
    const authEmulatorHost = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST || 'localhost:9099';
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-test';
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
            
            // Initialize Firebase app if not already initialized
            let app;
            try {
              app = firebase.app();
            } catch (e) {
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
    
    // Wait for authentication to complete - check for auth state in localStorage or Firebase
    await page.waitForFunction(() => {
      return window.localStorage.getItem('firebase:authUser') !== null ||
             document.cookie.includes('auth') ||
             (window as any).firebase?.auth()?.currentUser !== null;
    }, { timeout: 10000 });
    await page.waitForURL(/\/(authenticated|dashboard|supervisor|admin|$)/, { timeout: 15000 });
    return;
  }

  // Otherwise, use email/password login
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(authenticated|dashboard|supervisor|admin|$)/, { timeout: 10000 });
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

