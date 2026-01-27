/**
 * Create Test Supervisor Script
 * 
 * Creates a supervisor test user with password "Test123!"
 * and fills all registration fields with relevant test data
 * 
 * Usage:
 *   npm run create:test-supervisor
 */

import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });
dotenv.config({ path: resolve(__dirname, '../.env') });
dotenv.config();

import { adminAuth, adminDb } from '../lib/firebase-admin';
import { log } from './types';

const TEST_PASSWORD = 'Test123!';

// Test supervisor data
const TEST_SUPERVISOR = {
  firstName: 'Test',
  lastName: 'Supervisor',
  email: 'test.supervisor@e.braude.ac.il',
  phone: '+972-50-1234567',
  department: 'Software Engineering',
  title: 'Dr.',
  bio: 'Experienced software engineering professor with expertise in web development, machine learning, and distributed systems. Passionate about mentoring students and guiding innovative projects.',
  researchInterests: [
    'Machine Learning',
    'Web Development',
    'Cloud Computing',
    'Software Architecture',
    'Data Science',
  ],
  expertiseAreas: [
    'Full-Stack Development',
    'Artificial Intelligence',
    'Microservices',
    'DevOps',
    'Database Systems',
  ],
  officeLocation: 'Building A, Room 305',
  officeHours: 'Sunday & Tuesday 14:00-16:00',
  maxCapacity: 10,
  currentCapacity: 0,
  availabilityStatus: 'available' as const,
  notificationPreference: 'daily' as const,
  notificationHour: 9,
  isApproved: true,
  isActive: true,
};

async function createTestSupervisor() {
  log('\n=== Create Test Supervisor ===\n', 'cyan');
  
  try {
    // Check if user already exists
    log(`Checking if ${TEST_SUPERVISOR.email} already exists...`, 'cyan');
    
    try {
      const existingUser = await adminAuth.getUserByEmail(TEST_SUPERVISOR.email);
      log(`✗ User ${TEST_SUPERVISOR.email} already exists (UID: ${existingUser.uid})`, 'red');
      log('\nTo recreate this user, please delete it first from Firebase Console.', 'yellow');
      process.exit(1);
    } catch (error: any) {
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
      log(`✓ Email is available`, 'green');
    }
    
    // Create Firebase Auth user
    log('\nCreating Firebase Auth user...', 'cyan');
    const fullName = `${TEST_SUPERVISOR.firstName} ${TEST_SUPERVISOR.lastName}`;
    
    const userRecord = await adminAuth.createUser({
      email: TEST_SUPERVISOR.email,
      password: TEST_PASSWORD,
      displayName: fullName,
      emailVerified: true,
    });
    
    log(`✓ Created Firebase Auth user (UID: ${userRecord.uid})`, 'green');
    
    const now = new Date();
    
    // Create user document in 'users' collection
    log('Creating user document...', 'cyan');
    await adminDb.collection('users').doc(userRecord.uid).set({
      userId: userRecord.uid,
      email: TEST_SUPERVISOR.email,
      name: fullName,
      role: 'supervisor',
      department: TEST_SUPERVISOR.department,
      emailVerified: true,
      emailVerifiedAt: now,
      createdAt: now,
      updatedAt: now,
    });
    
    log(`✓ Created user document`, 'green');
    
    // Create supervisor profile in 'supervisors' collection
    log('Creating supervisor profile...', 'cyan');
    await adminDb.collection('supervisors').doc(userRecord.uid).set({
      firstName: TEST_SUPERVISOR.firstName,
      lastName: TEST_SUPERVISOR.lastName,
      fullName: fullName,
      email: TEST_SUPERVISOR.email,
      phone: TEST_SUPERVISOR.phone,
      department: TEST_SUPERVISOR.department,
      title: TEST_SUPERVISOR.title,
      bio: TEST_SUPERVISOR.bio,
      researchInterests: TEST_SUPERVISOR.researchInterests,
      expertiseAreas: TEST_SUPERVISOR.expertiseAreas,
      officeLocation: TEST_SUPERVISOR.officeLocation,
      officeHours: TEST_SUPERVISOR.officeHours,
      maxCapacity: TEST_SUPERVISOR.maxCapacity,
      currentCapacity: TEST_SUPERVISOR.currentCapacity,
      availabilityStatus: TEST_SUPERVISOR.availabilityStatus,
      notificationPreference: TEST_SUPERVISOR.notificationPreference,
      notificationHour: TEST_SUPERVISOR.notificationHour,
      isApproved: TEST_SUPERVISOR.isApproved,
      isActive: TEST_SUPERVISOR.isActive,
      createdAt: now,
      updatedAt: now,
    });
    
    log(`✓ Created supervisor profile`, 'green');
    
    // Summary
    log('\n=== Test Supervisor Created Successfully ===\n', 'cyan');
    log('Supervisor Details:', 'cyan');
    log(`  Email: ${TEST_SUPERVISOR.email}`, 'reset');
    log(`  Password: ${TEST_PASSWORD}`, 'yellow');
    log(`  Name: ${fullName}`, 'reset');
    log(`  UID: ${userRecord.uid}`, 'reset');
    log(`  Department: ${TEST_SUPERVISOR.department}`, 'reset');
    log(`  Title: ${TEST_SUPERVISOR.title}`, 'reset');
    log(`  Office: ${TEST_SUPERVISOR.officeLocation}`, 'reset');
    log(`  Office Hours: ${TEST_SUPERVISOR.officeHours}`, 'reset');
    log(`  Capacity: ${TEST_SUPERVISOR.currentCapacity}/${TEST_SUPERVISOR.maxCapacity}`, 'reset');
    log(`  Status: ${TEST_SUPERVISOR.availabilityStatus}`, 'green');
    log(`  Approved: ${TEST_SUPERVISOR.isApproved ? 'Yes' : 'No'}`, 'green');
    
    log('\nResearch Interests:', 'cyan');
    TEST_SUPERVISOR.researchInterests.forEach((interest, index) => {
      log(`  ${index + 1}. ${interest}`, 'reset');
    });
    
    log('\nExpertise Areas:', 'cyan');
    TEST_SUPERVISOR.expertiseAreas.forEach((area, index) => {
      log(`  ${index + 1}. ${area}`, 'reset');
    });
    
    log('\nYou can now login with these credentials!', 'green');
    log(`\nLogin URL: http://localhost:3000/login\n`, 'yellow');
    
    process.exit(0);
    
  } catch (error: any) {
    log(`\n✗ Failed to create test supervisor: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run the script
createTestSupervisor();
