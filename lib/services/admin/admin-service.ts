// lib/services/admin/admin-service.ts
// SERVER-ONLY: This file must ONLY be imported in API routes (server-side)
// Admin management services

import { adminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { toAdmin, toStudent, toApplication } from '@/lib/services/shared/firestore-converters';
import type { Admin, DashboardStats, Student } from '@/types/database';

const SERVICE_NAME = 'AdminService';

// ============================================
// ADMIN SERVICES
// ============================================
export const AdminService = {
  // Get admin by ID
  async getAdminById(adminId: string): Promise<Admin | null> {
    try {
      const adminDoc = await adminDb.collection('admins').doc(adminId).get();
      if (adminDoc.exists) {
        return toAdmin(adminDoc.id, adminDoc.data()!);
      }
      return null;
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'getAdminById', error, { adminId });
      return null;
    }
  },

  // Get dashboard statistics
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const [studentsSnapshot, supervisorsSnapshot, applicationsSnapshot] = await Promise.all([
        adminDb.collection('students').get(),
        adminDb.collection('supervisors').where('isActive', '==', true).get(),
        adminDb.collection('applications').get(),
      ]);

      const students: Student[] = studentsSnapshot.docs.map((doc) => toStudent(doc.id, doc.data()));
      const supervisors = supervisorsSnapshot.docs.map((doc) => doc.data());
      const applications = applicationsSnapshot.docs.map((doc) => toApplication(doc.id, doc.data()));

      // Existing metrics
      const matchedStudents = students.filter((s) => s.matchStatus === 'matched').length;
      const pendingMatches = students.filter(
        (s) => s.matchStatus === 'pending' || s.matchStatus === 'unmatched'
      ).length;

      // NEW METRICS
      // 1. Total supervisors (count all)
      const totalSupervisors = supervisorsSnapshot.size;

      // 2. Approved applications
      const approvedApplications = applications.filter(
        (app) => app.status === 'approved'
      ).length;

      // 3. Pending applications
      const pendingApplications = applications.filter(
        (app) => app.status === 'pending'
      ).length;

      // 4. Students without approved application (ALL students)
      const studentsWithoutApprovedApp = students.filter((student) => {
        const hasApprovedApp = applications.some(
          (app) => app.studentId === student.id && app.status === 'approved'
        );
        return !hasApprovedApp;
      }).length;

      // 5. Total available capacity (sum of available slots)
      const totalAvailableCapacity = supervisors.reduce((total, supervisor) => {
        const available = (supervisor.maxCapacity || 0) - (supervisor.currentCapacity || 0);
        return total + (available > 0 ? available : 0);
      }, 0);

      // TODO: 6. Active supervisor partnerships (count projects with coSupervisorId)
      // This feature is planned for future implementation. The coSupervisorId field
      // was removed from the Project type, so this code is commented out until
      // partnership functionality is re-implemented.
      // Query projects with active status, then filter for those with coSupervisorId
      // const [pendingProjects, approvedProjects, inProgressProjects] = await Promise.all([
      //   adminDb.collection('projects')
      //     .where('status', '==', 'pending_approval')
      //     .get(),
      //   adminDb.collection('projects')
      //     .where('status', '==', 'approved')
      //     .get(),
      //   adminDb.collection('projects')
      //     .where('status', '==', 'in_progress')
      //     .get(),
      // ]);
      // 
      // // Combine and filter for projects with coSupervisorId
      // const allActiveProjects = [
      //   ...pendingProjects.docs,
      //   ...approvedProjects.docs,
      //   ...inProgressProjects.docs
      // ];
      
      return {
        totalStudents: students.length,
        matchedStudents,
        pendingMatches,
        activeSupervisors: supervisorsSnapshot.size,
        totalSupervisors,
        approvedApplications,
        pendingApplications,
        studentsWithoutApprovedApp,
        totalAvailableCapacity,
      };
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'getDashboardStats', error);
      return {
        totalStudents: 0,
        matchedStudents: 0,
        pendingMatches: 0,
        activeSupervisors: 0,
        totalSupervisors: 0,
        approvedApplications: 0,
        pendingApplications: 0,
        studentsWithoutApprovedApp: 0,
        totalAvailableCapacity: 0,
      };
    }
  },
};
