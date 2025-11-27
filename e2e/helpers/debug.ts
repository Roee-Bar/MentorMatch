import { Page } from '@playwright/test';

/**
 * Helper function to log page console messages and errors
 */
export function setupPageLogging(page: Page) {
  // Log console messages
  page.on('console', msg => {
    const type = msg.type();
    if (type === 'error' || type === 'warning') {
      console.log(`[PAGE ${type.toUpperCase()}]:`, msg.text());
    }
  });

  // Log page errors
  page.on('pageerror', error => {
    console.log('[PAGE ERROR]:', error.message);
  });

  // Log request failures
  page.on('requestfailed', request => {
    console.log('[REQUEST FAILED]:', request.url(), request.failure()?.errorText);
  });
}

/**
 * Wait for element to be ready for interaction
 */
export async function waitForElementReady(page: Page, selector: string, timeout = 10000) {
  const element = page.locator(selector);
  await element.waitFor({ state: 'visible', timeout });
  await element.waitFor({ state: 'attached', timeout });
  return element;
}

/**
 * Safe navigation with better error handling
 * Note: Using 'load' instead of 'networkidle' as Next.js dev mode 
 * keeps connections open and never reaches networkidle state
 */
export async function safeGoto(page: Page, url: string, options?: { timeout?: number }) {
  const timeout = options?.timeout || 30000;
  
  try {
    await page.goto(url, { 
      waitUntil: 'load',
      timeout 
    });
    await page.waitForLoadState('domcontentloaded');
    return true;
  } catch (error) {
    console.error(`Failed to navigate to ${url}:`, error);
    throw error;
  }
}

/**
 * Safe form fill with validation
 */
export async function safeFill(page: Page, labelOrSelector: string, value: string, options?: { timeout?: number }) {
  const timeout = options?.timeout || 10000;
  
  try {
    // Try as label first
    let element = page.getByLabel(new RegExp(labelOrSelector, 'i'));
    
    // Check if element exists, otherwise try as selector
    const count = await element.count();
    if (count === 0) {
      element = page.locator(labelOrSelector);
    }
    
    // Wait for element to be ready
    await element.waitFor({ state: 'visible', timeout });
    await element.waitFor({ state: 'attached', timeout });
    
    // Clear and fill
    await element.clear();
    await element.fill(value);
    
    // Verify the value was set
    const filledValue = await element.inputValue();
    if (filledValue !== value) {
      console.warn(`Warning: Expected value "${value}" but got "${filledValue}"`);
    }
    
    return true;
  } catch (error) {
    console.error(`Failed to fill ${labelOrSelector}:`, error);
    throw error;
  }
}

/**
 * Safe click with retry logic
 */
export async function safeClick(page: Page, selector: string, options?: { timeout?: number }) {
  const timeout = options?.timeout || 10000;
  
  try {
    const element = page.locator(selector);
    
    // Wait for element to be ready
    await element.waitFor({ state: 'visible', timeout });
    await element.waitFor({ state: 'attached', timeout });
    
    // Ensure element is enabled
    await page.waitForFunction(
      sel => {
        const el = document.querySelector(sel);
        return el && !(el as HTMLButtonElement).disabled;
      },
      selector,
      { timeout }
    );
    
    // Click
    await element.click();
    
    return true;
  } catch (error) {
    console.error(`Failed to click ${selector}:`, error);
    throw error;
  }
}

/**
 * Take screenshot with better naming
 */
export async function debugScreenshot(page: Page, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `debug-${name}-${timestamp}.png`;
  await page.screenshot({ path: `test-results/${filename}`, fullPage: true });
  console.log(`Screenshot saved: ${filename}`);
}

/**
 * Log current page state for debugging
 */
export async function logPageState(page: Page) {
  const url = page.url();
  const title = await page.title();
  const html = await page.content();
  
  console.log('=== PAGE STATE ===');
  console.log('URL:', url);
  console.log('Title:', title);
  console.log('Body length:', html.length);
  console.log('==================');
}

