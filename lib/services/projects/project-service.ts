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

  /**
   * Get project by ID
   * 
   * @param projectId - Project ID
   * @returns Project or null if not found
   */
  async getProjectById(projectId: string): Promise<Project | null> {
    return this.getById(projectId);
  }

  /**
   * Get all projects
   * 
   * @returns Array of all projects
   */
  async getAllProjects(): Promise<Project[]> {
    return this.getAll();
  }

  /**
   * Get projects for a supervisor
   * 
   * @param supervisorId - Supervisor ID
   * @returns Array of projects
   */
  async getSupervisorProjects(supervisorId: string): Promise<Project[]> {
    return this.query([
      { field: 'supervisorId', operator: '==', value: supervisorId }
    ]);
  }

  /**
   * Create new project
   * 
   * @param projectData - Project data (timestamp fields will be set automatically)
   * @returns ServiceResult with project ID or error
   */
  async createProject(projectData: Omit<Project, 'id'>): Promise<ServiceResult<string>> {
    return this.create(projectData);
  }

  /**
   * Generate project code
   * 
   * @param year - Year
   * @param semester - Semester number
   * @param department - Department name
   * @param number - Project number
   * @returns Formatted project code string
   */
  generateProjectCode(year: number, semester: number, department: string, number: number): string {
    const deptCode = department.charAt(0).toUpperCase();
    return `${year}-${semester}-${deptCode}-${number.toString().padStart(2, '0')}`;
  }
}

// Create singleton instance and export
export const projectService = new ProjectServiceClass();
