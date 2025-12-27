// lib/services/projects/project-service.ts
// SERVER-ONLY: This file must ONLY be imported in API routes (server-side)
// Project management services

import { adminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { toProject } from '@/lib/services/shared/firestore-converters';
import { SupervisorService } from '@/lib/services/supervisors/supervisor-service';
import { SupervisorPartnershipRequestService } from '@/lib/services/partnerships/supervisor-partnership-request-service';
import { ServiceResults } from '@/lib/services/shared/types';
import type { ServiceResult } from '@/lib/services/shared/types';
import type { Project } from '@/types/database';

const SERVICE_NAME = 'ProjectService';

// ============================================
// STATUS TRANSITION VALIDATION
// ============================================

/**
 * Valid status transitions for projects
 * Defines which status changes are allowed from each current status
 */
const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  'pending_approval': ['approved'],
  'approved': ['in_progress', 'completed'],
  'in_progress': ['completed'],
  'completed': [], // Terminal state - no transitions allowed
};

/**
 * Check if a status transition is valid
 * @param currentStatus - Current project status
 * @param newStatus - Desired new status
 * @returns true if transition is valid, false otherwise
 */
function isValidStatusTransition(currentStatus: string, newStatus: string): boolean {
  // Same status is always valid (idempotent)
  if (currentStatus === newStatus) {
    return true;
  }
  
  const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus] || [];
  return allowedTransitions.includes(newStatus);
}

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
  async handleProjectStatusChange(projectId: string, newStatus: 'pending_approval' | 'approved' | 'in_progress' | 'completed'): Promise<ServiceResult> {
    try {
      const project = await this.getProjectById(projectId);
      if (!project) {
        return ServiceResults.error('Project not found');
      }

      // Validate status transition
      if (!isValidStatusTransition(project.status, newStatus)) {
        return ServiceResults.error(
          `Invalid status transition from ${project.status} to ${newStatus}. ` +
          `Allowed transitions from ${project.status}: ${VALID_STATUS_TRANSITIONS[project.status]?.join(', ') || 'none'}`
        );
      }

      // Update project status and clear coSupervisorId when project is completed (partnership ends)
      await adminDb.runTransaction(async (transaction) => {
        const projectRef = adminDb.collection('projects').doc(projectId);
        const updates: Partial<Project> = {
          status: newStatus,
          updatedAt: new Date()
        };
        
        // Clear coSupervisorId when project is completed
        if (newStatus === 'completed' && project.coSupervisorId) {
          updates.coSupervisorId = undefined;
          updates.coSupervisorName = undefined;
        }
        
        transaction.update(projectRef, updates);
      });

      if (newStatus === 'completed' && project.coSupervisorId) {
        logger.service.success(SERVICE_NAME, 'handleProjectStatusChange', {
          projectId,
          status: newStatus,
          clearedCoSupervisor: project.coSupervisorId,
          message: 'Partnership ended - coSupervisorId cleared'
        });
      }

      return ServiceResults.success(undefined, 'Project status updated successfully');
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'handleProjectStatusChange', error, { projectId, newStatus });
      return ServiceResults.error(
        error instanceof Error ? error.message : 'Failed to handle project status change'
      );
    }
  },

  /**
   * Handle project deletion - clear co-supervisor and cancel pending requests
   * Automatically cleans up all partnership-related data for the project
   * 
   * @param projectId - ID of the project being deleted
   * @returns ServiceResult indicating success or failure
   * @throws Error if project not found
   */
  async handleProjectDeletion(projectId: string): Promise<ServiceResult> {
    try {
      const project = await this.getProjectById(projectId);
      if (!project) {
        return ServiceResults.error('Project not found');
      }

      // Clear coSupervisorId and cancel all pending partnership requests for this project
      await adminDb.runTransaction(async (transaction) => {
        const projectRef = adminDb.collection('projects').doc(projectId);
        
        // Clear coSupervisorId if it exists
        if (project.coSupervisorId) {
          transaction.update(projectRef, {
            coSupervisorId: null,
            coSupervisorName: null,
            updatedAt: new Date()
          });
        }
      });

      // Cancel all pending partnership requests for this project (outside transaction for batch operations)
      await SupervisorPartnershipRequestService.cancelRequestsForProject(projectId);

      logger.service.success(SERVICE_NAME, 'handleProjectDeletion', {
        projectId,
        clearedCoSupervisor: project.coSupervisorId || 'none',
        message: 'Project deletion - partnership cleanup completed'
      });

      return ServiceResults.success(undefined, 'Project deletion handled successfully');
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'handleProjectDeletion', error, { projectId });
      return ServiceResults.error(
        error instanceof Error ? error.message : 'Failed to handle project deletion'
      );
    }
  },

  /**
   * Validate co-supervisor can be added to project
   * Checks project exists, supervisor is project owner, project has no co-supervisor, and co-supervisor has capacity
   * 
   * @param projectId - ID of the project
   * @param supervisorId - ID of the project supervisor (must match project supervisor)
   * @param coSupervisorId - ID of the potential co-supervisor
   * @returns ServiceResult indicating validation result
   * @throws Error if validation fails (project not found, unauthorized, already has co-supervisor, or no capacity)
   */
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
