/**
 * Authentication Helper Utilities
 * 
 * Reusable helpers for authentication operations in E2E tests.
 */

import { Page } from '@playwright/test';

/**
 * Verify that authentication is complete in the browser context
 * Checks Firebase auth state and user profile
 */
export async function verifyAuthenticationComplete(
  page: Page,
  timeout: number = 15000
): Promise<void> {
  const startTime = Date.now();
  const checkInterval = 100;

  while (Date.now() - startTime < timeout) {
    const isAuthenticated = await page.evaluate(() => {
      // Check if Firebase is available and user is authenticated
      const firebase = (window as any).firebase;
      if (firebase?.auth) {
        const auth = firebase.auth();
        const currentUser = auth.currentUser;
        if (currentUser) {
          return true;
        }
      }
      
      // Fallback: check localStorage for auth state
      const authUser = window.localStorage.getItem('firebase:authUser');
      if (authUser) {
        try {
          const user = JSON.parse(authUser);
          return user && user.uid;
        } catch {
          return false;
        }
      }
      
      return false;
    });

    if (isAuthenticated) {
      // Wait a bit more to ensure auth state is fully propagated
      await page.waitForTimeout(500);
      return;
    }

    await page.waitForTimeout(checkInterval);
  }

  throw new Error(`Authentication not complete within ${timeout}ms`);
}

/**
 * Wait for authentication to complete with retry logic
 */
export async function waitForAuthentication(
  page: Page,
  timeout: number = 15000
): Promise<void> {
  return verifyAuthenticationComplete(page, timeout);
}

/**
 * Verify user role by checking the current URL or page content
 */
export async function verifyUserRole(
  page: Page,
  expectedRole: 'student' | 'supervisor' | 'admin',
  timeout: number = 10000
): Promise<void> {
  const startTime = Date.now();
  const checkInterval = 200;

  while (Date.now() - startTime < timeout) {
    const currentUrl = page.url();
    const rolePath = `/authenticated/${expectedRole}`;
    
    if (currentUrl.includes(rolePath)) {
      return;
    }

    await page.waitForTimeout(checkInterval);
  }

  throw new Error(
    `Expected user to be on ${expectedRole} dashboard, but current URL is: ${page.url()}`
  );
}

/**
 * Ensure user is authenticated, with retry logic
 */
export async function ensureAuthenticated(
  page: Page,
  role?: 'student' | 'supervisor' | 'admin',
  timeout: number = 15000
): Promise<void> {
  await verifyAuthenticationComplete(page, timeout);
  
  if (role) {
    await verifyUserRole(page, role, timeout);
  }
}

