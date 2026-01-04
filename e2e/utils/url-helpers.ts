/**
 * URL Helper Utilities
 * 
 * Reusable helpers for URL operations in E2E tests.
 */

import { Page } from '@playwright/test';
import { waitForURL } from './wait-strategies';

/**
 * Wait for any of multiple possible URL patterns
 */
export async function waitForAnyURL(
  page: Page,
  patterns: (string | RegExp)[],
  timeout: number = 15000
): Promise<void> {
  const startTime = Date.now();
  const checkInterval = 200;
  let currentUrl = '';

  while (Date.now() - startTime < timeout) {
    currentUrl = page.url();

    for (const pattern of patterns) {
      let matches = false;

      if (typeof pattern === 'string') {
        matches = currentUrl.includes(pattern);
      } else {
        matches = pattern.test(currentUrl);
      }

      if (matches) {
        return;
      }
    }

    await page.waitForTimeout(checkInterval);
  }

  // If none matched, throw error with all patterns
  throw new Error(
    `URL did not match any of the expected patterns within ${timeout}ms. ` +
    `Current URL: ${currentUrl}. ` +
    `Expected patterns: ${patterns.map(p => typeof p === 'string' ? p : p.toString()).join(', ')}`
  );
}

/**
 * Verify current URL matches pattern with better error messages
 */
export async function verifyCurrentURL(
  page: Page,
  expectedPattern: string | RegExp,
  timeout: number = 5000
): Promise<void> {
  const currentUrl = page.url();
  let matches = false;

  if (typeof expectedPattern === 'string') {
    matches = currentUrl.includes(expectedPattern);
  } else {
    matches = expectedPattern.test(currentUrl);
  }

  if (!matches) {
    throw new Error(
      `URL verification failed. ` +
      `Expected pattern: ${typeof expectedPattern === 'string' ? expectedPattern : expectedPattern.toString()}. ` +
      `Current URL: ${currentUrl}`
    );
  }
}

/**
 * Get current URL path (without domain, query params, or hash)
 */
export async function getCurrentURLPath(page: Page): Promise<string> {
  const url = new URL(page.url());
  return url.pathname;
}

