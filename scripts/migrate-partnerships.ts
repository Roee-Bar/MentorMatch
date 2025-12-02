/**
 * Migration Script: Reset Partnership Data
 * 
 * This script resets all existing partnership data to prepare for the new partnership system.
 * It updates all students to have the new partnership fields initialized.
 * 
 * Run this once before deploying the new partnership system:
 * npm run migrate:partnerships
 */

// Load environment variables from .env.local
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { adminDb } from '../lib/firebase-admin';

async function migratePartnershipData() {
  console.log('Starting partnership data migration...');

  try {
    // Get all students
    const studentsSnapshot = await adminDb.collection('students').get();
    console.log(`Found ${studentsSnapshot.size} students to migrate`);

    const batch = adminDb.batch();
    let updateCount = 0;

    studentsSnapshot.docs.forEach((doc) => {
      const studentRef = adminDb.collection('students').doc(doc.id);
      
      // Update each student with new partnership fields
      batch.update(studentRef, {
        // New partnership system fields
        partnerId: null,
        partnershipStatus: 'none',
        
        // Reset old partnership fields to defaults
        hasPartner: false,
        partnerName: '',
        partnerEmail: '',
        
        // Update timestamp
        updatedAt: new Date()
      });

      updateCount++;
    });

    // Commit all updates in batch
    await batch.commit();
    console.log(`Successfully migrated ${updateCount} students`);

    // Clean up any existing partnership requests (if any)
    const requestsSnapshot = await adminDb.collection('partnership_requests').get();
    if (!requestsSnapshot.empty) {
      console.log(`Found ${requestsSnapshot.size} existing partnership requests to delete`);
      const deleteBatch = adminDb.batch();
      requestsSnapshot.docs.forEach((doc) => {
        deleteBatch.delete(doc.ref);
      });
      await deleteBatch.commit();
      console.log('Deleted existing partnership requests');
    }

    console.log('\nMigration completed successfully!');
    console.log('Summary:');
    console.log(`  - Updated ${updateCount} students`);
    console.log(`  - All students now have partnershipStatus: 'none'`);
    console.log(`  - All students now have partnerId: null`);
    console.log(`  - Old hasPartner/partnerName/partnerEmail fields reset to defaults`);

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Run the migration
migratePartnershipData()
  .then(() => {
    console.log('\nMigration script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nMigration script failed:', error);
    process.exit(1);
  });

