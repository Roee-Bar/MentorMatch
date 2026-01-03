// lib/services/projects/project-service.ts
// SERVER-ONLY: This file must ONLY be imported in API routes (server-side)
// Project management services

import { BaseService } from '@/lib/services/shared/base-service';
import { projectRepository } from '@/lib/repositories/project-repository';
import type { ServiceResult } from '@/lib/services/shared/types';
import type { Project } from '@/types/database';

// ============================================
// PROJECT SERVICE CLASS
// ============================================
class ProjectServiceClass extends BaseService<Project> {
  protected serviceName = 'ProjectService';
  protected repository = projectRepository;

  async getProjectById(projectId: string): Promise<Project | null> {
    return this.getById(projectId);
  }

  async getAllProjects(): Promise<Project[]> {
    return this.getAll();
  }

  async getSupervisorProjects(supervisorId: string): Promise<Project[]> {
    return this.query([
      { field: 'supervisorId', operator: '==', value: supervisorId }
    ]);
  }

  async createProject(projectData: Omit<Project, 'id'>): Promise<ServiceResult<string>> {
    return this.create(projectData);
  }

  generateProjectCode(year: number, semester: number, department: string, number: number): string {
    const deptCode = department.charAt(0).toUpperCase();
    return `${year}-${semester}-${deptCode}-${number.toString().padStart(2, '0')}`;
  }
}

// Create singleton instance and export
export const projectService = new ProjectServiceClass();
