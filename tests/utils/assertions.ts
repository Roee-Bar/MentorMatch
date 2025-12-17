import { Page, expect } from '@playwright/test';

/**
 * Check for JavaScript/React/Firebase errors in console
 * Returns a checker function that should be called after actions
 */
export function setupConsoleErrorChecker(page: Page): () => void {
  const errors: string[] = [];
  
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Filter out known non-critical errors if needed
      if (!text.includes('favicon') && !text.includes('sourcemap')) {
        errors.push(text);
      }
    }
  });
  
  // Also check for page errors
  page.on('pageerror', (error) => {
    errors.push(error.message);
  });
  
  // Return a function to check errors after actions
  return () => {
    if (errors.length > 0) {
      throw new Error(`Console errors found: ${errors.join(', ')}`);
    }
  };
}

/**
 * Verify no 4xx/5xx errors in network requests
 * Returns a checker function that should be called after actions
 */
export function setupNetworkErrorChecker(page: Page): () => void {
  const failedRequests: Array<{ url: string; status: number }> = [];
  
  page.on('response', (response) => {
    const status = response.status();
    if (status >= 400) {
      failedRequests.push({
        url: response.url(),
        status,
      });
    }
  });
  
  // Return a function to check after actions
  return () => {
    if (failedRequests.length > 0) {
      const errors = failedRequests.map(r => `${r.url}: ${r.status}`).join(', ');
      throw new Error(`Network errors found: ${errors}`);
    }
  };
}

/**
 * Verify navigation to expected URL
 */
export async function assertRedirect(page: Page, expectedUrl: string | RegExp): Promise<void> {
  if (typeof expectedUrl === 'string') {
    await expect(page).toHaveURL(expectedUrl);
  } else {
    await expect(page).toHaveURL(expectedUrl);
  }
}

/**
 * Verify status badge with expected status and color
 */
export async function assertStatusBadge(
  page: Page,
  expectedStatus: string,
  expectedColor: 'green' | 'yellow' | 'red' | 'blue' | 'gray'
): Promise<void> {
  // Find badge with expected status text
  const badge = page.locator(`text=${expectedStatus}`).first();
  await expect(badge).toBeVisible();
  
  // Verify color class (adjust based on actual badge implementation)
  const colorClasses = {
    green: 'badge-success',
    yellow: 'badge-warning',
    red: 'badge-danger',
    blue: 'badge-info',
    gray: 'badge-gray',
  };
  
  // Check if badge has the expected color class
  const badgeElement = badge.locator('..');
  await expect(badgeElement).toHaveClass(new RegExp(colorClasses[expectedColor]));
}

