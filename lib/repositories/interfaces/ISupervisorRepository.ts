import { Supervisor } from '@/types/dashboard';

/**
 * Repository interface for Supervisor data access
 * Implementations: MockSupervisorRepository (current), FirebaseSupervisorRepository (future)
 */
export interface ISupervisorRepository {
  /**
   * Get all supervisors
   * @returns Promise with all supervisors
   */
  getAllSupervisors(): Promise<Supervisor[]>;

  /**
   * Get available supervisors
   * @returns Promise with available supervisors
   */
  getAvailableSupervisors(): Promise<Supervisor[]>;

  /**
   * Get supervisor by ID
   * @param id - The supervisor ID
   * @returns Promise with the supervisor or null
   */
  getSupervisorById(id: string): Promise<Supervisor | null>;

  /**
   * Get supervisors by department
   * @param department - The department name
   * @returns Promise with filtered supervisors
   */
  getSupervisorsByDepartment(department: string): Promise<Supervisor[]>;

  /**
   * Get count of available supervisors
   * @returns Promise with count
   */
  getAvailableSupervisorsCount(): Promise<number>;
}
