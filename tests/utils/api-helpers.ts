import { Page } from '@playwright/test';

/**
 * Wait for a specific API call to complete
 */
export async function waitForApiCall(
  page: Page,
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET'
): Promise<void> {
  await page.waitForResponse(
    (response) => {
      const url = response.url();
      const responseMethod = response.request().method();
      return url.includes(endpoint) && responseMethod === method;
    },
    { timeout: 10000 }
  );
}

/**
 * Verify an API call succeeded (status 200-299)
 */
export async function verifyApiSuccess(
  page: Page,
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET'
): Promise<boolean> {
  const response = await page.waitForResponse(
    (response) => {
      const url = response.url();
      const responseMethod = response.request().method();
      return url.includes(endpoint) && responseMethod === method;
    },
    { timeout: 10000 }
  );
  
  const status = response.status();
  return status >= 200 && status < 300;
}

/**
 * Verify an API call returned an error status
 */
export async function verifyApiError(
  page: Page,
  endpoint: string,
  expectedStatusCode: number,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET'
): Promise<boolean> {
  const response = await page.waitForResponse(
    (response) => {
      const url = response.url();
      const responseMethod = response.request().method();
      return url.includes(endpoint) && responseMethod === method;
    },
    { timeout: 10000 }
  );
  
  return response.status() === expectedStatusCode;
}

/**
 * Get all network requests for validation
 */
export async function getNetworkRequests(page: Page): Promise<Array<{
  url: string;
  method: string;
  status: number;
}>> {
  return await page.evaluate(() => {
    // This would need to be set up with request interception
    // For now, return empty array - can be enhanced with request interception
    return [];
  });
}

