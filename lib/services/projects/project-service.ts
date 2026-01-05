// lib/services/projects/project-service.ts

import { BaseService } from '@/lib/services/shared/base-service';
import { projectRepository } from '@/lib/repositories/project-repository';
import { studentService } from '@/lib/services/students/student-service';
import { supervisorService } from '@/lib/services/supervisors/supervisor-service';
import { logger } from '@/lib/logger';
import { ServiceResults } from '@/lib/services/shared/types';
import type { ServiceResult } from '@/lib/services/shared/types';
import type { Project, CreateProjectData } from '@/types/database';

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

  async createProject(projectData: CreateProjectData): Promise<ServiceResult<string>> {
    try {
      // Fetch student names
      const students = await Promise.all(
        projectData.studentIds.map(id => studentService.getStudentById(id))
      );
      
      const studentNames = students
        .filter((student): student is NonNullable<typeof student> => student !== null)
        .map(student => student.fullName);

      if (studentNames.length !== projectData.studentIds.length) {
        return ServiceResults.error('One or more student IDs are invalid');
      }

      // Fetch supervisor name
      const supervisor = await supervisorService.getSupervisorById(projectData.supervisorId);
      if (!supervisor) {
        return ServiceResults.error('Supervisor ID is invalid');
      }

      // Fetch co-supervisor name if provided
      let coSupervisorName: string | undefined;
      if (projectData.coSupervisorId) {
        const coSupervisor = await supervisorService.getSupervisorById(projectData.coSupervisorId);
        if (!coSupervisor) {
          return ServiceResults.error('Co-supervisor ID is invalid');
        }
        coSupervisorName = coSupervisor.fullName;
      }

      // Generate project code (using current year and semester as defaults)
      // TODO: This should be configurable or passed as a parameter
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth();
      const semester = currentMonth >= 0 && currentMonth < 6 ? 1 : 2; // Jan-Jun = 1, Jul-Dec = 2
      const projectCode = this.generateProjectCode(currentYear, semester, supervisor.department, 1);

      // Build full project data
      const fullProjectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'> = {
        projectCode,
        studentIds: projectData.studentIds,
        studentNames,
        supervisorId: projectData.supervisorId,
        supervisorName: supervisor.fullName,
        coSupervisorId: projectData.coSupervisorId,
        coSupervisorName,
        title: projectData.title,
        description: projectData.description,
        status: 'pending_approval',
        phase: 'A',
      };

      return this.create(fullProjectData);
    } catch (error) {
      logger.service.error(this.serviceName, 'createProject', error, { projectData });
      return ServiceResults.error(
        error instanceof Error ? error.message : 'Failed to create project'
      );
    }
  }

  generateProjectCode(year: number, semester: number, department: string, number: number): string {
    const deptCode = department.charAt(0).toUpperCase();
    return `${year}-${semester}-${deptCode}-${number.toString().padStart(2, '0')}`;
  }
}

export const projectService = new ProjectServiceClass();
