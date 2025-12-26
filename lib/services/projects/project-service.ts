// lib/services/projects/project-service.ts
// SERVER-ONLY: This file must ONLY be imported in API routes (server-side)
// Project management services

import { adminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { toProject } from '@/lib/services/shared/firestore-converters';
import { SupervisorService } from '@/lib/services/supervisors/supervisor-service';
import { ServiceResults } from '@/lib/services/shared/types';
import type { ServiceResult } from '@/lib/services/shared/types';
import type { Project } from '@/types/database';

const SERVICE_NAME = 'ProjectService';

// ============================================
// PROJECT SERVICES
// ============================================
export const ProjectService = {
  // Get project by ID
  async getProjectById(projectId: string): Promise<Project | null> {
    try {
      const projectDoc = await adminDb.collection('projects').doc(projectId).get();
      if (projectDoc.exists) {
        return toProject(projectDoc.id, projectDoc.data()!);
      }
      return null;
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'getProjectById', error, { projectId });
      return null;
    }
  },

  // Get all projects
  async getAllProjects(): Promise<Project[]> {
    try {
      const querySnapshot = await adminDb.collection('projects').get();
      return querySnapshot.docs.map((doc) => toProject(doc.id, doc.data()));
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'getAllProjects', error);
      return [];
    }
  },

  // Get projects for a supervisor
  async getSupervisorProjects(supervisorId: string): Promise<Project[]> {
    try {
      const querySnapshot = await adminDb.collection('projects')
        .where('supervisorId', '==', supervisorId)
        .get();
      
      return querySnapshot.docs.map((doc) => toProject(doc.id, doc.data()));
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'getSupervisorProjects', error, { supervisorId });
      return [];
    }
  },

  // Create new project
  async createProject(projectData: Omit<Project, 'id'>): Promise<ServiceResult<string>> {
    try {
      let projectId = '';
      
      // Use transaction to create project and validate co-supervisor if provided
      await adminDb.runTransaction(async (transaction) => {
        const projectRef = adminDb.collection('projects').doc();
        projectId = projectRef.id;
        
        // If coSupervisorId is provided, validate supervisor exists and has capacity
        if (projectData.coSupervisorId) {
          const supervisorRef = adminDb.collection('supervisors').doc(projectData.supervisorId);
          const coSupervisorRef = adminDb.collection('supervisors').doc(projectData.coSupervisorId);
          
          const [supervisorSnap, coSupervisorSnap] = await transaction.getAll(supervisorRef, coSupervisorRef);
          
          if (!supervisorSnap.exists || !coSupervisorSnap.exists) {
            throw new Error('One or both supervisors not found');
          }

          const coSupervisorData = coSupervisorSnap.data();
          if (coSupervisorData && coSupervisorData.currentCapacity >= coSupervisorData.maxCapacity) {
            throw new Error('Co-supervisor has no available capacity');
          }
        }
        
        transaction.set(projectRef, {
          ...projectData,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });

      return ServiceResults.success(projectId, 'Project created successfully');
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'createProject', error);
      return ServiceResults.error(
        error instanceof Error ? error.message : 'Failed to create project'
      );
    }
  },

  // Update project
  async updateProject(projectId: string, projectData: Partial<Project>): Promise<ServiceResult> {
    try {
      const existingProject = await this.getProjectById(projectId);
      if (!existingProject) {
        return ServiceResults.error('Project not found');
      }

      await adminDb.runTransaction(async (transaction) => {
        const projectRef = adminDb.collection('projects').doc(projectId);
        
        // Handle coSupervisorId changes
        const oldCoSupervisorId = existingProject.coSupervisorId;
        const newCoSupervisorId = projectData.coSupervisorId;

        // If coSupervisorId is being added or changed, validate supervisor exists and has capacity
        if (newCoSupervisorId && newCoSupervisorId !== oldCoSupervisorId) {
          const coSupervisorRef = adminDb.collection('supervisors').doc(newCoSupervisorId);
          const coSupervisorSnap = await transaction.get(coSupervisorRef);
          
          if (!coSupervisorSnap.exists) {
            throw new Error('Co-supervisor not found');
          }

          const coSupervisorData = coSupervisorSnap.data();
          if (coSupervisorData && coSupervisorData.currentCapacity >= coSupervisorData.maxCapacity) {
            throw new Error('Co-supervisor has no available capacity');
          }

          // Get co-supervisor name if not provided
          if (!projectData.coSupervisorName && coSupervisorData) {
            projectData.coSupervisorName = coSupervisorData.fullName || '';
          }
        }
        // If coSupervisorId is being removed, clear coSupervisorName
        else if (oldCoSupervisorId && !newCoSupervisorId) {
          projectData.coSupervisorName = undefined;
        }
        
        // Update project
        transaction.update(projectRef, {
          ...projectData,
          updatedAt: new Date(),
        });
      });

      return ServiceResults.success(undefined, 'Project updated successfully');
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'updateProject', error, { projectId });
      return ServiceResults.error(
        error instanceof Error ? error.message : 'Failed to update project'
      );
    }
  },

  // Handle project status changes - clear co-supervisor when project ends
  async handleProjectStatusChange(projectId: string, newStatus: string): Promise<ServiceResult> {
    try {
      const project = await this.getProjectById(projectId);
      if (!project) {
        return ServiceResults.error('Project not found');
      }

      // Clear coSupervisorId when project is completed (partnership ends)
      if (newStatus === 'completed') {
        if (project.coSupervisorId) {
          await adminDb.runTransaction(async (transaction) => {
            const projectRef = adminDb.collection('projects').doc(projectId);
            transaction.update(projectRef, {
              coSupervisorId: null,
              coSupervisorName: null,
              updatedAt: new Date()
            });
          });
        }
      }

      return ServiceResults.success(undefined, 'Project status updated successfully');
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'handleProjectStatusChange', error, { projectId, newStatus });
      return ServiceResults.error(
        error instanceof Error ? error.message : 'Failed to handle project status change'
      );
    }
  },

  // Validate co-supervisor can be added to project
  async validateCoSupervisor(projectId: string, supervisorId: string, coSupervisorId: string): Promise<ServiceResult> {
    try {
      const project = await this.getProjectById(projectId);
      if (!project) {
        return ServiceResults.error('Project not found');
      }

      if (project.supervisorId !== supervisorId) {
        return ServiceResults.error('Only the project supervisor can add a co-supervisor');
      }

      if (project.coSupervisorId) {
        return ServiceResults.error('This project already has a co-supervisor');
      }

      const coSupervisor = await SupervisorService.getSupervisorById(coSupervisorId);
      if (!coSupervisor) {
        return ServiceResults.error('Co-supervisor not found');
      }

      if (coSupervisor.currentCapacity >= coSupervisor.maxCapacity) {
        return ServiceResults.error('Co-supervisor has no available capacity');
      }

      return ServiceResults.success(undefined, 'Co-supervisor validation passed');
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'validateCoSupervisor', error, { projectId, supervisorId, coSupervisorId });
      return ServiceResults.error(
        error instanceof Error ? error.message : 'Failed to validate co-supervisor'
      );
    }
  },

  // Generate project code
  generateProjectCode(year: number, semester: number, department: string, number: number): string {
    const deptCode = department.charAt(0).toUpperCase();
    return `${year}-${semester}-${deptCode}-${number.toString().padStart(2, '0')}`;
  },
};
