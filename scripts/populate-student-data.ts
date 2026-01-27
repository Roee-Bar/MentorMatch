/**
 * Populate Student Data Script
 * 
 * Populates missing student data fields (skills, interests, previousProjects, preferredTopics)
 * with realistic, context-aware values based on projects and department
 * 
 * Usage:
 *   Dry-run: npm run populate:student-data-dryrun
 *   Real: npm run populate:student-data
 */

import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });
dotenv.config({ path: resolve(__dirname, '../.env') });
dotenv.config();

import { adminDb } from '../lib/firebase-admin';
import { log } from './types';
import type { Student, Project, Supervisor } from '../types/database';

const isDryRun = process.argv.includes('--dry-run');

interface PopulateStats {
  studentsProcessed: number;
  studentsUpdated: number;
  studentsSkipped: number;
  errors: Array<{ studentId: string; email: string; error: string }>;
}

// Skills pools by department
const SKILLS_BY_DEPARTMENT: Record<string, string[]> = {
  'Software Engineering': ['Java', 'Python', 'JavaScript', 'React', 'Node.js', 'SQL', 'Git', 'REST APIs', 'Agile'],
  'Computer Science': ['Algorithms', 'Data Structures', 'C++', 'Machine Learning', 'AI', 'Python', 'Computer Vision'],
  'Information Systems': ['Database Design', 'SQL', 'Business Analysis', 'System Design', 'Project Management', 'UX/UI'],
  'Electrical Engineering': ['Circuit Design', 'Embedded Systems', 'MATLAB', 'Signal Processing', 'Microcontrollers'],
  'Mechanical Engineering': ['CAD', 'SolidWorks', 'AutoCAD', 'Finite Element Analysis', 'Thermodynamics'],
  'Industrial Engineering': ['Process Optimization', 'Supply Chain', 'Statistics', 'Operations Research', 'Six Sigma'],
  'default': ['Problem Solving', 'Teamwork', 'Programming', 'Data Analysis', 'Project Management'],
};

// Interests templates by department
const INTERESTS_BY_DEPARTMENT: Record<string, string[]> = {
  'Software Engineering': [
    'Web development and modern frameworks',
    'Mobile application development',
    'Cloud computing and microservices',
    'Software architecture and design patterns',
    'Full-stack development',
  ],
  'Computer Science': [
    'Artificial intelligence and machine learning',
    'Computer vision and image processing',
    'Natural language processing',
    'Algorithms and optimization',
    'Distributed systems',
  ],
  'Information Systems': [
    'Database management and optimization',
    'Business intelligence and analytics',
    'Enterprise software systems',
    'User experience design',
    'Information security',
  ],
  'default': [
    'Software development and innovation',
    'Problem solving and analytical thinking',
    'Technology research and development',
    'System design and implementation',
  ],
};

// Extract keywords from project title that could be skills
function extractSkillsFromProjectTitle(title: string): string[] {
  const skillKeywords: Record<string, string[]> = {
    'machine learning': ['Machine Learning', 'Python', 'Data Analysis', 'TensorFlow'],
    'ml': ['Machine Learning', 'Python', 'Data Analysis'],
    'ai': ['Artificial Intelligence', 'Machine Learning', 'Python'],
    'web': ['Web Development', 'HTML/CSS', 'JavaScript', 'React'],
    'mobile': ['Mobile Development', 'iOS/Android', 'React Native'],
    'android': ['Android Development', 'Java', 'Kotlin'],
    'ios': ['iOS Development', 'Swift', 'Xcode'],
    'database': ['Database Design', 'SQL', 'Data Modeling'],
    'api': ['REST APIs', 'API Design', 'Backend Development'],
    'cloud': ['Cloud Computing', 'AWS/Azure', 'DevOps'],
    'iot': ['IoT', 'Embedded Systems', 'Arduino/Raspberry Pi'],
    'security': ['Cybersecurity', 'Network Security', 'Cryptography'],
    'game': ['Game Development', 'Unity', 'C#'],
    'data': ['Data Analysis', 'Python', 'SQL', 'Visualization'],
    'neural': ['Neural Networks', 'Deep Learning', 'TensorFlow'],
    'computer vision': ['Computer Vision', 'OpenCV', 'Image Processing'],
    'nlp': ['Natural Language Processing', 'NLP', 'Python'],
    'blockchain': ['Blockchain', 'Smart Contracts', 'Solidity'],
  };

  const titleLower = title.toLowerCase();
  const extractedSkills: string[] = [];

  for (const [keyword, skills] of Object.entries(skillKeywords)) {
    if (titleLower.includes(keyword)) {
      extractedSkills.push(...skills);
    }
  }

  return [...new Set(extractedSkills)]; // Remove duplicates
}

