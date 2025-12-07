// lib/services/supervisors/supervisor-service.ts
// SERVER-ONLY: This file must ONLY be imported in API routes (server-side)
// Supervisor management services

import { adminDb } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { toSupervisor } from '@/lib/services/shared/firestore-converters';
import { ServiceResults } from '@/lib/services/shared/types';
import type { ServiceResult } from '@/lib/services/shared/types';
import type { Supervisor, SupervisorCardData } from '@/types/database';

const SERVICE_NAME = 'SupervisorService';

// ============================================
// SUPERVISOR SERVICES
// ============================================
export const SupervisorService = {
  // Get supervisor by ID
  async getSupervisorById(supervisorId: string): Promise<Supervisor | null> {
    try {
      const supervisorDoc = await adminDb.collection('supervisors').doc(supervisorId).get();
      if (supervisorDoc.exists) {
        return toSupervisor(supervisorDoc.id, supervisorDoc.data()!);
      }
      return null;
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'getSupervisorById', error, { supervisorId });
      return null;
    }
  },

  // Get all supervisors
  async getAllSupervisors(): Promise<Supervisor[]> {
    try {
      const querySnapshot = await adminDb.collection('supervisors').get();
      return querySnapshot.docs.map((doc) => toSupervisor(doc.id, doc.data()));
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'getAllSupervisors', error);
      return [];
    }
  },

  // Get available supervisors (with capacity)
  async getAvailableSupervisors(): Promise<SupervisorCardData[]> {
    try {
      const querySnapshot = await adminDb.collection('supervisors')
        .where('isActive', '==', true)
        .where('isApproved', '==', true)
        .get();
      
      return querySnapshot.docs
        .map((doc) => {
          const data = toSupervisor(doc.id, doc.data());
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
      logger.service.error(SERVICE_NAME, 'getAvailableSupervisors', error);
      return [];
    }
  },

  // Update supervisor
  async updateSupervisor(supervisorId: string, data: Partial<Supervisor>): Promise<ServiceResult> {
    try {
      await adminDb.collection('supervisors').doc(supervisorId).update({
        ...data,
        updatedAt: new Date(),
      });
      return ServiceResults.success(undefined, 'Supervisor updated successfully');
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'updateSupervisor', error, { supervisorId });
      return ServiceResults.error(
        error instanceof Error ? error.message : 'Failed to update supervisor'
      );
    }
  },

  // Get supervisors by department
  async getSupervisorsByDepartment(department: string): Promise<Supervisor[]> {
    try {
      const querySnapshot = await adminDb.collection('supervisors')
        .where('department', '==', department)
        .where('isActive', '==', true)
        .get();
      return querySnapshot.docs.map((doc) => toSupervisor(doc.id, doc.data()));
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'getSupervisorsByDepartment', error, { department });
      return [];
    }
  },

  // Create new supervisor
  async createSupervisor(supervisorData: Omit<Supervisor, 'id'>): Promise<ServiceResult<string>> {
    try {
      const docRef = await adminDb.collection('supervisors').add({
        ...supervisorData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return ServiceResults.success(docRef.id, 'Supervisor created successfully');
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'createSupervisor', error);
      return ServiceResults.error(
        error instanceof Error ? error.message : 'Failed to create supervisor'
      );
    }
  },

  // Delete supervisor
  async deleteSupervisor(supervisorId: string): Promise<ServiceResult> {
    try {
      await adminDb.collection('supervisors').doc(supervisorId).delete();
      return ServiceResults.success(undefined, 'Supervisor deleted successfully');
    } catch (error) {
      logger.service.error(SERVICE_NAME, 'deleteSupervisor', error, { supervisorId });
      return ServiceResults.error(
        error instanceof Error ? error.message : 'Failed to delete supervisor'
      );
    }
  },
};
