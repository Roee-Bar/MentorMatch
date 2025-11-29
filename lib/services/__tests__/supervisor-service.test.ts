import { SupervisorService } from '../firebase-services';
import { getDoc, getDocs, updateDoc, setupFirestoreMocks, createMockDoc } from './test-helpers';
import type { Supervisor } from '@/types/database';

describe('[Unit][Firebase] SupervisorService', () => {
  const mockSupervisor: Supervisor = {
    firstName: 'Dr.',
    lastName: 'Smith',
    fullName: 'Dr. Smith',
    email: 'smith@braude.ac.il',
    department: 'Computer Science',
    title: 'Dr.',
    bio: 'Expert in AI',
    researchInterests: ['AI', 'Machine Learning'],
    expertiseAreas: ['Deep Learning'],
    maxCapacity: 5,
    currentCapacity: 2,
    availabilityStatus: 'available',
    notificationPreference: 'immediate',
    isApproved: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    setupFirestoreMocks();
  });

  describe('getSupervisorById', () => {
    it('returns supervisor data when supervisor exists', async () => {
      const mockDoc = createMockDoc(true, mockSupervisor);

      (getDoc as jest.Mock).mockResolvedValue(mockDoc);

      const result = await SupervisorService.getSupervisorById('SUP-001');

      expect(result).toEqual(mockSupervisor);
    });

    it('returns null when supervisor does not exist', async () => {
      const mockDoc = createMockDoc(false);

      (getDoc as jest.Mock).mockResolvedValue(mockDoc);

      const result = await SupervisorService.getSupervisorById('nonexistent');

      expect(result).toBeNull();
    });

    it('returns null on error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (getDoc as jest.Mock).mockRejectedValue(new Error('Firestore error'));

      const result = await SupervisorService.getSupervisorById('SUP-001');

      expect(result).toBeNull();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('getAllSupervisors', () => {
    it('returns all supervisors', async () => {
      const mockSupervisors = [mockSupervisor];
      const mockQuerySnapshot = {
        docs: mockSupervisors.map(sup => ({
          data: () => sup,
        })),
      };

      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

      const result = await SupervisorService.getAllSupervisors();

      expect(result).toEqual(mockSupervisors);
    });

    it('returns empty array on error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (getDocs as jest.Mock).mockRejectedValue(new Error('Firestore error'));

      const result = await SupervisorService.getAllSupervisors();

      expect(result).toEqual([]);
      consoleErrorSpy.mockRestore();
    });
  });

  describe('getAvailableSupervisors', () => {
    it('returns and transforms available supervisors', async () => {
      const mockQuerySnapshot = {
        docs: [
          {
            id: 'SUP-001',
            data: () => mockSupervisor,
          },
        ],
      };

      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

      const result = await SupervisorService.getAvailableSupervisors();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'SUP-001',
        name: mockSupervisor.fullName,
        department: mockSupervisor.department,
        bio: mockSupervisor.bio,
        expertiseAreas: mockSupervisor.expertiseAreas,
        researchInterests: mockSupervisor.researchInterests,
        availabilityStatus: mockSupervisor.availabilityStatus,
        currentCapacity: `${mockSupervisor.currentCapacity}/${mockSupervisor.maxCapacity} projects`,
        contact: mockSupervisor.email,
      });
    });

    it('filters out unavailable supervisors', async () => {
      const unavailableSupervisor = {
        ...mockSupervisor,
        availabilityStatus: 'unavailable' as const,
      };
      const mockQuerySnapshot = {
        docs: [
          {
            id: 'SUP-001',
            data: () => unavailableSupervisor,
          },
        ],
      };

      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

      const result = await SupervisorService.getAvailableSupervisors();

      expect(result).toHaveLength(0);
    });

    it('returns empty array on error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (getDocs as jest.Mock).mockRejectedValue(new Error('Firestore error'));

      const result = await SupervisorService.getAvailableSupervisors();

      expect(result).toEqual([]);
      consoleErrorSpy.mockRestore();
    });
  });

  describe('updateSupervisor', () => {
    it('updates supervisor successfully', async () => {
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      const result = await SupervisorService.updateSupervisor('SUP-001', {
        currentCapacity: 3,
      });

      expect(result).toBe(true);
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          currentCapacity: 3,
          updatedAt: expect.any(Date),
        })
      );
    });

    it('returns false on error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (updateDoc as jest.Mock).mockRejectedValue(new Error('Update failed'));

      const result = await SupervisorService.updateSupervisor('SUP-001', {
        currentCapacity: 3,
      });

      expect(result).toBe(false);
      consoleErrorSpy.mockRestore();
    });
  });

  describe('getSupervisorsByDepartment', () => {
    it('returns supervisors filtered by department', async () => {
      const mockQuerySnapshot = {
        docs: [{ data: () => mockSupervisor }],
      };

      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

      const result = await SupervisorService.getSupervisorsByDepartment('Computer Science');

      expect(result).toHaveLength(1);
      expect(result[0].department).toBe('Computer Science');
    });

    it('returns empty array when no supervisors in department', async () => {
      const mockQuerySnapshot = {
        docs: [],
      };

      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

      const result = await SupervisorService.getSupervisorsByDepartment('Mechanical Engineering');

      expect(result).toEqual([]);
    });

    it('returns empty array on error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (getDocs as jest.Mock).mockRejectedValue(new Error('Firestore error'));

      const result = await SupervisorService.getSupervisorsByDepartment('Computer Science');

      expect(result).toEqual([]);
      consoleErrorSpy.mockRestore();
    });
  });
});

