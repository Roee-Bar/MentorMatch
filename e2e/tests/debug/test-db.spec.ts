/**
 * Simple Test Database Verification
 * 
 * This test verifies that the in-memory test database is working correctly.
 */

import { test, expect } from '@playwright/test';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { seedStudent } from '../../fixtures/db-helpers';

test.describe('Test Database Verification', () => {
  test('should create and retrieve user from test database', async () => {
    // Seed a student
    const { uid, student } = await seedStudent();
    
    // Verify user exists in auth
    const authUser = await adminAuth.getUser(uid);
    expect(authUser).toBeTruthy();
    expect(authUser.email).toBe(student.email);
    
    // Verify user document exists
    const userDoc = await adminDb.collection('users').doc(uid).get();
    expect(userDoc.exists).toBe(true);
    
    const userData = userDoc.data();
    expect(userData).toBeTruthy();
    expect(userData?.email).toBe(student.email);
    expect(userData?.role).toBe('student');
    
    // Verify student document exists
    const studentDoc = await adminDb.collection('students').doc(uid).get();
    expect(studentDoc.exists).toBe(true);
    
    const studentData = studentDoc.data();
    expect(studentData).toBeTruthy();
    expect(studentData?.email).toBe(student.email);
  });

  test('should create custom token and verify it', async () => {
    // Seed a student
    const { uid } = await seedStudent();
    
    // Create custom token
    const token = await adminAuth.createCustomToken(uid);
    expect(token).toBeTruthy();
    expect(typeof token).toBe('string');
    
    // Verify token
    const decodedToken = await adminAuth.verifyIdToken(token);
    expect(decodedToken).toBeTruthy();
    expect(decodedToken.uid).toBe(uid);
  });

  test('should query users collection', async () => {
    // Seed multiple students
    const { uid: uid1 } = await seedStudent({ email: 'test1@example.com' });
    const { uid: uid2 } = await seedStudent({ email: 'test2@example.com' });
    
    // Query all users
    const usersSnapshot = await adminDb.collection('users').get();
    expect(usersSnapshot.docs.length).toBeGreaterThanOrEqual(2);
    
    // Find our test users
    const user1 = usersSnapshot.docs.find(doc => doc.id === uid1);
    const user2 = usersSnapshot.docs.find(doc => doc.id === uid2);
    
    expect(user1).toBeTruthy();
    expect(user2).toBeTruthy();
    expect(user1?.data().email).toBe('test1@example.com');
    expect(user2?.data().email).toBe('test2@example.com');
  });
});

