import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  // Tests that the homepage loads successfully
  test('should load homepage and display main content', async ({ page }) => {
    await page.goto('/');
    
    // Check for main hero heading (use .first() to avoid strict mode violation)
    await expect(page.locator('h1').first()).toBeVisible();
    
    // Verify navigation is present
    await expect(page.getByRole('navigation')).toBeVisible();
  });

  // Tests that navigation links are present and functional
  test('should have working navigation to login page', async ({ page }) => {
    await page.goto('/');
    
    // Click login link (use first() since there are multiple login links)
    await page.getByRole('link', { name: /login/i }).first().click();
    
    // Wait for navigation and verify
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL('/login');
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
  });

  // Tests that navigation to register page works
  test('should have working navigation to register page', async ({ page }) => {
    await page.goto('/');
    
    // Click register or sign up link
    await page.getByRole('link', { name: /register|sign up/i }).first().click();
    
    // Wait for navigation and verify
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL('/register');
    await expect(page.getByRole('heading', { name: /create account|register/i })).toBeVisible();
  });

  // Tests that the homepage displays key sections
  test('should display key sections on homepage', async ({ page }) => {
    await page.goto('/');
    
    // Check for hero section or main call-to-action (use .first() to avoid strict mode violation)
    await expect(page.locator('h1').first()).toBeVisible();
    
    // Verify footer is present
    await expect(page.locator('footer')).toBeVisible();
  });
});

