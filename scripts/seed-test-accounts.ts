/**
 * Script to seed E2E test accounts using the admin seed page
 * Run with: npx tsx scripts/seed-test-accounts.ts
 */

import { chromium } from '@playwright/test';

async function seedTestAccounts() {
  console.log('Starting E2E test account seeding...\n');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Navigate to seed page
    console.log('Navigating to seed page...');
    await page.goto('http://localhost:3000/admin/seed');
    await page.waitForLoadState('networkidle');
    
    // Click the seed button
    console.log('Clicking seed button...');
    await page.getByRole('button', { name: /seed database/i }).click();
    
    // Wait for the confirmation dialog and accept it
    page.on('dialog', async dialog => {
      console.log(`Dialog: ${dialog.message()}`);
      await dialog.accept();
    });
    
    // Wait for seeding to complete (look for completion message)
    console.log('Waiting for seeding to complete...');
    await page.waitForSelector('text=/completed successfully|already exists/i', { timeout: 60000 });
    
    // Wait a bit more to see all results
    await page.waitForTimeout(3000);
    
    // Get the results
    const resultsLog = await page.textContent('.bg-gray-900');
    console.log('\nSeeding Results:');
    console.log(resultsLog);
    
    console.log('\nTest accounts seeding completed!');
    console.log('\nTest Account Credentials:');
    console.log('  Admin:      admin@test.com / password123');
    console.log('  Supervisor: supervisor@test.com / password123');
    console.log('  Student:    student@test.com / password123');
    
  } catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

seedTestAccounts().catch(console.error);

