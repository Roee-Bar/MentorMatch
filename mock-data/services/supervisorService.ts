import { Supervisor } from '@/types/dashboard';
import { supervisors } from '../data/supervisors';

/**
 * Service for managing supervisor data
 * TODO: Replace with real database calls (Firebase/API)
 */
export class SupervisorService {
  /**
   * Get all supervisors
   * @returns Promise with all supervisors
   */
  static async getAllSupervisors(): Promise<Supervisor[]> {
    return Promise.resolve([...supervisors]);
  }

  /**
   * Get available supervisors
   * @returns Promise with available supervisors
   */
  static async getAvailableSupervisors(): Promise<Supervisor[]> {
    const available = supervisors.filter(
      sup => sup.availabilityStatus === 'available'
    );
    return Promise.resolve(available);
  }

  /**
   * Get supervisor by ID
   * @param id - The supervisor ID
   * @returns Promise with the supervisor or null
   */
  static async getSupervisorById(id: string): Promise<Supervisor | null> {
    const supervisor = supervisors.find(sup => sup.id === id);
    return Promise.resolve(supervisor || null);
  }

  /**
   * Get supervisors by department
   * @param department - The department name
   * @returns Promise with filtered supervisors
   */
  static async getSupervisorsByDepartment(department: string): Promise<Supervisor[]> {
    const filtered = supervisors.filter(
      sup => sup.department === department
    );
    return Promise.resolve(filtered);
  }

  /**
   * Get count of available supervisors
   * @returns Promise with count
   */
  static async getAvailableSupervisorsCount(): Promise<number> {
    const available = supervisors.filter(
      sup => sup.availabilityStatus === 'available'
    );
    return Promise.resolve(available.length);
  }
}

