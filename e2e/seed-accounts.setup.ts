/**
 * One-time setup script to seed E2E test accounts
 * Run with: npx playwright test e2e/seed-accounts.setup.ts
 */

import { test, expect } from '@playwright/test';

test('seed E2E test accounts', async ({ page }) => {
  console.log('Navigating to seed page...');
  
  // Navigate to the seed page
  await page.goto('http://localhost:3000/admin/seed');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  console.log('Clicking seed database button...');
  
  // Handle the confirmation dialog
  page.once('dialog', async dialog => {
    console.log(`Accepting dialog: ${dialog.message()}`);
    await dialog.accept();
  });
  
  // Click the seed button
  const seedButton = page.getByRole('button', { name: /seed database/i });
  await expect(seedButton).toBeVisible();
  await seedButton.click();
  
  // Wait for seeding process to start
  await page.waitForTimeout(2000);
  
  // Wait for completion message (either success or "already exists")
  console.log('Waiting for seeding to complete...');
  await expect(page.getByText(/completed successfully|already exists/i)).toBeVisible({ timeout: 90000 });
  
  // Wait a bit more for all results to appear
  await page.waitForTimeout(3000);
  
  // Take a screenshot of the results
  await page.screenshot({ path: 'seed-results.png', fullPage: true });
  
  console.log('Seeding completed! Check seed-results.png for details.');
  console.log('\nTest Account Credentials:');
  console.log('  Admin:      admin@test.com / password123');
  console.log('  Supervisor: supervisor@test.com / password123');
  console.log('  Student:    student@test.com / password123');
});

