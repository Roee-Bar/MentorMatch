/**
 * General Test Helpers
 * 
 * Common utilities for e2e tests.
 */

import { Page } from '@playwright/test';

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
  await page.waitForLoadState('domcontentloaded');
  if (urlPattern) {
    if (typeof urlPattern === 'string') {
      await page.waitForURL((url) => url.href.includes(urlPattern), { timeout: 10000 });
    } else {
      await page.waitForURL(urlPattern, { timeout: 10000 });
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

/**
 * Clear browser state (localStorage, cookies, sessionStorage)
 */
export async function clearBrowserState(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.context().clearCookies();
}

/**
 * Retry an operation with exponential backoff
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(
    `Operation failed after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`
  );
}

/**
 * Wait for network to be idle
 */
export async function waitForNetworkIdle(
  page: Page,
  idleTime: number = 500,
  timeout: number = 30000
): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout });
  
  // Additional wait to ensure no pending requests
  let lastRequestTime = Date.now();
  const checkInterval = 100;
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const checkIdle = setInterval(() => {
      const now = Date.now();
      
      if (now - startTime > timeout) {
        clearInterval(checkIdle);
        reject(new Error(`Network idle timeout after ${timeout}ms`));
        return;
      }

      if (now - lastRequestTime >= idleTime) {
        clearInterval(checkIdle);
        resolve();
      }
    }, checkInterval);

    // Track requests
    page.on('request', () => {
      lastRequestTime = Date.now();
    });

    // Timeout fallback
    setTimeout(() => {
      clearInterval(checkIdle);
      resolve();
    }, timeout);
  });
}

/**
 * Get enhanced error context (URL, console errors, etc.)
 */
export async function getErrorContext(page: Page): Promise<string> {
  const url = page.url();
  const title = await page.title();
  
  // Get console errors
  const consoleErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  return `
Error Context:
  - URL: ${url}
  - Title: ${title}
  - Console Errors: ${consoleErrors.length > 0 ? consoleErrors.join(', ') : 'None'}
  `.trim();
}

