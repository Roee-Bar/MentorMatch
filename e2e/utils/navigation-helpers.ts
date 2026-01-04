/**
 * Navigation Helper Utilities
 * 
 * Reusable helpers for navigation operations in E2E tests.
 */

import { Page } from '@playwright/test';
import { waitForURL } from './wait-strategies';
import { verifyAuthenticationComplete } from './auth-helpers';

/**
 * Wait for role-based redirect after login
 * Handles the two-step redirect: '/' → '/authenticated/{role}'
 */
export async function waitForRoleBasedRedirect(
  page: Page,
  expectedRole: 'student' | 'supervisor' | 'admin',
  timeout: number = 15000
): Promise<void> {
  const expectedPath = `/authenticated/${expectedRole}`;
  const startTime = Date.now();

  // First, wait for initial redirect to '/' (if not already there)
  const currentUrl = page.url();
  if (!currentUrl.endsWith('/') && !currentUrl.includes('/authenticated')) {
    try {
      await page.waitForURL(/\/($|\?)/, { timeout: 5000 });
    } catch {
      // If we're already past '/', continue
    }
  }

  // Then wait for redirect to the role-specific dashboard
  // Allow for intermediate redirects
  while (Date.now() - startTime < timeout) {
    const url = page.url();
    
    if (url.includes(expectedPath)) {
      // Wait a bit more to ensure navigation is complete
      await page.waitForLoadState('networkidle', { timeout: 2000 }).catch(() => {});
      return;
    }

    // Check if we're still on home page, wait a bit more
    if (url.endsWith('/') || url.match(/^https?:\/\/[^/]+\/?$/)) {
      await page.waitForTimeout(200);
      continue;
    }

    // If we're on a different authenticated route, that's also acceptable
    if (url.includes('/authenticated/')) {
      await page.waitForTimeout(200);
      continue;
    }

    // Wait a bit before checking again
    await page.waitForTimeout(200);
  }

  // Final check with waitForURL for better error message
  await waitForURL(page, new RegExp(expectedPath), timeout);
}

/**
 * Navigate to role dashboard with authentication verification and retry logic
 */
export async function navigateToDashboard(
  page: Page,
  role: 'student' | 'supervisor' | 'admin',
  timeout: number = 15000,
  maxRetries: number = 3
): Promise<void> {
  const dashboardPath = `/authenticated/${role}`;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Verify authentication before navigating
      await verifyAuthenticationComplete(page, 5000).catch(() => {
        // If auth not complete, wait a bit and try again
      });
      
      // Navigate to dashboard
      await page.goto(dashboardPath);
      
      // Check if we were redirected to home page (auth not ready)
      const currentUrl = page.url();
      if (currentUrl.endsWith('/') || currentUrl.match(/^https?:\/\/[^/]+\/?$/)) {
        // Wait for auth to complete, then retry
        await verifyAuthenticationComplete(page, 5000);
        await page.waitForTimeout(500);
        continue;
      }
      
      // Wait for navigation to complete
      await waitForURL(page, new RegExp(dashboardPath), timeout);
      return;
    } catch (error) {
      if (attempt === maxRetries - 1) {
        throw error;
      }
      
      // Wait with exponential backoff before retry
      const backoffDelay = Math.min(1000 * Math.pow(2, attempt), 3000);
      await page.waitForTimeout(backoffDelay);
    }
  }
}

/**
 * Navigate to role dashboard with authentication verification
 */
export async function navigateToRoleDashboard(
  page: Page,
  role: 'student' | 'supervisor' | 'admin',
  timeout: number = 15000
): Promise<void> {
  return navigateToDashboard(page, role, timeout);
}

/**
 * Wait for role redirect after authentication
 */
export async function waitForRoleRedirect(
  page: Page,
  role: 'student' | 'supervisor' | 'admin',
  timeout: number = 15000
): Promise<void> {
  return waitForRoleBasedRedirect(page, role, timeout);
}

/**
 * Verify dashboard access
 */
export async function verifyDashboardAccess(
  page: Page,
  role: 'student' | 'supervisor' | 'admin',
  timeout: number = 5000
): Promise<void> {
  const expectedPath = `/authenticated/${role}`;
  const currentUrl = page.url();
  
  if (!currentUrl.includes(expectedPath)) {
    throw new Error(
      `Expected to be on ${role} dashboard (${expectedPath}), but current URL is: ${currentUrl}`
    );
  }
}

