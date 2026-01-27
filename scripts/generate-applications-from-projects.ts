/**
 * Generate Applications from Projects Script
 * 
 * Creates approved application records for students in existing projects
 * who don't have application records (backfills from CSV import)
 * 
 * Usage:
 *   Dry-run: npm run generate:applications-dryrun
 *   Real: npm run generate:applications
 */

import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });
dotenv.config({ path: resolve(__dirname, '../.env') });
dotenv.config();

import { adminDb } from '../lib/firebase-admin';
import { log } from './types';
import type { Project, Student, Supervisor, Application } from '../types/database';

const isDryRun = process.argv.includes('--dry-run');

interface GenerateStats {
  projectsProcessed: number;
  applicationsCreated: number;
  projectsSkipped: number;
  errors: Array<{ projectId: string; projectTitle: string; error: string }>;
}

// Check if an application already exists for a student-supervisor pair
async function applicationExists(studentId: string, supervisorId: string): Promise<boolean> {
  const snapshot = await adminDb
    .collection('applications')
    .where('studentId', '==', studentId)
    .where('supervisorId', '==', supervisorId)
    .limit(1)
    .get();

  return !snapshot.empty;
}

// Create application document
async function createApplication(
  project: Project,
  student: Student,
  supervisor: Supervisor,
  partnerId?: string,
  partnerName?: string,
  partnerEmail?: string,
  linkedApplicationId?: string,
  isLeadApplication: boolean = true
): Promise<string> {
  // Build application data
  const applicationData: Omit<Application, 'id'> = {
    // Participants
    studentId: student.id,
    studentName: student.fullName,
    studentEmail: student.email,
    supervisorId: supervisor.id,
    supervisorName: supervisor.fullName,
    
    // Project Details
    projectTitle: project.title,
    projectDescription: project.description,
    isOwnTopic: true,
    
    // Student Information (snapshot at time of application)
    studentSkills: Array.isArray(student.skills) ? student.skills.join(', ') : '',
    studentInterests: student.interests || '',
    
    // Partner Information
    hasPartner: !!partnerId,
    partnerName: partnerName,
    partnerEmail: partnerEmail,
    
    // Project-Based Capacity Tracking
    linkedApplicationId: linkedApplicationId,
    isLeadApplication: isLeadApplication,
    projectId: project.id,
    
    // Status
    status: 'approved',
    
    // Timestamps - backdate to project creation/approval
    dateApplied: project.createdAt instanceof Date 
      ? new Date(project.createdAt.getTime() - 7 * 24 * 60 * 60 * 1000) // 7 days before project creation
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    lastUpdated: project.approvedAt || project.createdAt || new Date(),
    responseDate: project.approvedAt || project.createdAt || new Date(),
  };

  // Filter out undefined values
  const cleanData = Object.fromEntries(
    Object.entries(applicationData).filter(([, value]) => value !== undefined)
  );

  // Create application
  const docRef = await adminDb.collection('applications').add(cleanData);
  return docRef.id;
}

