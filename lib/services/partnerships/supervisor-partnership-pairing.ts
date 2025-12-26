// lib/services/partnerships/supervisor-partnership-pairing.ts
// SERVER-ONLY: Supervisor partnership operations for project-based partnerships
//
// PROJECT-BASED PARTNERSHIP MODEL:
// - Partnerships are tracked via Project.coSupervisorId, not Supervisor.partnerId
// - Supervisors can have multiple active partnerships (one per project)
// - Partnerships end when project completes/cancels (coSupervisorId cleared)

import { adminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { SupervisorService } from '@/lib/services/supervisors/supervisor-service';
import { ProjectService } from '@/lib/services/projects/project-service';
import { toSupervisor, toProject } from '@/lib/services/shared/firestore-converters';
import { ServiceResults } from '@/lib/services/shared/types';
import { executeBatchUpdates } from './utils/batch-utils';
import type { ServiceResult } from '@/lib/services/shared/types';
import type { Supervisor, Project } from '@/types/database';

const SERVICE_NAME = 'SupervisorPartnershipPairingService';

// ============================================
// SUPERVISOR PAIRING OPERATIONS
// ============================================
export const SupervisorPartnershipPairingService = {
  /**
   * Get available supervisors for partnership (excluding current user and those already co-supervising with requester in active projects)
   * 
   * Filters out supervisors who are already co-supervising with the requester in active projects
   * to prevent duplicate partnerships for the same pair of supervisors.
   * 
   * @param currentSupervisorId - ID of the supervisor looking for partners
   * @returns Array of available supervisors (excludes current user and existing partners)
   */
  async getAvailableSupervisors(currentSupervisorId: string): Promise<Supervisor[]> {
    try {
      // Get all active supervisors
      const supervisorsSnapshot = await adminDb.collection('supervisors')
        .where('isActive', '==', true)
        .get();
      
      const allSupervisors = supervisorsSnapshot.docs
        .filter(doc => doc.id !== currentSupervisorId)
        .map(doc => toSupervisor(doc.id, doc.data()));

      // Get active projects where current supervisor is supervisor or co-supervisor
      const [projectsAsSupervisor, projectsAsCoSupervisor] = await Promise.all([
        adminDb.collection('projects')
          .where('supervisorId', '==', currentSupervisorId)
          .where('status', 'in', ['pending_approval', 'approved', 'in_progress'])
          .get(),
        adminDb.collection('projects')
          .where('coSupervisorId', '==', currentSupervisorId)
          .where('status', 'in', ['pending_approval', 'approved', 'in_progress'])
          .get()
      ]);

      // Collect IDs of supervisors already partnered with in active projects
      const alreadyPartneredIds = new Set<string>();
      
      projectsAsSupervisor.docs.forEach(doc => {
        const projectData = doc.data();
        if (projectData.coSupervisorId) {
          alreadyPartneredIds.add(projectData.coSupervisorId);
        }
      });

      projectsAsCoSupervisor.docs.forEach(doc => {
        const projectData = doc.data();
        if (projectData.supervisorId) {
          alreadyPartneredIds.add(projectData.supervisorId);
        }
      });

      // Filter out supervisors already partnered with in active projects
      let filteredSupervisors = allSupervisors.filter(supervisor => !alreadyPartneredIds.has(supervisor.id));

      // Apply pagination if options provided
      if (options) {
        const offset = options.offset || 0;
        const limit = options.limit;
        
        if (limit !== undefined) {
          filteredSupervisors = filteredSupervisors.slice(offset, offset + limit);
        } else if (offset > 0) {
          filteredSupervisors = filteredSupervisors.slice(offset);
        }
      }

      return filteredSupervisors;
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'getAvailableSupervisors', error, { currentSupervisorId });
      return [];
    }
  },

  /**
   * Get all active partnerships for a supervisor
   * Returns all projects where supervisor is co-supervisor
   */
  async getActivePartnerships(supervisorId: string): Promise<Project[]> {
    try {
      const snapshot = await adminDb.collection('projects')
        .where('coSupervisorId', '==', supervisorId)
        .where('status', 'in', ['pending_approval', 'approved', 'in_progress'])
        .get();
      
      return snapshot.docs.map(doc => toProject(doc.id, doc.data()));
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'getActivePartnerships', error, { supervisorId });
      return [];
    }
  },

  /**
   * Get partnership details for a specific project
   * Returns the project if it has a co-supervisor, null otherwise
   */
  async getPartnershipForProject(projectId: string): Promise<Project | null> {
    try {
      const project = await ProjectService.getProjectById(projectId);
      if (!project || !project.coSupervisorId) {
        return null;
      }
      return project;
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'getPartnershipForProject', error, { projectId });
      return null;
    }
  },

  /**
   * Cancel all pending requests for a supervisor (cleanup after pairing)
   * 
   * Status Terminology:
   * - "Cancelled" is used for requests automatically cancelled when a partnership is accepted.
   *   This is automatic cleanup, not a user action.
   * - "Rejected" is used when a supervisor explicitly rejects a request (see _rejectRequest in
   *   supervisor-partnership-workflow.ts).
   * 
   * This distinction helps differentiate between automatic cleanup and user actions.
   */
  async cancelAllPendingRequests(supervisorId: string): Promise<ServiceResult> {
    try {
      // Get all pending requests where supervisor is requester or target
      const [requestsAsRequester, requestsAsTarget] = await Promise.all([
        adminDb.collection('supervisor_partnership_requests')
          .where('requesterId', '==', supervisorId)
          .where('status', '==', 'pending')
          .get(),
        adminDb.collection('supervisor_partnership_requests')
          .where('targetSupervisorId', '==', supervisorId)
          .where('status', '==', 'pending')
          .get()
      ]);

      const allRefs = [
        ...requestsAsRequester.docs.map(doc => doc.ref),
        ...requestsAsTarget.docs.map(doc => doc.ref)
      ];
      
      const result = await executeBatchUpdates(
        allRefs,
        { status: 'cancelled', respondedAt: new Date() },
        'cancelAllPendingRequests'
      );

      return ServiceResults.success(undefined, `Cancelled ${result.totalUpdated} pending request(s)`);
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'cancelAllPendingRequests', error, { supervisorId });
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return ServiceResults.error(
        `Failed to cancel pending requests for supervisor: ${errorMessage}`
      );
    }
  },

  /**
   * Cancel all pending requests for a specific project
   * Used when a partnership is accepted for a project
   */
  async cancelAllPendingRequestsForProject(projectId: string): Promise<ServiceResult> {
    try {
      // Get all pending requests for this project
      const requestsSnapshot = await adminDb.collection('supervisor_partnership_requests')
        .where('projectId', '==', projectId)
        .where('status', '==', 'pending')
        .get();

      const allRefs = requestsSnapshot.docs.map(doc => doc.ref);
      
      const result = await executeBatchUpdates(
        allRefs,
        { status: 'cancelled', respondedAt: new Date() },
        'cancelAllPendingRequestsForProject'
      );

      return ServiceResults.success(undefined, `Cancelled ${result.totalUpdated} pending request(s) for project`);
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'cancelAllPendingRequestsForProject', error, { projectId });
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return ServiceResults.error(
        `Failed to cancel pending requests for project ${projectId}: ${errorMessage}`
      );
    }
  },

  /**
   * Get supervisors with available capacity who are not already co-supervising with requester
   * Returns supervisors who:
   * - Are not already co-supervising with requester in active projects
   * - Have available capacity (currentCapacity < maxCapacity)
   */
  async getPartnersWithAvailableCapacity(supervisorId: string): Promise<Supervisor[]> {
    try {
      // Get available supervisors (excludes those already partnered with in active projects)
      const availableSupervisors = await this.getAvailableSupervisors(supervisorId);
      
      // Filter by capacity: currentCapacity < maxCapacity
      return availableSupervisors.filter(
        supervisor => supervisor.currentCapacity < supervisor.maxCapacity
      );
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'getPartnersWithAvailableCapacity', error, { supervisorId });
      return [];
    }
  },
};
