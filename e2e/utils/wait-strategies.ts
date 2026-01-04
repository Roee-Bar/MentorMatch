/**
 * Advanced Wait Strategies
 * 
 * Intelligent wait utilities to replace waitForTimeout calls.
 * These strategies wait for actual conditions rather than fixed timeouts.
 */

import { Page, Locator, expect } from '@playwright/test';
import { TestConfig } from '../config/test-config';

/**
 * Wait for a specific API request to complete
 */
export async function waitForAPIRequest(
  page: Page,
  urlPattern: string | RegExp,
  method: string = 'GET',
  timeout: number = TestConfig.timeouts.api
): Promise<void> {
  await page.waitForResponse(
    (response) => {
      const url = response.url();
      const matchesUrl = typeof urlPattern === 'string' 
        ? url.includes(urlPattern)
        : urlPattern.test(url);
      return matchesUrl && response.request().method() === method;
    },
    { timeout }
  );
}

/**
 * Wait for element to be stable (no animations or transitions)
 */
export async function waitForStable(
  locator: Locator,
  timeout: number = TestConfig.timeouts.elementStability
): Promise<void> {
  await locator.waitFor({ state: 'visible', timeout });
  
  // Wait for any CSS transitions or animations to complete
  await locator.evaluate((el) => {
    return new Promise<void>((resolve) => {
      const observer = new MutationObserver(() => {
        observer.disconnect();
        resolve();
      });
      
      observer.observe(el, { 
        attributes: true, 
        attributeFilter: ['class', 'style'],
        childList: true,
        subtree: true
      });
      
      // Fallback timeout
      setTimeout(() => {
        observer.disconnect();
        resolve();
      }, 300);
    });
  });
}

/**
 * Wait for network to be idle
 */
export async function waitForNetworkIdle(
  page: Page,
  idleTime: number = TestConfig.timeouts.networkIdle
): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout: TestConfig.timeouts.navigation });
  
  // Additional wait to ensure no pending requests
  let lastRequestTime = Date.now();
  const checkInterval = 100;
  
  return new Promise((resolve) => {
    const checkIdle = setInterval(() => {
      const now = Date.now();
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
    }, TestConfig.timeouts.navigation);
  });
}

/**
 * Wait for element to reach a specific state
 */
export async function waitForElementState(
  locator: Locator,
  state: 'attached' | 'detached' | 'visible' | 'hidden',
  timeout: number = TestConfig.timeouts.action
): Promise<void> {
  await locator.waitFor({ state, timeout });
}

/**
 * Wait for a condition to be true
 */
export async function waitForCondition(
  condition: () => Promise<boolean> | boolean,
  timeout: number = TestConfig.timeouts.action,
  interval: number = 100
): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const result = await condition();
    if (result) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error(`Condition not met within ${timeout}ms`);
}

/**
 * Wait for element to have specific text
 */
export async function waitForText(
  locator: Locator,
  text: string | RegExp,
  timeout: number = TestConfig.timeouts.assertion
): Promise<void> {
  await expect(locator).toContainText(text, { timeout });
}

/**
 * Wait for element count to match expected value
 */
export async function waitForElementCount(
  locator: Locator,
  expectedCount: number,
  timeout: number = TestConfig.timeouts.assertion
): Promise<void> {
  await expect(locator).toHaveCount(expectedCount, { timeout });
}

/**
 * Wait for URL to match pattern
 * Enhanced with better error messages showing expected vs actual URL
 */
export async function waitForURL(
  page: Page,
  urlPattern: string | RegExp,
  timeout: number = TestConfig.timeouts.navigation
): Promise<void> {
  const startTime = Date.now();
  const checkInterval = 200;

  try {
    if (typeof urlPattern === 'string') {
      await page.waitForURL((url) => url.href.includes(urlPattern), { timeout });
    } else {
      await page.waitForURL(urlPattern, { timeout });
    }
  } catch (error) {
    // Provide better error message with actual URL
    const currentUrl = page.url();
    const patternStr = typeof urlPattern === 'string' ? urlPattern : urlPattern.toString();
    throw new Error(
      `URL wait timeout after ${timeout}ms. ` +
      `Expected pattern: ${patternStr}. ` +
      `Current URL: ${currentUrl}. ` +
      `Original error: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Wait for page to be fully loaded
 */
export async function waitForPageLoad(
  page: Page,
  timeout: number = TestConfig.timeouts.navigation
): Promise<void> {
  await page.waitForLoadState('domcontentloaded', { timeout });
  await page.waitForLoadState('load', { timeout });
  await page.waitForLoadState('networkidle', { timeout: timeout / 2 });
}

/**
 * Wait for element to be visible and enabled
 */
export async function waitForEnabled(
  locator: Locator,
  timeout: number = TestConfig.timeouts.action
): Promise<void> {
  await locator.waitFor({ state: 'visible', timeout });
  await expect(locator).toBeEnabled({ timeout });
}

/**
 * Wait for element to be disabled
 */
export async function waitForDisabled(
  locator: Locator,
  timeout: number = TestConfig.timeouts.action
): Promise<void> {
  await locator.waitFor({ state: 'visible', timeout });
  await expect(locator).toBeDisabled({ timeout });
}

/**
 * Wait for loading state to appear and then disappear
 */
export async function waitForLoadingComplete(
  page: Page,
  loadingSelector: string = '[data-testid="loading"], .loading, [aria-busy="true"]',
  timeout: number = TestConfig.timeouts.api
): Promise<void> {
  const loadingElement = page.locator(loadingSelector).first();
  
  // Wait for loading to appear (if it does)
  try {
    await loadingElement.waitFor({ state: 'visible', timeout: 1000 });
  } catch {
    // Loading might not appear, that's okay
  }
  
  // Wait for loading to disappear
  await loadingElement.waitFor({ state: 'hidden', timeout });
}

/**
 * Wait for multiple conditions to be true
 */
export async function waitForAll(
  conditions: Array<() => Promise<boolean> | boolean>,
  timeout: number = TestConfig.timeouts.action
): Promise<void> {
  const startTime = Date.now();
  const interval = 100;
  
  while (Date.now() - startTime < timeout) {
    const results = await Promise.all(conditions.map(cond => cond()));
    if (results.every(result => result === true)) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error(`Not all conditions met within ${timeout}ms`);
}

export default {
  waitForAPIRequest,
  waitForStable,
  waitForNetworkIdle,
  waitForElementState,
  waitForCondition,
  waitForText,
  waitForElementCount,
  waitForURL,
  waitForPageLoad,
  waitForEnabled,
  waitForDisabled,
  waitForLoadingComplete,
  waitForAll,
};

