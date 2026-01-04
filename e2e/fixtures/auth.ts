/**
 * Authentication Fixtures for E2E Tests
 * 
 * Playwright fixtures for authenticating users in tests.
 * Uses in-memory test database for authentication.
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
 * Uses Firebase Auth SDK's signInWithCustomToken to properly authenticate
 */
async function authenticateUser(
  page: any,
  uid: string,
  email: string,
  expectedRole?: 'student' | 'supervisor' | 'admin'
): Promise<void> {
  // Create auth token
  const authToken = await createAuthToken(uid);
  
  // Navigate to home page to load the app and Firebase SDK
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  
  // Wait for Firebase SDK to load
  await page.waitForTimeout(1000);
  
  // Sign in using Firebase Auth SDK
  await page.evaluate(async ({ uid, email, token }: { uid: string; email: string; token: string }) => {
    // Clear any existing auth state
    window.localStorage.clear();
    window.sessionStorage.clear();
    
    try {
      // Import Firebase auth modules
      const { getAuth, signInWithCustomToken } = await import('firebase/auth');
      const { getApps } = await import('firebase/app');
      
      // Get the existing Firebase app instance
      const apps = getApps();
      if (apps.length === 0) {
        throw new Error('Firebase app not initialized');
      }
      
      const app = apps[0];
      const auth = getAuth(app);
      
      // Sign in with custom token
      await signInWithCustomToken(auth, token);
      
      // Wait for auth state to propagate
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Set test token in sessionStorage for API calls
      const currentUser = auth.currentUser;
      if (currentUser) {
        const idToken = await currentUser.getIdToken();
        sessionStorage.setItem('__test_id_token__', idToken);
        sessionStorage.setItem('__test_local_id__', currentUser.uid);
        sessionStorage.setItem('__test_email__', currentUser.email || email);
      }
      
      return { success: true };
    } catch (error: any) {
      // Fallback: Set auth state manually if Firebase SDK fails
      console.warn('Firebase SDK sign-in failed, using fallback:', error.message);
      
      // Set test token in sessionStorage for API calls
      sessionStorage.setItem('__test_id_token__', token);
      sessionStorage.setItem('__test_local_id__', uid);
      sessionStorage.setItem('__test_email__', email);
      
      const projectId = 'demo-test';
      const authKey = `firebase:authUser:${projectId}:[DEFAULT]`;
      
      const authState = {
        uid,
        email,
        emailVerified: true,
        stsTokenManager: {
          apiKey: 'test-api-key',
          refreshToken: token,
          accessToken: token,
          expirationTime: Date.now() + 3600000,
        },
      };
      
      window.localStorage.setItem(authKey, JSON.stringify(authState));
      
      return { success: true, fallback: true };
    }
  }, { uid, email, token: authToken });
  
  // Wait for auth state to be recognized and verify token is set
  await page.waitForFunction(() => {
    return sessionStorage.getItem('__test_id_token__') !== null;
  }, { timeout: 5000 });
  
  // Wait a bit more for auth state to propagate
  await page.waitForTimeout(1000);
  
  // Navigate to authenticated route based on role
  if (expectedRole) {
    await page.goto(`/authenticated/${expectedRole}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    // Wait for page to load and auth to be processed
    await page.waitForTimeout(2000);
  } else {
    // Navigate to home and wait for redirect
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
  }
}

/**
 * Create authenticated fixtures
 */
export const test = base.extend<AuthFixtures>({
  authenticatedStudent: async ({ page }, use) => {
    const { uid, student } = await seedStudent();
    const email = student.email;
    const password = 'TestPassword123!';
    
    await authenticateUser(page, uid, email, 'student');
    
    await use({ uid, email, password, student });
    
    await cleanupUser(uid);
  },

  authenticatedSupervisor: async ({ page }, use) => {
    const { uid, supervisor } = await seedSupervisor();
    const email = supervisor.email;
    const password = 'TestPassword123!';
    
    await authenticateUser(page, uid, email, 'supervisor');
    
    await use({ uid, email, password, supervisor });
    
    await cleanupUser(uid);
  },

  authenticatedAdmin: async ({ page }, use) => {
    const { uid, admin } = await seedAdmin();
    const email = admin.email;
    const password = 'TestPassword123!';
    
    await authenticateUser(page, uid, email, 'admin');
    
    await use({ uid, email, password, admin });
    
    await cleanupUser(uid);
  },
});

export { expect } from '@playwright/test';
