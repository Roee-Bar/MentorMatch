// lib/services/projects/project-service.ts
// SERVER-ONLY: This file must ONLY be imported in API routes (server-side)
// Project management services

import { adminDb } from '@/lib/firebase-admin';
import type { Project } from '@/types/database';

// ============================================
// PROJECT SERVICES
// ============================================
export const ProjectService = {
  // Get project by ID
  async getProjectById(projectId: string): Promise<Project | null> {
    try {
      const projectDoc = await adminDb.collection('projects').doc(projectId).get();
      if (projectDoc.exists) {
        return { id: projectDoc.id, ...projectDoc.data() } as unknown as Project;
      }
      return null;
    } catch (error) {
      console.error('Error fetching project:', error);
      return null;
    }
  },

  // Get all projects
  async getAllProjects(): Promise<Project[]> {
    try {
      const querySnapshot = await adminDb.collection('projects').get();
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Project[];
    } catch (error) {
      console.error('Error fetching projects:', error);
      return [];
    }
  },

  // Get projects for a supervisor
  async getSupervisorProjects(supervisorId: string): Promise<Project[]> {
    try {
      const querySnapshot = await adminDb.collection('projects')
        .where('supervisorId', '==', supervisorId)
        .get();
      
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Project[];
    } catch (error) {
      console.error('Error fetching supervisor projects:', error);
      return [];
    }
  },

  // Create new project
  async createProject(projectData: Omit<Project, 'id'>): Promise<string | null> {
    try {
      const docRef = await adminDb.collection('projects').add({
        ...projectData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating project:', error);
      return null;
    }
  },

  // Generate project code
  generateProjectCode(year: number, semester: number, department: string, number: number): string {
    const deptCode = department.charAt(0).toUpperCase();
    return `${year}-${semester}-${deptCode}-${number.toString().padStart(2, '0')}`;
  },
};

