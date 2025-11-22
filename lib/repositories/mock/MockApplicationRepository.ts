import { Application } from '@/types/dashboard';
import { applications } from '@/mock-data/data/applications';
import { IApplicationRepository } from '../interfaces/IApplicationRepository';

/**
 * Mock implementation of IApplicationRepository
 * Uses static mock data from @/mock-data/data/applications
 */
export class MockApplicationRepository implements IApplicationRepository {
  /**
   * Get all applications
   * @returns Promise with all applications
   */
  async getAllApplications(): Promise<Application[]> {
    // Simulate async database call
    return Promise.resolve([...applications]);
  }

  /**
   * Get applications by student ID
   * @param studentId - The student's ID
   * @returns Promise with filtered applications
   */
  async getApplicationsByStudentId(studentId: string): Promise<Application[]> {
    // TODO: Implement filtering by studentId when studentId field is added to Application type
    return Promise.resolve([...applications]);
  }

  /**
   * Get application by ID
   * @param id - The application ID
   * @returns Promise with the application or null
   */
  async getApplicationById(id: string): Promise<Application | null> {
    const application = applications.find(app => app.id === id);
    return Promise.resolve(application || null);
  }

  /**
   * Get applications count
   * @returns Promise with count
   */
  async getApplicationsCount(): Promise<number> {
    return Promise.resolve(applications.length);
  }

  /**
   * Get approved applications count
   * @returns Promise with count of approved applications
   */
  async getApprovedApplicationsCount(): Promise<number> {
    const approved = applications.filter(app => app.status === 'approved');
    return Promise.resolve(approved.length);
  }
}
