/**
 * Form Helper Utilities
 * 
 * Reusable helpers for form operations in E2E tests.
 */

import { Page } from '@playwright/test';
import { retryOperation } from './test-helpers';

/**
 * Fill password fields (handles ambiguity between password and confirmPassword)
 */
export async function fillPasswordFields(
  page: Page,
  password: string,
  confirmPassword: string
): Promise<void> {
  // Use name attributes to avoid ambiguity
  await page.fill('input[name="password"]', password);
  await page.fill('input[name="confirmPassword"]', confirmPassword);
}

/**
 * Submit form with retry logic
 */
export async function submitFormWithRetry(
  page: Page,
  formSelector: string = 'form',
  maxRetries: number = 3
): Promise<void> {
  await retryOperation(async () => {
    const form = page.locator(formSelector).first();
    const submitButton = form.locator('button[type="submit"]').first();
    
    await submitButton.waitFor({ state: 'visible', timeout: 5000 });
    await submitButton.click();
    
    // Wait for form submission to start (form might disappear or button becomes disabled)
    await page.waitForTimeout(500);
  }, maxRetries);
}

/**
 * Wait for form submission to complete
 */
export async function waitForFormSubmission(
  page: Page,
  timeout: number = 10000
): Promise<void> {
  // Wait for either navigation or form to disappear/submit
  await Promise.race([
    page.waitForNavigation({ timeout }),
    page.waitForFunction(
      () => {
        const forms = document.querySelectorAll('form');
        return Array.from(forms).every(form => {
          const submitButton = form.querySelector('button[type="submit"]');
          return !submitButton || (submitButton as HTMLButtonElement).disabled;
        });
      },
      { timeout }
    ),
  ]).catch(() => {
    // If neither happens, that's okay - form might have submitted without navigation
  });
}

