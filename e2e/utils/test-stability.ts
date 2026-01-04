/**
 * Test Stability Utilities
 * 
 * Utility functions for handling flaky tests and transient failures.
 * These helpers improve test reliability by waiting for stable states,
 * retrying operations with backoff, and detecting network/UI readiness.
 */

import { Page, Locator } from '@playwright/test';

/**
 * Wait for UI element to stabilize (no position/size changes)
 */
export async function waitForStableState(
  page: Page,
  selector: string,
  timeout: number = 5000
): Promise<void> {
  const element = page.locator(selector);
  
  // Wait for element to be visible
  await element.waitFor({ state: 'visible', timeout });
  
  // Wait for element to be stable (not moving/changing)
  let previousBounds: { x: number; y: number; width: number; height: number } | null = null;
  let stableCount = 0;
  const requiredStableChecks = 3;
  const checkInterval = 100;
  
  for (let i = 0; i < timeout / checkInterval; i++) {
    try {
      const bounds = await element.boundingBox();
      if (bounds) {
        if (previousBounds) {
          const isStable = 
            Math.abs(bounds.x - previousBounds.x) < 1 &&
            Math.abs(bounds.y - previousBounds.y) < 1 &&
            Math.abs(bounds.width - previousBounds.width) < 1 &&
            Math.abs(bounds.height - previousBounds.height) < 1;
          
          if (isStable) {
            stableCount++;
            if (stableCount >= requiredStableChecks) {
              return;
            }
          } else {
            stableCount = 0;
          }
        }
        previousBounds = bounds;
      }
    } catch (error) {
      // Element might not be ready yet, continue checking
    }
    
    await page.waitForTimeout(checkInterval);
  }
  
  // If we get here, element is visible but may not be fully stable
  // Wait a bit more for any final animations
  await page.waitForTimeout(200);
}

/**
 * Retry operation with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error | unknown;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries - 1) {
        throw error;
      }
      
      // Exponential backoff: delay = initialDelay * 2^attempt
      const delay = initialDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Wait for network to be idle (no pending requests)
 */
export async function waitForNetworkIdle(
  page: Page,
  timeout: number = 5000,
  idleTime: number = 500
): Promise<void> {
  const startTime = Date.now();
  let lastRequestTime = Date.now();
  let requestCount = 0;
  
  // Track network requests
  page.on('request', () => {
    requestCount++;
    lastRequestTime = Date.now();
  });
  
  page.on('response', () => {
    requestCount--;
    if (requestCount === 0) {
      lastRequestTime = Date.now();
    }
  });
  
  // Wait for network to be idle
  while (Date.now() - startTime < timeout) {
    const timeSinceLastRequest = Date.now() - lastRequestTime;
    
    if (requestCount === 0 && timeSinceLastRequest >= idleTime) {
      return;
    }
    
    await page.waitForTimeout(100);
  }
  
  // If timeout reached, log warning but don't fail
  console.warn(`Network idle timeout reached. Active requests: ${requestCount}`);
}

/**
 * Wait for CSS animations to complete
 */
export async function waitForAnimations(
  page: Page,
  selector?: string,
  timeout: number = 3000
): Promise<void> {
  if (selector) {
    const element = page.locator(selector);
    await element.waitFor({ state: 'visible', timeout: 1000 }).catch(() => {});
  }
  
  // Wait for CSS transitions and animations to complete
  // This is done by checking if the element's computed style has no active transitions
  await page.evaluate(
    ({ selector, timeout }) => {
      return new Promise<void>((resolve) => {
        const startTime = Date.now();
        
        const checkAnimations = () => {
          const elements = selector 
            ? document.querySelectorAll(selector)
            : document.querySelectorAll('*');
          
          let hasActiveAnimations = false;
          
          elements.forEach((el) => {
            const style = window.getComputedStyle(el);
            const transition = style.transition;
            const animation = style.animation;
            
            if (
              (transition && transition !== 'none' && transition !== 'all 0s ease 0s') ||
              (animation && animation !== 'none')
            ) {
              hasActiveAnimations = true;
            }
          });
          
          if (!hasActiveAnimations || Date.now() - startTime > timeout) {
            resolve();
          } else {
            requestAnimationFrame(checkAnimations);
          }
        };
        
        // Start checking after a short delay to allow animations to begin
        setTimeout(checkAnimations, 100);
      });
    },
    { selector, timeout }
  );
  
  // Additional small delay to ensure animations are fully complete
  await page.waitForTimeout(100);
}

/**
 * Wait for element to be stable and ready for interaction
 * Combines visibility check, stability check, and animation wait
 */
export async function waitForElementReady(
  page: Page,
  selector: string,
  timeout: number = 10000
): Promise<Locator> {
  const element = page.locator(selector);
  
  // Wait for visibility
  await element.waitFor({ state: 'visible', timeout });
  
  // Wait for stability
  await waitForStableState(page, selector, timeout);
  
  // Wait for animations
  await waitForAnimations(page, selector, timeout);
  
  return element;
}

/**
 * Wait for page to be fully loaded and stable
 */
export async function waitForPageStable(
  page: Page,
  timeout: number = 10000
): Promise<void> {
  // Wait for load states
  await page.waitForLoadState('networkidle', { timeout });
  await page.waitForLoadState('domcontentloaded', { timeout });
  
  // Wait for network to be idle
  await waitForNetworkIdle(page, timeout);
  
  // Wait for any animations
  await waitForAnimations(page, undefined, timeout);
}

