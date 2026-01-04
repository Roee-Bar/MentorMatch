/**
 * Direct API Test - Verify API routes work with test database
 */

import { test, expect } from '@playwright/test';
import { seedStudent } from '../../fixtures/db-helpers';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

test.describe('Direct API Test', () => {
  test('should verify test database is accessible from API context', async ({ page }) => {
    // Seed a student in test process (for reference)
    const { student } = await seedStudent();
    
    // Create user and token in server process via API
    const seedResponse = await page.request.post('http://localhost:3000/api/auth/test-seed', {
      data: {
        role: 'student',
        userData: {
          ...student,
        },
      },
    });
    
    const seedData = await seedResponse.json();
    expect(seedData.success).toBe(true);
    const { uid, token, email } = seedData.data;
    
    // Note: User and token are created in server process, so they won't be available
    // in the test process's test database. The API call verification is what matters.
    
    // Now try API call (this should work since token was created in server process)
    const response = await page.request.get(`http://localhost:3000/api/users/${uid}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('API Response status:', response.status());
    const responseText = await response.text();
    console.log('API Response body (first 500 chars):', responseText.substring(0, 500));
    
    // Should now return 200 since token was created in server process
    expect(response.status()).toBe(200);
    
    const data = JSON.parse(responseText);
    expect(data.success).toBe(true);
    expect(data.data.id).toBe(uid);
    expect(data.data.email).toBe(email);
  });
});

