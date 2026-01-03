/**
 * General Test Helpers
 * 
 * Common utilities for e2e tests.
 */

import { Page } from '@playwright/test';

/**
 * Wait for page to be fully loaded
 */
export async function waitForPageLoad(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Wait for API response
 */
export async function waitForAPIResponse(
  page: Page,
  urlPattern: string | RegExp,
  timeout: number = 30000
): Promise<void> {
  await page.waitForResponse(
    (response) => {
      const url = response.url();
      if (typeof urlPattern === 'string') {
        return url.includes(urlPattern);
      }
      return urlPattern.test(url);
    },
    { timeout }
  );
}

/**
 * Wait for element to be visible and stable
 */
export async function waitForStableElement(
  page: Page,
  selector: string,
  timeout: number = 10000
): Promise<void> {
  const element = page.locator(selector);
  await element.waitFor({ state: 'visible', timeout });
  // Wait a bit more for any animations or transitions
  await page.waitForTimeout(300);
}

/**
 * Fill form field with retry
 */
export async function fillFieldWithRetry(
  page: Page,
  selector: string,
  value: string,
  retries: number = 3
): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      await page.fill(selector, value);
      // Verify the value was set
      const actualValue = await page.inputValue(selector);
      if (actualValue === value) {
        return;
      }
    } catch (error) {
      if (i === retries - 1) throw error;
      await page.waitForTimeout(500);
    }
  }
}

/**
 * Click element with retry
 */
export async function clickWithRetry(
  page: Page,
  selector: string,
  retries: number = 3
): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      await page.click(selector);
      return;
    } catch (error) {
      if (i === retries - 1) throw error;
      await page.waitForTimeout(500);
    }
  }
}

/**
 * Wait for navigation to complete
 */
export async function waitForNavigation(
  page: Page,
  urlPattern?: string | RegExp
): Promise<void> {
  await page.waitForLoadState('networkidle');
  if (urlPattern) {
    if (typeof urlPattern === 'string') {
      await page.waitForURL((url) => url.href.includes(urlPattern));
    } else {
      await page.waitForURL(urlPattern);
    }
  }
}

/**
 * Get text content safely (handles null)
 */
export async function getTextContent(
  page: Page,
  selector: string
): Promise<string> {
  const element = page.locator(selector);
  const text = await element.textContent();
  return text?.trim() || '';
}

/**
 * Check if element exists
 */
export async function elementExists(
  page: Page,
  selector: string
): Promise<boolean> {
  const count = await page.locator(selector).count();
  return count > 0;
}

/**
 * Wait for element to disappear
 */
export async function waitForElementToDisappear(
  page: Page,
  selector: string,
  timeout: number = 5000
): Promise<void> {
  await page.waitForSelector(selector, { state: 'hidden', timeout });
}

/**
 * Take screenshot with timestamp
 */
export async function takeScreenshot(
  page: Page,
  name: string
): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({ path: `test-results/screenshots/${name}-${timestamp}.png` });
}

/**
 * Generate unique test identifier
 */
export function generateTestId(prefix: string = 'test'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