// Generate skills based on project and supervisor context
function generateSkills(
  student: Student,
  project?: Project,
  supervisor?: Supervisor
): string[] {
  // If student already has skills, don't override
  if (student.skills && student.skills.length > 0) {
    return student.skills;
  }

  const skills = new Set<string>();

  // Try to extract from project title
  if (project) {
    const projectSkills = extractSkillsFromProjectTitle(project.title);
    projectSkills.forEach(skill => skills.add(skill));
  }

  // Add some supervisor research interests as skills
  if (supervisor && supervisor.researchInterests) {
    supervisor.researchInterests.slice(0, 2).forEach(interest => skills.add(interest));
  }

  // Get department-specific skills
  const department = student.department || 'default';
  const departmentSkills = SKILLS_BY_DEPARTMENT[department] || SKILLS_BY_DEPARTMENT['default'];

  // Add 2-3 department skills if we don't have enough
  const remainingSlots = Math.max(0, 5 - skills.size);
  const shuffled = [...departmentSkills].sort(() => Math.random() - 0.5);
  shuffled.slice(0, remainingSlots).forEach(skill => skills.add(skill));

  // Return 3-5 skills
  const skillsArray = Array.from(skills);
  return skillsArray.slice(0, Math.min(5, skillsArray.length));
}

// Generate interests based on project and department
function generateInterests(
  student: Student,
  project?: Project,
  supervisor?: Supervisor
): string {
  // If student already has interests, don't override
  if (student.interests && student.interests.trim()) {
    return student.interests;
  }

  // If we have a project, use its context
  if (project) {
    const projectKeywords = extractSkillsFromProjectTitle(project.title);
    if (projectKeywords.length > 0) {
      return `Interested in ${projectKeywords.slice(0, 2).join(' and ').toLowerCase()} and related technologies`;
    }
  }

  // If we have supervisor research interests
  if (supervisor && supervisor.researchInterests && supervisor.researchInterests.length > 0) {
    return `Interested in ${supervisor.researchInterests.slice(0, 2).join(' and ').toLowerCase()}`;
  }

  // Fallback to department-based interests
  const department = student.department || 'default';
  const interestsPool = INTERESTS_BY_DEPARTMENT[department] || INTERESTS_BY_DEPARTMENT['default'];
  const randomIndex = Math.floor(Math.random() * interestsPool.length);
  return interestsPool[randomIndex];
}

// Generate previous projects description
function generatePreviousProjects(student: Student): string {
  // If student already has previousProjects, don't override
  if (student.previousProjects && student.previousProjects.trim()) {
    return student.previousProjects;
  }

  const templates = [
    'Completed course projects in software engineering and algorithm design',
    'Participated in various programming assignments and team projects',
    'Developed several academic projects including web applications and data analysis tools',
    'Worked on course-related projects covering different aspects of software development',
    'Completed multiple programming projects throughout academic studies',
  ];

  const randomIndex = Math.floor(Math.random() * templates.length);
  return templates[randomIndex];
}

// Generate preferred topics
function generatePreferredTopics(
  student: Student,
  project?: Project,
  supervisor?: Supervisor
): string {
  // If student already has preferredTopics, don't override
  if (student.preferredTopics && student.preferredTopics.trim()) {
    return student.preferredTopics;
  }

  // If we have a project, use related topics
  if (project) {
    const keywords = extractSkillsFromProjectTitle(project.title);
    if (keywords.length > 0) {
      return keywords.slice(0, 3).join(', ');
    }
  }

  // If we have supervisor research interests
  if (supervisor && supervisor.researchInterests && supervisor.researchInterests.length > 0) {
    return supervisor.researchInterests.slice(0, 3).join(', ');
  }

  // Department-based fallback
  const department = student.department || 'default';
  const departmentSkills = SKILLS_BY_DEPARTMENT[department] || SKILLS_BY_DEPARTMENT['default'];
  return departmentSkills.slice(0, 3).join(', ');
}

