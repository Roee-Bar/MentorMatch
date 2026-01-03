// lib/services/admin/admin-service.ts
// SERVER-ONLY: This file must ONLY be imported in API routes (server-side)
// Admin management services

import { adminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { BaseService } from '@/lib/services/shared/base-service';
import { toAdmin, toStudent, toApplication } from '@/lib/services/shared/firestore-converters';
import type { Admin, DashboardStats, Student } from '@/types/database';

// ============================================
// ADMIN SERVICE CLASS
// ============================================
class AdminServiceClass extends BaseService<Admin> {
  protected collectionName = 'admins';
  protected serviceName = 'AdminService';
  
  protected toEntity(id: string, data: any): Admin {
    return toAdmin(id, data);
  }

  /**
   * Get admin by ID
   * 
   * @param adminId - Admin ID
   * @returns Admin or null if not found
   */
  async getAdminById(adminId: string): Promise<Admin | null> {
    return this.getById(adminId);
  }

  /**
   * Get dashboard statistics
   * Aggregates data from students, supervisors, and applications collections
   * 
   * @returns Dashboard statistics object
   */
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
      logger.service.error(this.serviceName, 'getDashboardStats', error);
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
  }
}

// Create singleton instance and export
export const adminService = new AdminServiceClass();
