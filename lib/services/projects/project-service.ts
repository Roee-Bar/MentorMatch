// lib/services/projects/project-service.ts
// SERVER-ONLY: This file must ONLY be imported in API routes (server-side)
// Project management services

import { BaseService } from '@/lib/services/shared/base-service';
import { toProject } from '@/lib/services/shared/firestore-converters';
import type { ServiceResult } from '@/lib/services/shared/types';
import type { Project } from '@/types/database';

// ============================================
// PROJECT SERVICE CLASS
// ============================================
class ProjectServiceClass extends BaseService<Project> {
  protected collectionName = 'projects';
  protected serviceName = 'ProjectService';
  
  protected toEntity(id: string, data: any): Project {
    return toProject(id, data);
  }

  // Public methods that wrap protected base methods
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

  // Custom method (not in base class)
  generateProjectCode(year: number, semester: number, department: string, number: number): string {
    const deptCode = department.charAt(0).toUpperCase();
    return `${year}-${semester}-${deptCode}-${number.toString().padStart(2, '0')}`;
  }
}

// Create singleton instance
const projectService = new ProjectServiceClass();

// ============================================
// BACKWARD COMPATIBLE EXPORT
// Maintains existing API for all consumers
// ============================================
export const ProjectService = {
  getProjectById: (id: string) => projectService.getProjectById(id),
  getAllProjects: () => projectService.getAllProjects(),
  getSupervisorProjects: (supervisorId: string) => projectService.getSupervisorProjects(supervisorId),
  createProject: (data: Omit<Project, 'id'>) => projectService.createProject(data),
  generateProjectCode: (year: number, semester: number, department: string, number: number) => 
    projectService.generateProjectCode(year, semester, department, number),
};
