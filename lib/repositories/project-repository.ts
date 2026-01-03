// lib/repositories/project-repository.ts
// SERVER-ONLY: This file must ONLY be imported in API routes (server-side)

import { BaseRepository } from './base-repository';
import { toProject } from '@/lib/services/shared/firestore-converters';
import type { Project } from '@/types/database';
import type { DocumentData } from 'firebase-admin/firestore';

export class ProjectRepository extends BaseRepository<Project> {
  protected collectionName = 'projects';
  protected repositoryName = 'ProjectRepository';
  
  protected toEntity(id: string, data: DocumentData): Project {
    return toProject(id, data);
  }

  // Custom query methods
  async findBySupervisorId(supervisorId: string): Promise<Project[]> {
    return this.findAll([
      { field: 'supervisorId', operator: '==', value: supervisorId }
    ]);
  }

  async findByStudentId(studentId: string): Promise<Project[]> {
    return this.findAll([
      { field: 'studentIds', operator: 'array-contains', value: studentId }
    ]);
  }

  async findByStatus(status: Project['status']): Promise<Project[]> {
    return this.findAll([
      { field: 'status', operator: '==', value: status }
    ]);
  }
}

// Export singleton instance
export const projectRepository = new ProjectRepository();

