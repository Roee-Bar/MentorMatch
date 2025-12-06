// lib/services/admin/admin-service.ts
// SERVER-ONLY: This file must ONLY be imported in API routes (server-side)
// Admin management services

import { adminDb } from '@/lib/firebase-admin';
import type { Admin, DashboardStats } from '@/types/database';

// ============================================
// ADMIN SERVICES
// ============================================
export const AdminService = {
  // Get admin by ID
  async getAdminById(adminId: string): Promise<Admin | null> {
    try {
      const adminDoc = await adminDb.collection('admins').doc(adminId).get();
      if (adminDoc.exists) {
        return { id: adminDoc.id, ...adminDoc.data() } as unknown as Admin;
      }
      return null;
    } catch (error) {
      console.error('Error fetching admin:', error);
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

      const students = studentsSnapshot.docs.map((doc) => doc.data());
      const supervisors = supervisorsSnapshot.docs.map((doc) => doc.data());
      const applications = applicationsSnapshot.docs.map((doc) => doc.data());

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
        const available = supervisor.maxCapacity - supervisor.currentCapacity;
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
      console.error('Error fetching dashboard stats:', error);
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

