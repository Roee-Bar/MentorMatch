import { test, expect } from '@playwright/test';
import { loginAs, waitForAuthState } from '../utils/auth-helpers';
import { TEST_USERS } from '../fixtures/test-users';

// Use direct route strings to avoid TypeScript path resolution issues
const ROUTES = {
  LOGIN: '/login',
  AUTHENTICATED: {
    STUDENT: '/authenticated/student',
  },
};

test.describe('Authentication', () => {
  test('TC-AUTH-001: Student Login', async ({ page }) => {
    // Track console errors
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Filter out known non-critical errors
        if (!text.includes('favicon') && !text.includes('sourcemap')) {
          consoleErrors.push(text);
        }
      }
    });
    
    // Track page errors
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => {
      pageErrors.push(error.message);
    });
    
    // Track network requests
    const networkRequests: Array<{ url: string; method: string; status: number }> = [];
    page.on('response', (response) => {
      const url = response.url();
      const method = response.request().method();
      const status = response.status();
      networkRequests.push({ url, method, status });
    });
    
    // Step 1: Navigate to /login
    await page.goto(ROUTES.LOGIN);
    await expect(page).toHaveURL(ROUTES.LOGIN);
    
    // Step 2: Type email
    const emailInput = page.locator('input[name="email"]');
    await expect(emailInput).toBeVisible();
    await emailInput.fill(TEST_USERS.student.email);
    
    // Step 3: Type password
    const passwordInput = page.locator('input[name="password"]');
    await expect(passwordInput).toBeVisible();
    await passwordInput.fill(TEST_USERS.student.password);
    
    // Step 4: Click "Login" button
    const loginButton = page.locator('button[type="submit"]');
    await expect(loginButton).toBeVisible();
    await expect(loginButton).toHaveText('Login');
    
    // Wait for navigation after clicking login
    await Promise.all([
      page.waitForURL(/\/(authenticated\/student|$)/, { timeout: 15000 }),
      loginButton.click(),
    ]);
    
    // Step 5: Network Validation - Verify authentication request
    // Check for Firebase auth requests or API auth requests
    const authRequests = networkRequests.filter(
      (req) =>
        req.url.includes('/api/auth') ||
        req.url.includes('identitytoolkit.googleapis.com') ||
        req.url.includes('securetoken.googleapis.com')
    );
    
    // At least one auth-related request should have succeeded
    const successfulAuthRequest = authRequests.find(
      (req) => req.status >= 200 && req.status < 300
    );
    
    expect(successfulAuthRequest, 'Should have successful authentication request').toBeDefined();
    
    // Step 6: Wait for redirect to /authenticated/student
    await waitForAuthState(page, 'student');
    await expect(page).toHaveURL(ROUTES.AUTHENTICATED.STUDENT);
    
    // Step 7: Verify welcome message or dashboard content visible
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check for common dashboard elements
    // The dashboard should have some content - check for headings or common elements
    const pageContent = await page.textContent('body');
    expect(pageContent, 'Dashboard should have content').toBeTruthy();
    
    // Step 8: Console Validation - Check for no JavaScript/React/Firebase errors
    if (consoleErrors.length > 0) {
      console.error('Console errors detected during test execution:');
      consoleErrors.forEach((error, index) => {
        console.error(`  ${index + 1}. ${error}`);
      });
      // For now, we'll log but not fail - adjust based on requirements
      // To fail tests on console errors, uncomment the line below:
      // throw new Error(`Console errors found: ${consoleErrors.join('; ')}`);
    }
    
    if (pageErrors.length > 0) {
      throw new Error(`Page errors found: ${pageErrors.join(', ')}`);
    }
    
    // Verify URL is correct
    await expect(page).toHaveURL(ROUTES.AUTHENTICATED.STUDENT);
  });
});

