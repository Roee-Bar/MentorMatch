// lib/services/admin/admin-service.ts

import { logger } from '@/lib/logger';
import { BaseService } from '@/lib/services/shared/base-service';
import { adminRepository } from '@/lib/repositories/admin-repository';
import { studentRepository } from '@/lib/repositories/student-repository';
import { supervisorRepository } from '@/lib/repositories/supervisor-repository';
import { applicationRepository } from '@/lib/repositories/application-repository';
import type { Admin, DashboardStats, Student } from '@/types/database';

class AdminServiceClass extends BaseService<Admin> {
  protected serviceName = 'AdminService';
  protected repository = adminRepository;

  async getAdminById(adminId: string): Promise<Admin | null> {
    return this.getById(adminId);
  }

  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const [students, supervisors, applications] = await Promise.all([
        studentRepository.findAll(),
        supervisorRepository.findActive(),
        applicationRepository.findAll(),
      ]);

      const matchedStudents = students.filter((s) => s.matchStatus === 'matched').length;
      const pendingMatches = students.filter(
        (s) => s.matchStatus === 'pending' || s.matchStatus === 'unmatched'
      ).length;

      const totalSupervisors = supervisors.length;
      const approvedApplications = applications.filter(
        (app) => app.status === 'approved'
      ).length;
      const pendingApplications = applications.filter(
        (app) => app.status === 'pending'
      ).length;

      const studentsWithoutApprovedApp = students.filter((student) => {
        const hasApprovedApp = applications.some(
          (app) => app.studentId === student.id && app.status === 'approved'
        );
        return !hasApprovedApp;
      }).length;

      const totalAvailableCapacity = supervisors.reduce((total, supervisor) => {
        const available = (supervisor.maxCapacity || 0) - (supervisor.currentCapacity || 0);
        return total + (available > 0 ? available : 0);
      }, 0);

      return {
        totalStudents: students.length,
        matchedStudents,
        pendingMatches,
        activeSupervisors: supervisors.length,
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

export const adminService = new AdminServiceClass();
