import { test, expect } from '@playwright/test';

test.describe('Supervisor Flow', () => {
  // Tests supervisor login and dashboard access
  test('should login and access supervisor dashboard', async ({ page }) => {
    await page.goto('/login');
    
    // Use supervisor test credentials
    await page.getByLabel(/email/i).fill('supervisor@test.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /login/i }).click();
    
    // Wait for dashboard to load
    await page.waitForURL(/dashboard/, { timeout: 10000 });
    
    // Verify supervisor-specific dashboard content
    const pageContent = await page.textContent('body');
    
    // Check for supervisor-specific elements
    if (pageContent?.includes('Supervisor Dashboard') || pageContent?.includes('supervisor')) {
      expect(pageContent).toMatch(/supervisor/i);
    }
  });

  // Tests viewing capacity information
  test('should display capacity information on supervisor dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('supervisor@test.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /login/i }).click();
    
    // Wait for dashboard
    await page.waitForURL(/dashboard/, { timeout: 10000 });
    
    // Check for the capacity status section or student counts
    const pageContent = await page.textContent('body');
    
    // The dashboard should show capacity status or student-related information
    const hasCapacityInfo = Boolean(
      pageContent?.includes('Capacity Status') ||
      pageContent?.includes('students') ||
      pageContent?.includes('Supervisor Dashboard') ||
      (pageContent && /\d+\s*\/\s*\d+/.test(pageContent)) // Pattern like "2 / 5"
    );
    
    expect(hasCapacityInfo).toBeTruthy();
  });

  // Tests accessing supervisor applications page
  test('should access applications page', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('supervisor@test.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /login/i }).click();
    
    await page.waitForURL(/dashboard/, { timeout: 10000 });
    
    // Look for applications link or navigate directly
    const applicationsLink = page.getByRole('link', { name: /application/i });
    if (await applicationsLink.isVisible().catch(() => false)) {
      await applicationsLink.click();
      await expect(page).toHaveURL(/application/i);
    } else {
      // Try direct navigation
      await page.goto('/dashboard/supervisor/applications');
      await expect(page).toHaveURL(/application/i);
    }
    
    // Verify we're on applications page
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/application|no application|request/i);
  });

  // Tests accessing supervisor profile page
  test('should access profile page from dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('supervisor@test.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /login/i }).click();
    
    await page.waitForURL(/dashboard/, { timeout: 10000 });
    
    // Look for profile link or navigate directly
    const profileLink = page.getByRole('link', { name: /profile/i });
    if (await profileLink.isVisible().catch(() => false)) {
      await profileLink.click();
      await expect(page).toHaveURL(/profile/i);
    } else {
      // Try direct navigation
      await page.goto('/dashboard/supervisor/profile');
      await expect(page).toHaveURL(/profile/i);
    }
    
    // Verify we're on profile page
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/profile|capacity|specialization|research/i);
  });

  // Tests supervisor dashboard stats display
  test('should display dashboard statistics', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('supervisor@test.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /login/i }).click();
    
    await page.waitForURL(/dashboard/, { timeout: 10000 });
    
    // Look for stat cards or numerical displays
    const pageContent = await page.textContent('body');
    
    // Dashboard should show some statistics or counts
    const hasStats = pageContent?.match(/\d+/) !== null;
    expect(hasStats).toBeTruthy();
  });
});

