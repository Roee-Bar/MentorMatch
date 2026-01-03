// lib/services/supervisors/supervisor-service.ts
// SERVER-ONLY: This file must ONLY be imported in API routes (server-side)
// Supervisor management services

import { adminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { BaseService } from '@/lib/services/shared/base-service';
import { toSupervisor } from '@/lib/services/shared/firestore-converters';
import { ServiceResults } from '@/lib/services/shared/types';
import type { ServiceResult } from '@/lib/services/shared/types';
import type { Supervisor, SupervisorCardData, SupervisorFilterParams } from '@/types/database';

// ============================================
// SUPERVISOR SERVICE CLASS
// ============================================
class SupervisorServiceClass extends BaseService<Supervisor> {
  protected collectionName = 'supervisors';
  protected serviceName = 'SupervisorService';
  
  protected toEntity(id: string, data: any): Supervisor {
    return toSupervisor(id, data);
  }

  async getSupervisorById(supervisorId: string): Promise<Supervisor | null> {
    return this.getById(supervisorId);
  }

  async getAllSupervisors(): Promise<Supervisor[]> {
    return this.getAll();
  }

  async getSupervisorsByDepartment(department: string): Promise<Supervisor[]> {
    return this.query([
      { field: 'department', operator: '==', value: department },
      { field: 'isActive', operator: '==', value: true }
    ]);
  }

  async createSupervisor(supervisorData: Omit<Supervisor, 'id'>): Promise<ServiceResult<string>> {
    return this.create(supervisorData);
  }

  async updateSupervisor(supervisorId: string, data: Partial<Supervisor>): Promise<ServiceResult> {
    return this.update(supervisorId, data);
  }

  async deleteSupervisor(supervisorId: string): Promise<ServiceResult> {
    return this.delete(supervisorId);
  }

  async getAvailableSupervisors(): Promise<SupervisorCardData[]> {
    try {
      const querySnapshot = await this.getCollection()
        .where('isActive', '==', true)
        .where('isApproved', '==', true)
        .get();
      
      return querySnapshot.docs
        .map((doc) => {
          const data = this.toEntity(doc.id, doc.data());
          return {
            id: doc.id,
            name: data.fullName,
            department: data.department,
            bio: data.bio,
            expertiseAreas: data.expertiseAreas,
            researchInterests: data.researchInterests,
            availabilityStatus: data.availabilityStatus,
            currentCapacity: `${data.currentCapacity}/${data.maxCapacity} projects`,
            contact: data.email,
          } as SupervisorCardData;
        })
        .filter((s) => s.availabilityStatus !== 'unavailable');
    } catch (error) {
      logger.service.error(this.serviceName, 'getAvailableSupervisors', error);
      return [];
    }
  }

  async getFilteredSupervisors(filters: SupervisorFilterParams): Promise<ServiceResult<SupervisorCardData[]>> {
    try {
      // Get base data
      let supervisors = await this.getAvailableSupervisors();

      // Normalize filter values
      const search = filters.search?.toLowerCase().trim();
      const department = filters.department;
      const availability = filters.availability;
      const expertise = filters.expertise?.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
      const interests = filters.interests?.split(',').map(i => i.trim().toLowerCase()).filter(Boolean);

      // Filter by search term (name, bio, expertise, research interests)
      if (search) {
        supervisors = supervisors.filter(supervisor => {
          const nameMatch = supervisor.name.toLowerCase().includes(search);
          const bioMatch = supervisor.bio?.toLowerCase().includes(search) ?? false;
          const expertiseMatch = supervisor.expertiseAreas.some(area => 
            area.toLowerCase().includes(search)
          );
          const interestsMatch = supervisor.researchInterests.some(interest => 
            interest.toLowerCase().includes(search)
          );
          return nameMatch || bioMatch || expertiseMatch || interestsMatch;
        });
      }

      // Filter by department
      if (department && department !== 'all') {
        supervisors = supervisors.filter(supervisor => 
          supervisor.department.toLowerCase() === department.toLowerCase()
        );
      }

      // Filter by availability status
      if (availability && availability !== 'all') {
        supervisors = supervisors.filter(supervisor => 
          supervisor.availabilityStatus === availability
        );
      }

      // Filter by expertise areas (any match)
      if (expertise && expertise.length > 0) {
        supervisors = supervisors.filter(supervisor => 
          supervisor.expertiseAreas.some(area => 
            expertise.some(exp => area.toLowerCase().includes(exp))
          )
        );
      }

      // Filter by research interests (any match)
      if (interests && interests.length > 0) {
        supervisors = supervisors.filter(supervisor => 
          supervisor.researchInterests.some(interest => 
            interests.some(int => interest.toLowerCase().includes(int))
          )
        );
      }

      return ServiceResults.success(supervisors);
    } catch (error) {
      logger.service.error(this.serviceName, 'getFilteredSupervisors', error, { filters });
      return ServiceResults.error(
        error instanceof Error ? error.message : 'Failed to fetch supervisors'
      );
    }
  }
}

// Create singleton instance and export
export const supervisorService = new SupervisorServiceClass();
