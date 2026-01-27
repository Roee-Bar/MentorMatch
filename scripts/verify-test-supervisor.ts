/**
 * Verify Test Supervisor Script
 * 
 * Verifies that the test supervisor was created successfully
 * and displays all their information
 * 
 * Usage:
 *   npm run verify:test-supervisor
 */

import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });
dotenv.config({ path: resolve(__dirname, '../.env') });
dotenv.config();

import { adminAuth, adminDb } from '../lib/firebase-admin';
import { log } from './types';

const TEST_EMAIL = 'test.supervisor@e.braude.ac.il';

async function verifyTestSupervisor() {
  log('\n=== Verify Test Supervisor ===\n', 'cyan');
  
  try {
    // Check Firebase Auth
    log('Checking Firebase Auth...', 'cyan');
    const authUser = await adminAuth.getUserByEmail(TEST_EMAIL);
    log(`✓ Found in Firebase Auth`, 'green');
    log(`  UID: ${authUser.uid}`, 'reset');
    log(`  Email: ${authUser.email}`, 'reset');
    log(`  Email Verified: ${authUser.emailVerified}`, authUser.emailVerified ? 'green' : 'red');
    log(`  Display Name: ${authUser.displayName}`, 'reset');
    
    // Check user document
    log('\nChecking user document...', 'cyan');
    const userDoc = await adminDb.collection('users').doc(authUser.uid).get();
    if (!userDoc.exists) {
      log('✗ User document not found!', 'red');
      process.exit(1);
    }
    const userData = userDoc.data();
    log(`✓ Found user document`, 'green');
    log(`  Role: ${userData?.role}`, 'reset');
    log(`  Department: ${userData?.department}`, 'reset');
    
    // Check supervisor profile
    log('\nChecking supervisor profile...', 'cyan');
    const supervisorDoc = await adminDb.collection('supervisors').doc(authUser.uid).get();
    if (!supervisorDoc.exists) {
      log('✗ Supervisor profile not found!', 'red');
      process.exit(1);
    }
    const supervisorData = supervisorDoc.data();
    log(`✓ Found supervisor profile`, 'green');
    log(`  Name: ${supervisorData?.fullName}`, 'reset');
    log(`  Title: ${supervisorData?.title}`, 'reset');
    log(`  Department: ${supervisorData?.department}`, 'reset');
    log(`  Phone: ${supervisorData?.phone}`, 'reset');
    log(`  Office: ${supervisorData?.officeLocation}`, 'reset');
    log(`  Office Hours: ${supervisorData?.officeHours}`, 'reset');
    log(`  Capacity: ${supervisorData?.currentCapacity}/${supervisorData?.maxCapacity}`, 'reset');
    log(`  Status: ${supervisorData?.availabilityStatus}`, 'reset');
    log(`  Approved: ${supervisorData?.isApproved ? 'Yes' : 'No'}`, supervisorData?.isApproved ? 'green' : 'red');
    log(`  Active: ${supervisorData?.isActive ? 'Yes' : 'No'}`, supervisorData?.isActive ? 'green' : 'red');
    
    log('\n  Research Interests:', 'cyan');
    if (supervisorData?.researchInterests && Array.isArray(supervisorData.researchInterests)) {
      supervisorData.researchInterests.forEach((interest: string, index: number) => {
        log(`    ${index + 1}. ${interest}`, 'reset');
      });
    }
    
    log('\n  Expertise Areas:', 'cyan');
    if (supervisorData?.expertiseAreas && Array.isArray(supervisorData.expertiseAreas)) {
      supervisorData.expertiseAreas.forEach((area: string, index: number) => {
        log(`    ${index + 1}. ${area}`, 'reset');
      });
    }
    
    log('\n✅ All checks passed! Test supervisor is properly configured.', 'green');
    log('\nYou can login with:', 'cyan');
    log(`  Email: ${TEST_EMAIL}`, 'yellow');
    log(`  Password: Test123!`, 'yellow');
    log(`  URL: http://localhost:3000/login\n`, 'yellow');
    
    process.exit(0);
    
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      log(`✗ Test supervisor not found with email: ${TEST_EMAIL}`, 'red');
      log('\nRun: npm run create:test-supervisor', 'yellow');
    } else {
      log(`\n✗ Verification failed: ${error.message}`, 'red');
      console.error(error);
    }
    process.exit(1);
  }
}

// Run the script
verifyTestSupervisor();
