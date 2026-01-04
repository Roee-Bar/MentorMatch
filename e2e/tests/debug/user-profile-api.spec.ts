/**
 * User Profile API Verification
 * 
 * This test verifies that the user profile API endpoint works with test database.
 */

import { test, expect } from '@playwright/test';
import { seedStudent, seedAdmin } from '../../fixtures/db-helpers';
import { adminAuth } from '@/lib/firebase-admin';

test.describe('User Profile API Verification', () => {
  test('should fetch user profile via API with valid token @failing', async ({ page }) => {
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
    
    // Set token in sessionStorage
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(({ token, uid, email }) => {
      sessionStorage.setItem('__test_id_token__', token);
      sessionStorage.setItem('__test_local_id__', uid);
      sessionStorage.setItem('__test_email__', email);
    }, { token, uid, email });
    
    // Make API call to get user profile
    const response = await page.request.get(`http://localhost:3000/api/users/${uid}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('API Response status:', response.status());
    console.log('API Response headers:', response.headers());
    
    const responseText = await response.text();
    console.log('API Response body:', responseText);
    
    expect(response.status()).toBe(200);
    
    const data = JSON.parse(responseText);
    expect(data).toBeTruthy();
    expect(data.success).toBe(true);
    expect(data.data).toBeTruthy();
    expect(data.data.id).toBe(uid);
    expect(data.data.email).toBe(email);
    expect(data.data.role).toBe('student');
  });

  test('should fail with invalid token @failing', async ({ page }) => {
    const { uid } = await seedStudent();
    
    // Make API call with invalid token
    const response = await page.request.get(`http://localhost:3000/api/users/${uid}`, {
      headers: {
        'Authorization': 'Bearer invalid-token',
        'Content-Type': 'application/json',
      },
    });
    
    expect(response.status()).toBe(401);
  });

  test('should fail without token @failing', async ({ page }) => {
    const { uid } = await seedStudent();
    
    // Make API call without token
    const response = await page.request.get(`http://localhost:3000/api/users/${uid}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    expect(response.status()).toBe(401);
  });

  test('should allow admin to fetch any user profile @failing', async ({ page }) => {
    // Seed an admin and a student in test process (for reference)
    const { admin } = await seedAdmin();
    const { student } = await seedStudent();
    
    // Create admin user and token in server process via API
    const adminSeedResponse = await page.request.post('http://localhost:3000/api/auth/test-seed', {
      data: {
        role: 'admin',
        userData: {
          ...admin,
        },
      },
    });
    
    const adminSeedData = await adminSeedResponse.json();
    expect(adminSeedData.success).toBe(true);
    const { token: adminToken } = adminSeedData.data;
    
    // Create student user in server process via API
    const studentSeedResponse = await page.request.post('http://localhost:3000/api/auth/test-seed', {
      data: {
        role: 'student',
        userData: {
          ...student,
        },
      },
    });
    
    const studentSeedData = await studentSeedResponse.json();
    expect(studentSeedData.success).toBe(true);
    const { uid: studentUid } = studentSeedData.data;
    
    // Make API call as admin to fetch student profile
    const response = await page.request.get(`http://localhost:3000/api/users/${studentUid}`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    expect(response.status()).toBe(200);
    
    const data = JSON.parse(await response.text());
    expect(data.success).toBe(true);
    expect(data.data.id).toBe(studentUid);
    expect(data.data.email).toBe(student.email);
  });
});

