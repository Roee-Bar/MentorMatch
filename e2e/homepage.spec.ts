import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  // Tests that the homepage loads successfully
  test('should load homepage and display main content', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await page.waitForLoadState('domcontentloaded');
    
    // Check for main hero heading (use .first() to avoid strict mode violation)
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
    
    // Verify navigation is present
    await expect(page.getByRole('navigation')).toBeVisible();
  });

  // Tests that navigation links are present and functional
  test('should have working navigation to login page', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for the login link to be visible and ready
    const loginLink = page.getByRole('link', { name: /login/i }).first();
    await expect(loginLink).toBeVisible({ timeout: 10000 });
    
    // Click login link
    await loginLink.click();
    
    // Wait for navigation and verify
    await page.waitForURL('/login', { timeout: 15000 });
    await page.waitForLoadState('load');
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible({ timeout: 10000 });
  });

  // Tests that navigation to register page works
  test('should have working navigation to register page', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for the sign up link to be visible and ready
    const signUpLink = page.getByRole('link', { name: /sign up/i }).first();
    await expect(signUpLink).toBeVisible({ timeout: 10000 });
    
    // Click sign up link
    await signUpLink.click();
    
    // Wait for navigation and verify
    await page.waitForURL('/register', { timeout: 15000 });
    await page.waitForLoadState('load');
    await expect(page.getByRole('heading', { name: /create account|register/i })).toBeVisible({ timeout: 10000 });
  });

  // Tests that the homepage displays key sections
  test('should display key sections on homepage', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await page.waitForLoadState('domcontentloaded');
    
    // Check for hero section or main call-to-action (use .first() to avoid strict mode violation)
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
    
    // Verify footer is present (use .first() to avoid strict mode violation)
    // Use getByRole instead of locator to handle multiple footer elements
    await expect(page.getByRole('contentinfo').first()).toBeVisible({ timeout: 10000 });
  });
});

