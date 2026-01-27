/**
 * Reset All Passwords Script
 * 
 * Updates all user passwords in Firebase Auth to "Test123!"
 * Supports dry-run mode to preview changes before executing
 * 
 * Usage:
 *   Dry-run: npm run reset:passwords-dryrun
 *   Real: npm run reset:passwords
 */

import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });
dotenv.config({ path: resolve(__dirname, '../.env') });
dotenv.config();

import { adminAuth } from '../lib/firebase-admin';
import { log } from './types';

const DEFAULT_PASSWORD = 'Test123!';
const isDryRun = process.argv.includes('--dry-run');

interface ResetStats {
  usersProcessed: number;
  passwordsUpdated: number;
  errors: Array<{ email: string; error: string }>;
}

async function resetAllPasswords() {
  if (isDryRun) {
    log('\n=== Reset All Passwords (DRY-RUN MODE) ===\n', 'cyan');
    log('⚠️  DRY-RUN: No changes will be made to the database\n', 'yellow');
  } else {
    log('\n=== Reset All Passwords ===\n', 'cyan');
    log('⚠️  This will update all user passwords in Firebase Auth\n', 'yellow');
  }

  const stats: ResetStats = {
    usersProcessed: 0,
    passwordsUpdated: 0,
    errors: [],
  };

  try {
    // Fetch all users from Firebase Auth
    log('Fetching all users from Firebase Auth...', 'cyan');
    
    let allUsers: any[] = [];
    let nextPageToken: string | undefined = undefined;
    
    // Firebase Auth listUsers() returns max 1000 users per call, need pagination
    do {
      const listUsersResult = await adminAuth.listUsers(1000, nextPageToken);
      allUsers = allUsers.concat(listUsersResult.users);
      nextPageToken = listUsersResult.pageToken;
    } while (nextPageToken);

    log(`✓ Found ${allUsers.length} users\n`, 'green');

    if (allUsers.length === 0) {
      log('No users found in Firebase Auth.', 'yellow');
      process.exit(0);
    }

    // Process each user
    log(`Processing users...\n`, 'cyan');
    
    for (let i = 0; i < allUsers.length; i++) {
      const user = allUsers[i];
      const progress = `[${i + 1}/${allUsers.length}]`;
      
      stats.usersProcessed++;
      
      try {
        if (isDryRun) {
          log(`${progress} Would update password for: ${user.email || user.uid}`, 'yellow');
          stats.passwordsUpdated++;
        } else {
          log(`${progress} Updating password for: ${user.email || user.uid}`, 'yellow');
          
          await adminAuth.updateUser(user.uid, {
            password: DEFAULT_PASSWORD,
          });
          
          stats.passwordsUpdated++;
          log(`   ✓ Password updated successfully`, 'green');
        }
      } catch (error: any) {
        const errorMsg = error.message || 'Unknown error';
        stats.errors.push({
          email: user.email || user.uid,
          error: errorMsg,
        });
        log(`   ✗ Failed: ${errorMsg}`, 'red');
      }
    }

    // Summary
    log(`\n=== ${isDryRun ? 'Simulation' : 'Reset'} Complete ===\n`, 'cyan');
    log('Summary:', 'cyan');
    log(`  Total users processed: ${stats.usersProcessed}`, 'reset');
    log(`  ${isDryRun ? 'Would update' : '✓ Updated'} passwords: ${stats.passwordsUpdated}`, stats.passwordsUpdated > 0 ? 'green' : 'reset');
    log(`  ✗ Errors: ${stats.errors.length}`, stats.errors.length > 0 ? 'red' : 'reset');

    if (stats.errors.length > 0) {
      log('\nErrors:', 'red');
      stats.errors.forEach((error, index) => {
        log(`  ${index + 1}. ${error.email}: ${error.error}`, 'red');
      });
    }

    if (isDryRun) {
      log('\n⚠️  DRY-RUN COMPLETE - No changes were made', 'cyan');
      log('Run without --dry-run flag to perform actual password reset\n', 'yellow');
    } else {
      log(`\nAll passwords have been updated to: ${DEFAULT_PASSWORD}`, 'green');
      log('Users can now login with this password.\n', 'yellow');
    }

    process.exit(0);

  } catch (error: any) {
    log(`\n✗ Password reset failed: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run the script
resetAllPasswords();
