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
  // Use a shorter timeout to avoid hanging when browser validation prevents form submission
  await expect(errorElement).toBeVisible({ timeout: 8000 });
  
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

/**
 * Assert API response
 */
export async function expectAPIResponse(
  page: Page,
  urlPattern: string | RegExp,
  expectedStatus: number = 200,
  timeout: number = 10000
): Promise<void> {
  const response = await page.waitForResponse(
    (response) => {
      const url = response.url();
      const matchesUrl = typeof urlPattern === 'string' 
        ? url.includes(urlPattern)
        : urlPattern.test(url);
      return matchesUrl;
    },
    { timeout }
  );
  
  expect(response.status()).toBe(expectedStatus);
}

/**
 * Assert form validation errors
 */
export async function expectFormValidation(
  page: Page,
  fieldName: string,
  expectedError?: string
): Promise<void> {
  const field = page.locator(`[name="${fieldName}"], [id="${fieldName}"]`).first();
  await expect(field).toHaveAttribute('aria-invalid', 'true');
  
  if (expectedError) {
    const errorElement = page.locator(
      `[data-error-for="${fieldName}"], [aria-describedby*="${fieldName}"]`
    ).first();
    await expect(errorElement).toBeVisible();
    await expect(errorElement).toContainText(expectedError, { ignoreCase: true });
  }
}

/**
 * Assert table data
 */
export async function expectTableData(
  page: Page,
  rowIndex: number,
  columnIndex: number,
  expectedValue: string | RegExp
): Promise<void> {
  const table = page.locator('table, [role="table"]').first();
  const rows = table.locator('tbody tr, [role="row"]');
  const row = rows.nth(rowIndex);
  const cells = row.locator('td, th');
  const cell = cells.nth(columnIndex);
  
  await expect(cell).toContainText(expectedValue, { ignoreCase: true });
}

/**
 * Assert navigation occurred
 */
export async function expectNavigation(
  page: Page,
  urlPattern: string | RegExp,
  timeout: number = 15000
): Promise<void> {
  if (typeof urlPattern === 'string') {
    await expect(page).toHaveURL((url) => url.href.includes(urlPattern), { timeout });
  } else {
    await expect(page).toHaveURL(urlPattern, { timeout });
  }
}

/**
 * Assert element is enabled and visible
 */
export async function expectElementEnabled(
  page: Page,
  selector: string
): Promise<void> {
  const element = page.locator(selector).first();
  await expect(element).toBeVisible();
  await expect(element).toBeEnabled();
}

/**
 * Assert element is disabled
 */
export async function expectElementDisabled(
  page: Page,
  selector: string
): Promise<void> {
  const element = page.locator(selector).first();
  await expect(element).toBeDisabled();
}

/**
 * Assert URL contains path
 */
export async function expectURLContains(
  page: Page,
  path: string
): Promise<void> {
  await expect(page).toHaveURL((url) => url.pathname.includes(path));
}

/**
 * Assert element has attribute
 */
export async function expectElementHasAttribute(
  page: Page,
  selector: string,
  attribute: string,
  value?: string | RegExp
): Promise<void> {
  const element = page.locator(selector).first();
  if (value) {
    if (typeof value === 'string') {
      await expect(element).toHaveAttribute(attribute, value);
    } else {
      const attrValue = await element.getAttribute(attribute);
      expect(attrValue).toMatch(value);
    }
  } else {
    const attrValue = await element.getAttribute(attribute);
    expect(attrValue).not.toBeNull();
  }
}

/**
 * Assert element count is greater than
 */
export async function expectElementCountGreaterThan(
  page: Page,
  selector: string,
  minCount: number
): Promise<void> {
  const elements = page.locator(selector);
  const count = await elements.count();
  expect(count).toBeGreaterThan(minCount);
}

/**
 * Assert element count is less than
 */
export async function expectElementCountLessThan(
  page: Page,
  selector: string,
  maxCount: number
): Promise<void> {
  const elements = page.locator(selector);
  const count = await elements.count();
  expect(count).toBeLessThan(maxCount);
}

