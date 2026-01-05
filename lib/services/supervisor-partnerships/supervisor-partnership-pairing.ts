// lib/services/supervisor-partnerships/supervisor-partnership-pairing.ts

import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { logger } from '@/lib/logger';
import { supervisorService } from '@/lib/services/supervisors/supervisor-service';
import { projectService } from '@/lib/services/projects/project-service';
import { supervisorRepository } from '@/lib/repositories/supervisor-repository';
import { projectRepository } from '@/lib/repositories/project-repository';
import { ServiceResults } from '@/lib/services/shared/types';
import type { ServiceResult } from '@/lib/services/shared/types';
import type { Supervisor, Project } from '@/types/database';
import type { Transaction } from 'firebase-admin/firestore';

const SERVICE_NAME = 'SupervisorPartnershipPairingService';

/**
 * Shared transaction logic to remove co-supervisor from a project
 * Updates both the project and the co-supervisor's capacity atomically
 */
async function _removeCoSupervisorFromProject(
  projectId: string,
  coSupervisorId: string
): Promise<void> {
  try {
    await adminDb.runTransaction(async (transaction: Transaction) => {
      const projectRef = projectRepository.getDocumentRef(projectId);
      const coSupervisorRef = supervisorRepository.getDocumentRef(coSupervisorId);

      // Remove co-supervisor from project
      transaction.update(projectRef, {
        coSupervisorId: null,
        coSupervisorName: null,
        updatedAt: new Date()
      });

      // Decrease co-supervisor capacity
      transaction.update(coSupervisorRef, {
        currentCapacity: FieldValue.increment(-1),
        updatedAt: new Date()
      });
    });
  } catch (error: unknown) {
    logger.service.error(SERVICE_NAME, '_removeCoSupervisorFromProject - transaction failed', error, {
      projectId,
      coSupervisorId
    });
    // Re-throw to be caught by calling functions
    throw error;
  }
}

/**
 * Filter supervisors by capacity and active status
 * Excludes the specified supervisor ID and filters out inactive/unapproved supervisors
 * 
 * @param supervisors - Array of supervisors to filter
 * @param excludeSupervisorId - Supervisor ID to exclude from results
 * @returns Filtered array of supervisors with available capacity
 */
function _filterSupervisorsByCapacity(
  supervisors: Supervisor[],
  excludeSupervisorId: string
): Supervisor[] {
  return supervisors.filter(supervisor => {
    // Exclude the specified supervisor
    if (supervisor.id === excludeSupervisorId) {
      return false;
    }
    
    // Filter out inactive or unapproved supervisors
    if (!supervisor.isActive || !supervisor.isApproved) {
      return false;
    }
    
    // Only include supervisors with available capacity
    const availableCapacity = supervisor.maxCapacity - supervisor.currentCapacity;
    return availableCapacity > 0;
  });
}

export const SupervisorPartnershipPairingService = {
  /**
   * Get active partnerships for a supervisor (projects where they are co-supervisor)
   */
  async getActivePartnerships(
    supervisorId: string,
    projectId?: string
  ): Promise<Project[]> {
    try {
      if (projectId) {
        // If projectId is provided, get that specific project
        const project = await projectService.getProjectById(projectId);
        if (project && project.coSupervisorId === supervisorId && project.status !== 'completed') {
          return [project];
        }
        return [];
      }

      const allProjects = await projectRepository.findAll([
        { field: 'coSupervisorId', operator: '==', value: supervisorId }
      ]);
      
      // Filter out completed projects in memory (Firestore doesn't support != efficiently)
      return allProjects.filter(project => project.status !== 'completed');
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'getActivePartnerships', error, { supervisorId, projectId });
      return [];
    }
  },

  /**
   * Get supervisors with available capacity (excluding requesting supervisor)
   * Filtered by project requirements if needed
   */
  async getPartnersWithCapacity(
    requestingSupervisorId: string,
    projectId: string
  ): Promise<Supervisor[]> {
    try {
      // Get all active supervisors
      const allSupervisors = await supervisorService.getAllSupervisors();

      // Use shared filtering logic
      return _filterSupervisorsByCapacity(allSupervisors, requestingSupervisorId);
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'getPartnersWithCapacity', error, { requestingSupervisorId, projectId });
      return [];
    }
  },

  /**
   * Unpair co-supervisor from a project
   */
  async unpairCoSupervisor(
    projectId: string,
    supervisorId: string
  ): Promise<ServiceResult> {
    try {
      const project = await projectService.getProjectById(projectId);
      
      if (!project) {
        return ServiceResults.error('Project not found');
      }

      // Verify supervisor is either the main supervisor or the co-supervisor
      if (project.supervisorId !== supervisorId && project.coSupervisorId !== supervisorId) {
        return ServiceResults.error('Unauthorized to unpair from this project');
      }

      // Only main supervisor can remove co-supervisor
      if (project.supervisorId !== supervisorId) {
        return ServiceResults.error('Only the main supervisor can remove a co-supervisor');
      }

      if (!project.coSupervisorId) {
        return ServiceResults.error('Project does not have a co-supervisor');
      }

      const coSupervisorId = project.coSupervisorId;

      // Use shared transaction helper to remove co-supervisor
      await _removeCoSupervisorFromProject(projectId, coSupervisorId);

      return ServiceResults.success(undefined, 'Co-supervisor removed successfully');
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'unpairCoSupervisor', error, { projectId, supervisorId });
      return ServiceResults.error(
        error instanceof Error ? error.message : 'Failed to unpair co-supervisor'
      );
    }
  },

  /**
   * Cleanup partnerships when project completes
   * Removes co-supervisor and updates capacity
   */
  async cleanupPartnershipsOnProjectCompletion(projectId: string): Promise<ServiceResult> {
    try {
      const project = await projectService.getProjectById(projectId);
      
      if (!project) {
        return ServiceResults.error('Project not found');
      }

      if (!project.coSupervisorId) {
        // No co-supervisor to cleanup
        return ServiceResults.success(undefined, 'No co-supervisor to cleanup');
      }

      const coSupervisorId = project.coSupervisorId;

      // Use shared transaction helper to remove co-supervisor
      await _removeCoSupervisorFromProject(projectId, coSupervisorId);

      return ServiceResults.success(undefined, 'Partnerships cleaned up successfully');
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'cleanupPartnershipsOnProjectCompletion', error, { projectId });
      return ServiceResults.error(
        error instanceof Error ? error.message : 'Failed to cleanup partnerships'
      );
    }
  },
};

