import { Supervisor } from '@/types/dashboard';
import { supervisors } from '@/mock-data/data/supervisors';
import { ISupervisorRepository } from '../interfaces/ISupervisorRepository';

/**
 * Mock implementation of ISupervisorRepository
 * Uses static mock data from @/mock-data/data/supervisors
 */
export class MockSupervisorRepository implements ISupervisorRepository {
  /**
   * Get all supervisors
   * @returns Promise with all supervisors
   */
  async getAllSupervisors(): Promise<Supervisor[]> {
    return Promise.resolve([...supervisors]);
  }

  /**
   * Get available supervisors
   * @returns Promise with available supervisors
   */
  async getAvailableSupervisors(): Promise<Supervisor[]> {
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
  async getSupervisorById(id: string): Promise<Supervisor | null> {
    const supervisor = supervisors.find(sup => sup.id === id);
    return Promise.resolve(supervisor || null);
  }

  /**
   * Get supervisors by department
   * @param department - The department name
   * @returns Promise with filtered supervisors
   */
  async getSupervisorsByDepartment(department: string): Promise<Supervisor[]> {
    const filtered = supervisors.filter(
      sup => sup.department === department
    );
    return Promise.resolve(filtered);
  }

  /**
   * Get count of available supervisors
   * @returns Promise with count
   */
  async getAvailableSupervisorsCount(): Promise<number> {
    const available = supervisors.filter(
      sup => sup.availabilityStatus === 'available'
    );
    return Promise.resolve(available.length);
  }
}
