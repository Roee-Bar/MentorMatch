// lib/services/projects/project-service.ts
// SERVER-ONLY: This file must ONLY be imported in API routes (server-side)
// Project management services

import { adminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { toProject } from '@/lib/services/shared/firestore-converters';
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
      const docRef = await adminDb.collection('projects').add({
        ...projectData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return ServiceResults.success(docRef.id, 'Project created successfully');
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'createProject', error);
      return ServiceResults.error(
        error instanceof Error ? error.message : 'Failed to create project'
      );
    }
  },

  // Generate project code
  generateProjectCode(year: number, semester: number, department: string, number: number): string {
    const deptCode = department.charAt(0).toUpperCase();
    return `${year}-${semester}-${deptCode}-${number.toString().padStart(2, '0')}`;
  },
};
