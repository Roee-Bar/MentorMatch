/**
 * Cleanup Script: Find and Fix Orphaned References
 * 
 * This script identifies and optionally fixes orphaned references in the database:
 * - Students with assignedSupervisorId pointing to non-existent supervisors
 * - Students with partnerId pointing to non-existent students
 * 
 * Usage:
 *   npm run cleanup:check  - Dry run (report only)
 *   npm run cleanup:fix    - Fix orphaned references
 */

// Load environment variables from .env.local
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { adminDb } from '../lib/firebase-admin';

interface OrphanedReference {
  studentId: string;
  studentName: string;
  studentEmail: string;
  referenceType: 'supervisor' | 'partner';
  orphanedId: string;
  currentStatus?: string;
}

async function findOrphanedReferences(): Promise<OrphanedReference[]> {
  const orphanedRefs: OrphanedReference[] = [];

  console.log('Scanning for orphaned references...\n');

  // Get all students
  const studentsSnapshot = await adminDb.collection('students').get();
  console.log(`Found ${studentsSnapshot.size} students to check\n`);

  // Get all supervisors for validation
  const supervisorsSnapshot = await adminDb.collection('supervisors').get();
  const validSupervisorIds = new Set(supervisorsSnapshot.docs.map(doc => doc.id));
  console.log(`Found ${validSupervisorIds.size} valid supervisors in database`);

  // Get all student IDs for partner validation
  const validStudentIds = new Set(studentsSnapshot.docs.map(doc => doc.id));
  console.log(`Found ${validStudentIds.size} valid students in database\n`);

  // Check each student for orphaned references
  for (const doc of studentsSnapshot.docs) {
    const student = doc.data();
    const studentId = doc.id;

    // Check for orphaned supervisor reference
    if (student.assignedSupervisorId) {
      if (!validSupervisorIds.has(student.assignedSupervisorId)) {
        orphanedRefs.push({
          studentId,
          studentName: student.fullName || 'Unknown',
          studentEmail: student.email || 'Unknown',
          referenceType: 'supervisor',
          orphanedId: student.assignedSupervisorId,
          currentStatus: student.matchStatus,
        });
      }
    }

    // Check for orphaned partner reference
    if (student.partnerId) {
      if (!validStudentIds.has(student.partnerId)) {
        orphanedRefs.push({
          studentId,
          studentName: student.fullName || 'Unknown',
          studentEmail: student.email || 'Unknown',
          referenceType: 'partner',
          orphanedId: student.partnerId,
          currentStatus: student.partnershipStatus,
        });
      }
    }
  }

  return orphanedRefs;
}

async function fixOrphanedReferences(orphanedRefs: OrphanedReference[]): Promise<void> {
  console.log('\nFixing orphaned references...\n');

  const batch = adminDb.batch();
  let fixCount = 0;

  for (const ref of orphanedRefs) {
    const studentRef = adminDb.collection('students').doc(ref.studentId);

    if (ref.referenceType === 'supervisor') {
      // Clear supervisor reference and reset match status
      batch.update(studentRef, {
        assignedSupervisorId: null,
        matchStatus: 'unmatched',
        assignedProjectId: null,
        updatedAt: new Date(),
      });
      console.log(`  Fixed supervisor reference for: ${ref.studentName} (${ref.studentEmail})`);
    } else if (ref.referenceType === 'partner') {
      // Clear partner reference and reset partnership status
      batch.update(studentRef, {
        partnerId: null,
        partnershipStatus: 'none',
        updatedAt: new Date(),
      });
      console.log(`  Fixed partner reference for: ${ref.studentName} (${ref.studentEmail})`);
    }

    fixCount++;
  }

  if (fixCount > 0) {
    await batch.commit();
    console.log(`\nSuccessfully fixed ${fixCount} orphaned references`);
  } else {
    console.log('\nNo orphaned references to fix');
  }
}

function displayReport(orphanedRefs: OrphanedReference[]): void {
  console.log('\n' + '='.repeat(80));
  console.log('ORPHANED REFERENCES REPORT');
  console.log('='.repeat(80) + '\n');

  if (orphanedRefs.length === 0) {
    console.log('No orphaned references found! Database is clean.\n');
    return;
  }

  console.log(`Found ${orphanedRefs.length} orphaned reference(s):\n`);

  // Group by type
  const supervisorRefs = orphanedRefs.filter(r => r.referenceType === 'supervisor');
  const partnerRefs = orphanedRefs.filter(r => r.referenceType === 'partner');

  if (supervisorRefs.length > 0) {
    console.log(`\nOrphaned Supervisor References (${supervisorRefs.length}):`);
    console.log('-'.repeat(80));
    supervisorRefs.forEach((ref, index) => {
      console.log(`\n${index + 1}. Student: ${ref.studentName}`);
      console.log(`   Email: ${ref.studentEmail}`);
      console.log(`   Student ID (Firebase): ${ref.studentId}`);
      console.log(`   Orphaned Supervisor ID: ${ref.orphanedId}`);
      console.log(`   Current Match Status: ${ref.currentStatus}`);
    });
  }

  if (partnerRefs.length > 0) {
    console.log(`\n\nOrphaned Partner References (${partnerRefs.length}):`);
    console.log('-'.repeat(80));
    partnerRefs.forEach((ref, index) => {
      console.log(`\n${index + 1}. Student: ${ref.studentName}`);
      console.log(`   Email: ${ref.studentEmail}`);
      console.log(`   Student ID (Firebase): ${ref.studentId}`);
      console.log(`   Orphaned Partner ID: ${ref.orphanedId}`);
      console.log(`   Current Partnership Status: ${ref.currentStatus}`);
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log(`\nTo fix these issues, run: npm run cleanup:fix`);
  console.log('='.repeat(80) + '\n');
}

async function main() {
  const shouldFix = process.argv.includes('--fix');

  console.log('\n' + '='.repeat(80));
  console.log('DATABASE CLEANUP UTILITY - Orphaned References');
  console.log('='.repeat(80));
  console.log(`Mode: ${shouldFix ? 'FIX MODE' : 'CHECK MODE (Dry Run)'}\n`);

  try {
    // Find orphaned references
    const orphanedRefs = await findOrphanedReferences();

    // Display report
    displayReport(orphanedRefs);

    // Fix if requested
    if (shouldFix && orphanedRefs.length > 0) {
      console.log('\n' + '='.repeat(80));
      await fixOrphanedReferences(orphanedRefs);
      console.log('='.repeat(80) + '\n');
    }

    console.log('\nCleanup utility completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('\nCleanup utility failed:', error);
    process.exit(1);
  }
}

// Run the script
main();

