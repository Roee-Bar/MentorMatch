/**
 * Migration Script: Fix Supervisor Capacity
 * 
 * This script recalculates all supervisor currentCapacity values based on approved applications.
 * It correctly counts linked applications (paired students) as a single project.
 * 
 * Usage: npx tsx scripts/fix-supervisor-capacity.ts
 */

import * as admin from 'firebase-admin';
import * as path from 'path';

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');

if (!admin.apps.length) {
  try {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('✓ Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    console.error('Make sure serviceAccountKey.json exists in the project root');
    process.exit(1);
  }
}

const db = admin.firestore();

interface Application {
  id: string;
  supervisorId: string;
  status: string;
  linkedApplicationId?: string;
  isLeadApplication?: boolean;
  studentName: string;
}

async function fixSupervisorCapacity() {
  console.log('\n=== Starting Supervisor Capacity Fix ===\n');

  try {
    // Get all supervisors
    const supervisorsSnapshot = await db.collection('supervisors').get();
    console.log(`Found ${supervisorsSnapshot.size} supervisors\n`);

    let totalUpdated = 0;
    let totalErrors = 0;

    for (const supervisorDoc of supervisorsSnapshot.docs) {
      const supervisorId = supervisorDoc.id;
      const supervisorData = supervisorDoc.data();
      const supervisorName = supervisorData.fullName || supervisorId;

      try {
        // Get all approved applications for this supervisor
        const applicationsSnapshot = await db
          .collection('applications')
          .where('supervisorId', '==', supervisorId)
          .where('status', '==', 'approved')
          .get();

        const applications: Application[] = applicationsSnapshot.docs.map(doc => ({
          id: doc.id,
          supervisorId: doc.data().supervisorId,
          status: doc.data().status,
          linkedApplicationId: doc.data().linkedApplicationId,
          isLeadApplication: doc.data().isLeadApplication,
          studentName: doc.data().studentName,
        }));

        // Count projects correctly
        // - Solo students count as 1 project each
        // - Paired students (linked applications) count as 1 project total
        let projectCount = 0;
        const processedApplicationIds = new Set<string>();

        for (const app of applications) {
          // Skip if already processed as part of a linked pair
          if (processedApplicationIds.has(app.id)) {
            continue;
          }

          // If this is a lead application or has no linked application, count it
          if (app.isLeadApplication || !app.linkedApplicationId) {
            projectCount++;
            processedApplicationIds.add(app.id);

            // If this has a linked application, mark it as processed too
            if (app.linkedApplicationId) {
              processedApplicationIds.add(app.linkedApplicationId);
            }
          } else {
            // This is a non-lead application, find the lead and count only once
            const linkedApp = applications.find(a => a.id === app.linkedApplicationId);
            if (linkedApp) {
              if (!processedApplicationIds.has(linkedApp.id)) {
                projectCount++;
                processedApplicationIds.add(linkedApp.id);
                processedApplicationIds.add(app.id);
              }
            } else {
              // Linked application not found or not approved, count this as solo
              projectCount++;
              processedApplicationIds.add(app.id);
            }
          }
        }

        const oldCapacity = supervisorData.currentCapacity || 0;

        // Update supervisor capacity
        if (oldCapacity !== projectCount) {
          await db.collection('supervisors').doc(supervisorId).update({
            currentCapacity: projectCount,
            updatedAt: new Date(),
          });

          console.log(`✓ ${supervisorName}`);
          console.log(`  Old capacity: ${oldCapacity}, New capacity: ${projectCount}`);
          console.log(`  Approved applications: ${applications.length}`);
          totalUpdated++;
        } else {
          console.log(`- ${supervisorName}: Already correct (${projectCount} projects)`);
        }

      } catch (error) {
        console.error(`✗ Error processing ${supervisorName}:`, error);
        totalErrors++;
      }
    }

    console.log('\n=== Migration Complete ===');
    console.log(`Updated: ${totalUpdated} supervisors`);
    console.log(`Errors: ${totalErrors}`);
    console.log(`Unchanged: ${supervisorsSnapshot.size - totalUpdated - totalErrors}`);

  } catch (error) {
    console.error('Fatal error during migration:', error);
    process.exit(1);
  }
}

// Run the migration
fixSupervisorCapacity()
  .then(() => {
    console.log('\n✓ Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Migration failed:', error);
    process.exit(1);
  });

