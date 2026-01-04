/**
 * Repository Test - Verify repository works with test database
 */

import { test, expect } from '@playwright/test';
import { seedStudent } from '../../fixtures/db-helpers';
import { userRepository } from '@/lib/repositories/user-repository';

test.describe('Repository Test', () => {
  test('should find user by id using repository', async () => {
    // Seed a student
    const { uid, student } = await seedStudent();
    
    // Try to find user using repository
    const user = await userRepository.findById(uid);
    
    console.log('Repository findById result:', user);
    
    expect(user).toBeTruthy();
    expect(user?.id).toBe(uid);
    expect(user?.email).toBe(student.email);
    expect(user?.role).toBe('student');
  });
});

