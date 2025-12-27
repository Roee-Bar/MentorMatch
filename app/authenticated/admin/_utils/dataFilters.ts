'use client';

import type { Student, Application, Supervisor } from '@/types/database';
import type { StatCardType } from '@/lib/hooks';

/**
 * Filter students based on the active stat card type
 * @param students - Array of students to filter
 * @param applications - Array of applications (used for "students without projects" filter)
 * @param statCard - The active stat card type
 * @returns Filtered array of students
 */
export function filterStudentsByStatCard(
  students: Student[],
  applications: Application[] | null,
  statCard: StatCardType
): Student[] {
  if (statCard === 'students-without-projects') {
    return students.filter(student => {
      if (!applications) return true;
      return !applications.some(
        app => app.studentId === student.id && app.status === 'approved'
      );
    });
  }
  return students;
}

/**
 * Filter supervisors based on the active stat card type
 * @param supervisors - Array of supervisors to filter
 * @param statCard - The active stat card type
 * @returns Filtered array of supervisors
 */
export function filterSupervisorsByStatCard(
  supervisors: Supervisor[],
  statCard: StatCardType
): Supervisor[] {
  if (statCard === 'available-capacity') {
    return supervisors.filter(s => s.currentCapacity < s.maxCapacity);
  }
  // Note: supervisor-partnerships stat card shows all supervisors
  // Partnerships are project-based, so we can't filter supervisors by partnership status
  // The stat card count comes from projects with coSupervisorId
  if (statCard === 'supervisor-partnerships') {
    return supervisors; // Show all supervisors (partnerships tracked via projects)
  }
  return supervisors;
}

/**
 * Filter applications based on the active stat card type
 * @param applications - Array of applications to filter
 * @param statCard - The active stat card type
 * @returns Filtered array of applications
 */
export function filterApplicationsByStatCard(
  applications: Application[],
  statCard: StatCardType
): Application[] {
  if (statCard === 'approved-projects') {
    return applications.filter(app => app.status === 'approved');
  }
  if (statCard === 'pending-applications') {
    return applications.filter(app => app.status === 'pending');
  }
  return applications;
}

