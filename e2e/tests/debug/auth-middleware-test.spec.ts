/**
 * Auth Middleware Test - Verify auth middleware works with test database
 */

import { test, expect } from '@playwright/test';
import { seedStudent } from '../../fixtures/db-helpers';
import { adminAuth } from '@/lib/firebase-admin';
import { verifyAuth } from '@/lib/middleware/auth';
import { NextRequest } from 'next/server';

test.describe('Auth Middleware Test', () => {
  test('should verify auth with valid token', async () => {
    // Seed a student
    const { uid, student } = await seedStudent();
    
    // Create custom token
    const token = await adminAuth.createCustomToken(uid);
    expect(token).toBeTruthy();
    
    // Verify token works
    const decodedToken = await adminAuth.verifyIdToken(token);
    expect(decodedToken.uid).toBe(uid);
    
    // Create a mock request with the token
    const request = new NextRequest('http://localhost:3000/api/users/test', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    // Call verifyAuth
    const authResult = await verifyAuth(request);
    
    console.log('Auth result:', authResult);
    
    expect(authResult.authenticated).toBe(true);
    expect(authResult.user).toBeTruthy();
    expect(authResult.user?.uid).toBe(uid);
    expect(authResult.user?.email).toBe(student.email);
    expect(authResult.user?.role).toBe('student');
  });
});

