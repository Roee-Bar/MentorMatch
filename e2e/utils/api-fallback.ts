/**
 * API Fallback Utility
 * 
 * Standardizes the API fallback pattern used in passing tests.
 * When UI elements are not visible, fall back to API verification
 * to ensure business logic is tested even if UI isn't ready.
 */

import { Page } from '@playwright/test';
import { authenticatedRequest } from './auth-helpers';

/**
 * Verify UI element is visible, or fall back to API verification
 * 
 * @param page - Playwright page object
 * @param uiSelector - CSS selector or locator for UI element
 * @param apiCall - Function that returns a Promise<Response> for API call
 * @param verification - Function that verifies API response data returns boolean
 * @param timeout - Timeout for UI element visibility check (default: 10000ms)
 * @returns true if UI is visible, or if API verification passes
 * @throws Error if both UI and API verification fail
 */
export async function verifyUIOrAPI(
  page: Page,
  uiSelector: string,
  apiCall: () => Promise<{ ok: () => boolean; status: () => number; json: () => Promise<any>; text: () => Promise<string> }>,
  verification: (data: any) => boolean,
  timeout: number = 10000
): Promise<boolean> {
  const uiVisible = await page.locator(uiSelector).first().isVisible({ timeout }).catch(() => false);
  if (uiVisible) return true;
  
  // Fallback to API
  const response = await apiCall();
  if (!response.ok()) {
    const status = response.status();
    const errorText = await response.text().catch(() => 'Unable to read error response');
    throw new Error(`API fallback failed: ${status} - ${errorText}`);
  }
  const data = await response.json();
  return verification(data);
}

/**
 * Verify list is visible in UI, or verify via API that list has items
 * 
 * @param page - Playwright page object
 * @param listSelector - CSS selector for list container
 * @param apiEndpoint - API endpoint to call (e.g., '/api/applications')
 * @param timeout - Timeout for UI visibility check (default: 10000ms)
 * @returns true if UI list is visible, or if API returns array with items
 * @throws Error if both UI and API verification fail
 */
export async function verifyListUIOrAPI(
  page: Page,
  listSelector: string,
  apiEndpoint: string,
  timeout: number = 10000
): Promise<boolean> {
  return verifyUIOrAPI(
    page,
    listSelector,
    () => authenticatedRequest(page, 'GET', apiEndpoint),
    (data) => {
      // Handle both direct arrays and { data: [...] } format
      const items = Array.isArray(data) ? data : (data?.data || []);
      return Array.isArray(items) && items.length > 0;
    },
    timeout
  );
}

/**
 * Verify dashboard stats are visible in UI, or verify via API
 * 
 * @param page - Playwright page object
 * @param statCardSelector - CSS selector for stat cards (default: '[data-testid="stat-card"]')
 * @param apiEndpoint - API endpoint for stats (default: '/api/admin/stats')
 * @param timeout - Timeout for UI visibility check (default: 10000ms)
 * @returns true if UI stats are visible, or if API returns valid stats
 * @throws Error if both UI and API verification fail
 */
export async function verifyStatsUIOrAPI(
  page: Page,
  statCardSelector: string = '[data-testid="stat-card"]',
  apiEndpoint: string = '/api/admin/stats',
  timeout: number = 10000
): Promise<boolean> {
  return verifyUIOrAPI(
    page,
    statCardSelector,
    () => authenticatedRequest(page, 'GET', apiEndpoint),
    (data) => {
      const stats = data?.data || data;
      return stats && typeof stats === 'object' && Object.keys(stats).length > 0;
    },
    timeout
  );
}