async function populateStudentData() {
  if (isDryRun) {
    log('\n=== Populate Student Data (DRY-RUN MODE) ===\n', 'cyan');
    log('⚠️  DRY-RUN: No changes will be made to the database\n', 'yellow');
  } else {
    log('\n=== Populate Student Data ===\n', 'cyan');
    log('⚠️  This will update student profiles with generated data\n', 'yellow');
  }

  const stats: PopulateStats = {
    studentsProcessed: 0,
    studentsUpdated: 0,
    studentsSkipped: 0,
    errors: [],
  };

  try {
    // Fetch all students
    log('Fetching students from Firestore...', 'cyan');
    const studentsSnapshot = await adminDb.collection('students').get();
    log(`✓ Found ${studentsSnapshot.size} students\n`, 'green');

    if (studentsSnapshot.empty) {
      log('No students found.', 'yellow');
      process.exit(0);
    }

    // Prepare batch
    let batch = adminDb.batch();
    let batchCount = 0;

    // Process each student
    log('Processing students...\n', 'cyan');

    for (let i = 0; i < studentsSnapshot.docs.length; i++) {
      const doc = studentsSnapshot.docs[i];
      const student = { id: doc.id, ...doc.data() } as Student;
      const progress = `[${i + 1}/${studentsSnapshot.size}]`;

      stats.studentsProcessed++;

      try {
        // Check if student needs data population
        const needsSkills = !student.skills || student.skills.length === 0;
        const needsInterests = !student.interests || !student.interests.trim();
        const needsPreviousProjects = !student.previousProjects;
        const needsPreferredTopics = !student.preferredTopics;

        if (!needsSkills && !needsInterests && !needsPreviousProjects && !needsPreferredTopics) {
          log(`${progress} ${student.email}: Already has complete data - SKIPPED`, 'yellow');
          stats.studentsSkipped++;
          continue;
        }

        // Fetch project and supervisor if student has an assigned project
        let project: Project | undefined;
        let supervisor: Supervisor | undefined;

        if (student.assignedProjectId) {
          const projectDoc = await adminDb.collection('projects').doc(student.assignedProjectId).get();
          if (projectDoc.exists) {
            project = { id: projectDoc.id, ...projectDoc.data() } as Project;

            // Fetch supervisor
            if (project.supervisorId) {
              const supervisorDoc = await adminDb.collection('supervisors').doc(project.supervisorId).get();
              if (supervisorDoc.exists) {
                supervisor = { id: supervisorDoc.id, ...supervisorDoc.data() } as Supervisor;
              }
            }
          }
        }

        // Generate data
        const updates: any = {};

        if (needsSkills) {
          updates.skills = generateSkills(student, project, supervisor);
        }

        if (needsInterests) {
          updates.interests = generateInterests(student, project, supervisor);
        }

        if (needsPreviousProjects) {
          updates.previousProjects = generatePreviousProjects(student);
        }

        if (needsPreferredTopics) {
          updates.preferredTopics = generatePreferredTopics(student, project, supervisor);
        }

        updates.updatedAt = new Date();

        if (isDryRun) {
          log(`${progress} ${student.email}: Would update`, 'yellow');
          if (needsSkills) log(`   - skills: ${updates.skills.join(', ')}`, 'reset');
          if (needsInterests) log(`   - interests: ${updates.interests}`, 'reset');
          if (needsPreviousProjects) log(`   - previousProjects: ${updates.previousProjects}`, 'reset');
          if (needsPreferredTopics) log(`   - preferredTopics: ${updates.preferredTopics}`, 'reset');
          stats.studentsUpdated++;
        } else {
          log(`${progress} ${student.email}: Updating`, 'yellow');
          batch.update(doc.ref, updates);
          batchCount++;
          stats.studentsUpdated++;

          // Commit batch if we reach the limit
          if (batchCount >= 500) {
            await batch.commit();
            log(`   Committed batch of ${batchCount} updates`, 'cyan');
            batch = adminDb.batch();
            batchCount = 0;
          }
        }

      } catch (error: any) {
        const errorMsg = error.message || 'Unknown error';
        stats.errors.push({
          studentId: student.id,
          email: student.email,
          error: errorMsg,
        });
        log(`${progress} ${student.email}: ✗ Failed - ${errorMsg}`, 'red');
      }
    }

    // Commit any remaining updates
    if (!isDryRun && batchCount > 0) {
      await batch.commit();
      log(`   Committed final batch of ${batchCount} updates`, 'cyan');
    }

    // Summary
    log(`\n=== ${isDryRun ? 'Simulation' : 'Population'} Complete ===\n`, 'cyan');
    log('Summary:', 'cyan');
    log(`  Total students processed: ${stats.studentsProcessed}`, 'reset');
    log(`  ${isDryRun ? 'Would update' : '✓ Updated'} students: ${stats.studentsUpdated}`, stats.studentsUpdated > 0 ? 'green' : 'reset');
    log(`  ⚠ Skipped (already complete): ${stats.studentsSkipped}`, stats.studentsSkipped > 0 ? 'yellow' : 'reset');
    log(`  ✗ Errors: ${stats.errors.length}`, stats.errors.length > 0 ? 'red' : 'reset');

    if (stats.errors.length > 0) {
      log('\nErrors:', 'red');
      stats.errors.forEach((error, index) => {
        log(`  ${index + 1}. ${error.email}: ${error.error}`, 'red');
      });
    }

    if (isDryRun) {
      log('\n⚠️  DRY-RUN COMPLETE - No changes were made', 'cyan');
      log('Run without --dry-run flag to perform actual data population\n', 'yellow');
    } else {
      log('\nStudent data population complete!', 'green');
      log('Students now have skills, interests, and project preferences.\n', 'yellow');
    }

    process.exit(0);

  } catch (error: any) {
    log(`\n✗ Data population failed: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run the script
populateStudentData();
