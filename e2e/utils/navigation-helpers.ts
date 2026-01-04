/**
 * Navigation Helper Utilities
 * 
 * Reusable helpers for navigation operations in E2E tests.
 */

import { Page } from '@playwright/test';
import { waitForURL } from './wait-strategies';
import { verifyAuthenticationComplete } from './auth-helpers';

/**
 * Wait for role-based redirect after authentication
 * Simplified for direct auth injection - auth is faster, so redirects should be quicker
 */
export async function waitForRoleBasedRedirect(
  page: Page,
  expectedRole: 'student' | 'supervisor' | 'admin',
  timeout: number = 10000
): Promise<void> {
  const expectedPath = `/authenticated/${expectedRole}`;
  const startTime = Date.now();
  const checkInterval = 300;

  // Wait for redirect to the role-specific dashboard
  while (Date.now() - startTime < timeout) {
    const url = page.url();
    
    if (url.includes(expectedPath)) {
      // Wait for navigation to complete
      await page.waitForLoadState('networkidle', { timeout: 2000 }).catch(() => {});
      return;
    }

    // If we're on home page, wait for redirect
    if (url.endsWith('/') || url.match(/^https?:\/\/[^/]+\/?$/)) {
      await page.waitForTimeout(checkInterval);
      continue;
    }

    // If we're on a different authenticated route, wait a bit and check if redirect happens
    if (url.includes('/authenticated/')) {
      await page.waitForTimeout(checkInterval);
      continue;
    }

    // Wait before checking again
    await page.waitForTimeout(checkInterval);
  }

  // Final check with waitForURL for better error message
  const currentUrl = page.url();
  if (!currentUrl.includes(expectedPath)) {
    throw new Error(
      `Expected redirect to ${expectedPath} within ${timeout}ms, but current URL is: ${currentUrl}`
    );
  }
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

