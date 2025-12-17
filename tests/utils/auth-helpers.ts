import { Page, expect } from '@playwright/test';

// Use direct route strings to avoid TypeScript path resolution issues
const ROUTES = {
  LOGIN: '/login',
  AUTHENTICATED: {
    STUDENT: '/authenticated/student',
    SUPERVISOR: '/authenticated/supervisor',
    ADMIN: '/authenticated/admin',
  },
};

/**
 * Login as a user and wait for redirect
 */
export async function loginAs(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  // Navigate to login page
  await page.goto(ROUTES.LOGIN);
  
  // Fill in email
  await page.fill('input[name="email"]', email);
  
  // Fill in password
  await page.fill('input[name="password"]', password);
  
  // Click login button
  await page.click('button[type="submit"]');
  
  // Wait for navigation (either to home or authenticated route)
  await page.waitForURL(/\/(authenticated\/|$)/, { timeout: 10000 });
}

/**
 * Logout and verify redirect
 */
export async function logout(page: Page): Promise<void> {
  // Find and click logout button (adjust selector based on actual UI)
  // This is a placeholder - adjust based on actual logout UI
  const logoutButton = page.locator('text=Logout').or(page.locator('[data-testid="logout"]'));
  if (await logoutButton.isVisible()) {
    await logoutButton.click();
    await page.waitForURL(ROUTES.LOGIN, { timeout: 5000 });
  }
}

/**
 * Wait for authenticated state and redirect to role-specific page
 */
export async function waitForAuthState(
  page: Page,
  expectedRole: 'student' | 'supervisor' | 'admin'
): Promise<void> {
  const roleRoutes = {
    student: ROUTES.AUTHENTICATED.STUDENT,
    supervisor: ROUTES.AUTHENTICATED.SUPERVISOR,
    admin: ROUTES.AUTHENTICATED.ADMIN,
  };
  
  await page.waitForURL(roleRoutes[expectedRole], { timeout: 10000 });
}

/**
 * Extract Firebase auth token from page context
 * Note: This may require accessing browser context directly
 */
export async function getAuthToken(page: Page): Promise<string | null> {
  // Try to get token from localStorage or cookies
  const token = await page.evaluate(() => {
    // Firebase stores auth state in IndexedDB/localStorage
    // This is a simplified approach - may need adjustment
    return localStorage.getItem('firebase:authUser') || null;
  });
  
  return token;
}

