// lib/services/supervisors/supervisor-service.ts
// SERVER-ONLY: This file must ONLY be imported in API routes (server-side)
// Supervisor management services

import { adminDb } from '@/lib/firebase-admin';
import type { Supervisor, SupervisorCardData } from '@/types/database';

// ============================================
// SUPERVISOR SERVICES
// ============================================
export const SupervisorService = {
  // Get supervisor by ID
  async getSupervisorById(supervisorId: string): Promise<Supervisor | null> {
    try {
      const supervisorDoc = await adminDb.collection('supervisors').doc(supervisorId).get();
      if (supervisorDoc.exists) {
        return { id: supervisorDoc.id, ...supervisorDoc.data() } as unknown as Supervisor;
      }
      return null;
    } catch (error) {
      console.error('Error fetching supervisor:', error);
      return null;
    }
  },

  // Get all supervisors
  async getAllSupervisors(): Promise<Supervisor[]> {
    try {
      const querySnapshot = await adminDb.collection('supervisors').get();
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as unknown as Supervisor));
    } catch (error) {
      console.error('Error fetching supervisors:', error);
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
          const data = doc.data() as Supervisor;
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
      console.error('Error fetching available supervisors:', error);
      return [];
    }
  },

  // Update supervisor
  async updateSupervisor(supervisorId: string, data: Partial<Supervisor>): Promise<boolean> {
    try {
      await adminDb.collection('supervisors').doc(supervisorId).update({
        ...data,
        updatedAt: new Date(),
      });
      return true;
    } catch (error) {
      console.error('Error updating supervisor:', error);
      return false;
    }
  },

  // Get supervisors by department
  async getSupervisorsByDepartment(department: string): Promise<Supervisor[]> {
    try {
      const querySnapshot = await adminDb.collection('supervisors')
        .where('department', '==', department)
        .where('isActive', '==', true)
        .get();
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as unknown as Supervisor));
    } catch (error) {
      console.error('Error fetching supervisors by department:', error);
      return [];
    }
  },
};