async function generateApplicationsFromProjects() {
  if (isDryRun) {
    log('\n=== Generate Applications from Projects (DRY-RUN MODE) ===\n', 'cyan');
    log('⚠️  DRY-RUN: No changes will be made to the database\n', 'yellow');
  } else {
    log('\n=== Generate Applications from Projects ===\n', 'cyan');
    log('⚠️  This will create application records for students in projects\n', 'yellow');
  }

  const stats: GenerateStats = {
    projectsProcessed: 0,
    applicationsCreated: 0,
    projectsSkipped: 0,
    errors: [],
  };

  try {
    // Fetch all approved projects
    log('Fetching approved projects from Firestore...', 'cyan');
    const projectsSnapshot = await adminDb
      .collection('projects')
      .where('status', '==', 'approved')
      .get();
    
    log(`✓ Found ${projectsSnapshot.size} approved projects\n`, 'green');

    if (projectsSnapshot.empty) {
      log('No approved projects found.', 'yellow');
      process.exit(0);
    }

    // Process each project
    log('Processing projects...\n', 'cyan');

    for (let i = 0; i < projectsSnapshot.docs.length; i++) {
      const doc = projectsSnapshot.docs[i];
      const project = { id: doc.id, ...doc.data() } as Project;
      const progress = `[${i + 1}/${projectsSnapshot.size}]`;

      stats.projectsProcessed++;

      try {
        log(`${progress} Processing project: "${project.title}"`, 'yellow');
        log(`   Project Code: ${project.projectCode}`, 'reset');
        log(`   Students: ${project.studentNames.join(', ')}`, 'reset');
        log(`   Supervisor: ${project.supervisorName}`, 'reset');

        // Fetch supervisor
        const supervisorDoc = await adminDb.collection('supervisors').doc(project.supervisorId).get();
        if (!supervisorDoc.exists) {
          throw new Error(`Supervisor not found: ${project.supervisorId}`);
        }
        const supervisor = { id: supervisorDoc.id, ...supervisorDoc.data() } as Supervisor;

        // Check if this is a solo or paired project
        const isSolo = project.studentIds.length === 1;
        const isPaired = project.studentIds.length === 2;

        if (project.studentIds.length === 0) {
          log(`   ⚠ No students in project - SKIPPED`, 'yellow');
          stats.projectsSkipped++;
          continue;
        }

        if (project.studentIds.length > 2) {
          log(`   ⚠ More than 2 students in project (${project.studentIds.length}) - Not supported`, 'yellow');
          stats.projectsSkipped++;
          continue;
        }

        // Fetch student(s)
        const students: Student[] = [];
        for (const studentId of project.studentIds) {
          const studentDoc = await adminDb.collection('students').doc(studentId).get();
          if (!studentDoc.exists) {
            throw new Error(`Student not found: ${studentId}`);
          }
          students.push({ id: studentDoc.id, ...studentDoc.data() } as Student);
        }

        // Check if applications already exist for all students
        const existingChecks = await Promise.all(
          project.studentIds.map(studentId => applicationExists(studentId, project.supervisorId))
        );
        
        const allExist = existingChecks.every(exists => exists);
        if (allExist) {
          log(`   ⚠ Applications already exist for all students - SKIPPED`, 'yellow');
          stats.projectsSkipped++;
          continue;
        }

        // Create applications
        if (isSolo) {
          // Solo project - create single application
          const student = students[0];
          const exists = await applicationExists(student.id, project.supervisorId);
          
          if (exists) {
            log(`   ⚠ Application already exists for ${student.fullName} - SKIPPED`, 'yellow');
            stats.projectsSkipped++;
            continue;
          }

          if (isDryRun) {
            log(`   [DRY-RUN] Would create solo application for ${student.fullName}`, 'cyan');
            stats.applicationsCreated++;
          } else {
            await createApplication(
              project,
              student,
              supervisor,
              undefined,
              undefined,
              undefined,
              undefined,
              true
            );
            log(`   ✓ Created solo application for ${student.fullName}`, 'green');
            stats.applicationsCreated++;
          }
        } else if (isPaired) {
          // Paired project - create two linked applications
          const student1 = students[0];
          const student2 = students[1];

          const exists1 = await applicationExists(student1.id, project.supervisorId);
          const exists2 = await applicationExists(student2.id, project.supervisorId);

          if (exists1 && exists2) {
            log(`   ⚠ Applications already exist for both students - SKIPPED`, 'yellow');
            stats.projectsSkipped++;
            continue;
          }

          if (isDryRun) {
            if (!exists1) {
              log(`   [DRY-RUN] Would create paired application for ${student1.fullName} (lead)`, 'cyan');
              stats.applicationsCreated++;
            }
            if (!exists2) {
              log(`   [DRY-RUN] Would create paired application for ${student2.fullName} (linked)`, 'cyan');
              stats.applicationsCreated++;
            }
          } else {
            // Create first application (lead) if it doesn't exist
            let app1Id: string | undefined;
            if (!exists1) {
              app1Id = await createApplication(
                project,
                student1,
                supervisor,
                student2.id,
                student2.fullName,
                student2.email,
                undefined, // Will be filled when we create app2
                true // isLeadApplication
              );
              log(`   ✓ Created paired application for ${student1.fullName} (lead)`, 'green');
              stats.applicationsCreated++;
            } else {
              // Find existing application to link
              const existingSnapshot = await adminDb
                .collection('applications')
                .where('studentId', '==', student1.id)
                .where('supervisorId', '==', project.supervisorId)
                .limit(1)
                .get();
              if (!existingSnapshot.empty) {
                app1Id = existingSnapshot.docs[0].id;
              }
            }

            // Create second application (linked) if it doesn't exist
            let app2Id: string | undefined;
            if (!exists2 && app1Id) {
              app2Id = await createApplication(
                project,
                student2,
                supervisor,
                student1.id,
                student1.fullName,
                student1.email,
                app1Id,
                false // Not lead application
              );
              log(`   ✓ Created paired application for ${student2.fullName} (linked)`, 'green');
              stats.applicationsCreated++;

              // Update first application with link to second if we created it
              if (!exists1) {
                await adminDb.collection('applications').doc(app1Id).update({
                  linkedApplicationId: app2Id,
                  lastUpdated: new Date(),
                });
              }
            }
          }
        }

      } catch (error: any) {
        const errorMsg = error.message || 'Unknown error';
        stats.errors.push({
          projectId: project.id,
          projectTitle: project.title,
          error: errorMsg,
        });
        log(`   ✗ Failed: ${errorMsg}`, 'red');
      }
    }

    // Summary
    log(`\n=== ${isDryRun ? 'Simulation' : 'Generation'} Complete ===\n`, 'cyan');
    log('Summary:', 'cyan');
    log(`  Total projects processed: ${stats.projectsProcessed}`, 'reset');
    log(`  ${isDryRun ? 'Would create' : '✓ Created'} applications: ${stats.applicationsCreated}`, stats.applicationsCreated > 0 ? 'green' : 'reset');
    log(`  ⚠ Skipped projects: ${stats.projectsSkipped}`, stats.projectsSkipped > 0 ? 'yellow' : 'reset');
    log(`  ✗ Errors: ${stats.errors.length}`, stats.errors.length > 0 ? 'red' : 'reset');

    if (stats.errors.length > 0) {
      log('\nErrors:', 'red');
      stats.errors.forEach((error, index) => {
        log(`  ${index + 1}. ${error.projectTitle}: ${error.error}`, 'red');
      });
    }

    if (isDryRun) {
      log('\n⚠️  DRY-RUN COMPLETE - No changes were made', 'cyan');
      log('Run without --dry-run flag to perform actual application generation\n', 'yellow');
    } else {
      log('\nApplication generation complete!', 'green');
      log('All students in approved projects now have application records.\n', 'yellow');
    }

    process.exit(0);

  } catch (error: any) {
    log(`\n✗ Application generation failed: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run the script
generateApplicationsFromProjects();
