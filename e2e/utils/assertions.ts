/**
 * Custom Assertions for E2E Tests
 * 
 * Reusable assertion helpers for common test scenarios.
 */

import { expect, Page } from '@playwright/test';

/**
 * Assert that user is redirected to login page
 */
export async function expectRedirectToLogin(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/login/);
}

/**
 * Assert that user is authenticated and on dashboard
 */
export async function expectAuthenticatedDashboard(page: Page, role: 'student' | 'supervisor' | 'admin'): Promise<void> {
  const expectedPath = `/authenticated/${role}`;
  await expect(page).toHaveURL(new RegExp(expectedPath));
}

/**
 * Assert that error message is displayed
 */
export async function expectErrorMessage(page: Page, message?: string): Promise<void> {
  const errorSelector = '[role="alert"], .error, .error-message, [data-testid="error"], [role="status"]';
  const errorElement = page.locator(errorSelector).first();
  
  // Wait for error element to be visible with a reasonable timeout
  await expect(errorElement).toBeVisible({ timeout: 10000 });
  
  if (message) {
    await expect(errorElement).toContainText(message, { ignoreCase: true });
  }
}

/**
 * Assert that success message is displayed
 */
export async function expectSuccessMessage(page: Page, message?: string): Promise<void> {
  const successSelector = '[role="status"], .success, .success-message, [data-testid="success"]';
  const successElement = page.locator(successSelector).first();
  
  await expect(successElement).toBeVisible();
  
  if (message) {
    await expect(successElement).toContainText(message, { ignoreCase: true });
  }
}

/**
 * Assert that form field has error
 */
export async function expectFieldError(page: Page, fieldName: string): Promise<void> {
  const field = page.locator(`[name="${fieldName}"], [id="${fieldName}"]`).first();
  const errorMessage = page.locator(`[data-error-for="${fieldName}"], [aria-describedby*="${fieldName}"]`).first();
  
  await expect(field).toHaveAttribute('aria-invalid', 'true');
  await expect(errorMessage).toBeVisible();
}

/**
 * Assert that loading state is shown
 */
export async function expectLoadingState(page: Page): Promise<void> {
  const loadingSelector = '[data-testid="loading"], .loading, [aria-busy="true"]';
  const loadingElement = page.locator(loadingSelector).first();
  await expect(loadingElement).toBeVisible({ timeout: 5000 });
}

/**
 * Assert that loading state is hidden
 */
export async function expectNotLoading(page: Page): Promise<void> {
  const loadingSelector = '[data-testid="loading"], .loading, [aria-busy="true"]';
  const loadingElement = page.locator(loadingSelector).first();
  await expect(loadingElement).toBeHidden({ timeout: 10000 });
}

/**
 * Assert that element is visible and contains text
 */
export async function expectVisibleWithText(
  page: Page,
  selector: string,
  text: string
): Promise<void> {
  const element = page.locator(selector);
  await expect(element).toBeVisible();
  await expect(element).toContainText(text, { ignoreCase: true });
}

/**
 * Assert that button is disabled
 */
export async function expectButtonDisabled(page: Page, buttonText: string): Promise<void> {
  const button = page.getByRole('button', { name: buttonText });
  await expect(button).toBeDisabled();
}

/**
 * Assert that button is enabled
 */
export async function expectButtonEnabled(page: Page, buttonText: string): Promise<void> {
  const button = page.getByRole('button', { name: buttonText });
  await expect(button).toBeEnabled();
}

/**
 * Assert that modal is open
 */
export async function expectModalOpen(page: Page, title?: string): Promise<void> {
  const modal = page.locator('[role="dialog"], .modal, [data-testid="modal"]').first();
  await expect(modal).toBeVisible();
  
  if (title) {
    await expect(modal).toContainText(title, { ignoreCase: true });
  }
}

/**
 * Assert that modal is closed
 */
export async function expectModalClosed(page: Page): Promise<void> {
  const modal = page.locator('[role="dialog"], .modal, [data-testid="modal"]').first();
  await expect(modal).toBeHidden();
}

/**
 * Assert that table has rows
 */
export async function expectTableHasRows(page: Page, minRows: number = 1): Promise<void> {
  const table = page.locator('table, [role="table"]').first();
  const rows = table.locator('tbody tr, [role="row"]');
  const count = await rows.count();
  expect(count).toBeGreaterThanOrEqual(minRows);
}

/**
 * Assert that element count matches
 */
export async function expectElementCount(
  page: Page,
  selector: string,
  expectedCount: number
): Promise<void> {
  const elements = page.locator(selector);
  await expect(elements).toHaveCount(expectedCount);
}

