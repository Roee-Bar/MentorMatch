import { Application } from '@/types/dashboard';

/**
 * Repository interface for Application data access
 * Implementations: MockApplicationRepository (current), FirebaseApplicationRepository (future)
 */
export interface IApplicationRepository {
  /**
   * Get all applications
   * @returns Promise with all applications
   */
  getAllApplications(): Promise<Application[]>;

  /**
   * Get applications by student ID
   * @param studentId - The student's ID
   * @returns Promise with filtered applications
   */
  getApplicationsByStudentId(studentId: string): Promise<Application[]>;

  /**
   * Get application by ID
   * @param id - The application ID
   * @returns Promise with the application or null
   */
  getApplicationById(id: string): Promise<Application | null>;

  /**
   * Get applications count
   * @returns Promise with count
   */
  getApplicationsCount(): Promise<number>;

  /**
   * Get approved applications count
   * @returns Promise with count of approved applications
   */
  getApprovedApplicationsCount(): Promise<number>;
}
