import { ApplicationService } from '../firebase-services';
import { getDoc, getDocs, addDoc, updateDoc, setupFirestoreMocks, createMockDoc, createMockTimestamp } from './test-helpers';
import type { Application } from '@/types/database';

describe('[Unit][Firebase] ApplicationService', () => {
  const mockApplication: Application = {
    id: 'APP-001',
    studentId: 'STU-001',
    studentName: 'John Doe',
    studentEmail: 'john@braude.ac.il',
    supervisorId: 'SUP-001',
    supervisorName: 'Dr. Smith',
    projectTitle: 'AI Project',
    projectDescription: 'Building an AI system',
    isOwnTopic: true,
    studentSkills: 'JavaScript, Python',
    studentInterests: 'AI, ML',
    hasPartner: false,
    status: 'pending',
    dateApplied: new Date('2024-01-01'),
    lastUpdated: new Date('2024-01-01'),
  };

  beforeEach(() => {
    setupFirestoreMocks();
  });

  describe('getApplicationById', () => {
    it('returns application when it exists', async () => {
      const mockData = { ...mockApplication };
      delete (mockData as any).id;
      
      const mockDoc = {
        exists: () => true,
        id: 'APP-001',
        data: () => mockData,
      };

      (getDoc as jest.Mock).mockResolvedValue(mockDoc);

      const result = await ApplicationService.getApplicationById('APP-001');

      expect(result).toBeTruthy();
      expect(result?.id).toBe('APP-001');
    });

    it('converts Firestore Timestamps to Date objects', async () => {
      const mockTimestamp = createMockTimestamp(new Date('2024-01-15T10:30:00Z'));
      
      const mockData = {
        ...mockApplication,
        id: undefined,
        dateApplied: mockTimestamp,
        lastUpdated: mockTimestamp,
      };

      const mockDoc = {
        exists: () => true,
        id: 'APP-001',
        data: () => mockData,
      };

      (getDoc as jest.Mock).mockResolvedValue(mockDoc);

      const result = await ApplicationService.getApplicationById('APP-001');

      expect(result).toBeTruthy();
      expect(result!.dateApplied).toBeInstanceOf(Date);
      expect(result!.lastUpdated).toBeInstanceOf(Date);
      expect(mockTimestamp.toDate).toHaveBeenCalled();
    });

    it('returns null when application does not exist', async () => {
      const mockDoc = {
        exists: () => false,
      };

      (getDoc as jest.Mock).mockResolvedValue(mockDoc);

      const result = await ApplicationService.getApplicationById('nonexistent');

      expect(result).toBeNull();
    });

    it('returns null on error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (getDoc as jest.Mock).mockRejectedValue(new Error('Firestore error'));

      const result = await ApplicationService.getApplicationById('APP-001');

      expect(result).toBeNull();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('getStudentApplications', () => {
    it('returns and transforms student applications', async () => {
      const mockData = {
        ...mockApplication,
        dateApplied: {
          toDate: () => new Date('2024-01-01'),
        },
        supervisorName: 'Dr. Smith',
      };

      const mockQuerySnapshot = {
        docs: [
          {
            id: 'APP-001',
            data: () => mockData,
          },
        ],
      };

      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

      const result = await ApplicationService.getStudentApplications('STU-001');

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'APP-001',
        projectTitle: mockApplication.projectTitle,
        supervisorName: 'Dr. Smith',
      });
    });

    it('handles missing toDate method', async () => {
      const mockData = {
        ...mockApplication,
        dateApplied: null,
      };

      const mockQuerySnapshot = {
        docs: [
          {
            id: 'APP-001',
            data: () => mockData,
          },
        ],
      };

      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

      const result = await ApplicationService.getStudentApplications('STU-001');

      expect(result[0].dateApplied).toBe('N/A');
    });

    it('returns empty array on error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (getDocs as jest.Mock).mockRejectedValue(new Error('Firestore error'));

      const result = await ApplicationService.getStudentApplications('STU-001');

      expect(result).toEqual([]);
      consoleErrorSpy.mockRestore();
    });
  });

  describe('getSupervisorApplications', () => {
    it('returns applications for supervisor', async () => {
      const mockQuerySnapshot = {
        docs: [
          {
            id: 'APP-001',
            data: () => mockApplication,
          },
        ],
      };

      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

      const result = await ApplicationService.getSupervisorApplications('SUP-001');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('APP-001');
    });

    it('converts Firestore Timestamps to Date objects', async () => {
      const mockTimestamp = createMockTimestamp(new Date('2024-01-15T10:30:00Z'));
      
      const mockData = {
        ...mockApplication,
        dateApplied: mockTimestamp,
        lastUpdated: mockTimestamp,
        responseDate: mockTimestamp,
      };

      const mockQuerySnapshot = {
        docs: [
          {
            id: 'APP-001',
            data: () => mockData,
          },
        ],
      };

      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

      const result = await ApplicationService.getSupervisorApplications('SUP-001');

      expect(result).toHaveLength(1);
      expect(result[0].dateApplied).toBeInstanceOf(Date);
      expect(result[0].lastUpdated).toBeInstanceOf(Date);
      expect(result[0].responseDate).toBeInstanceOf(Date);
      expect(mockTimestamp.toDate).toHaveBeenCalledTimes(3);
    });

    it('handles dates that are already Date objects', async () => {
      const nativeDate = new Date('2024-01-15T10:30:00Z');
      const mockData = {
        ...mockApplication,
        dateApplied: nativeDate,
        lastUpdated: nativeDate,
      };

      const mockQuerySnapshot = {
        docs: [
          {
            id: 'APP-001',
            data: () => mockData,
          },
        ],
      };

      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

      const result = await ApplicationService.getSupervisorApplications('SUP-001');

      expect(result[0].dateApplied).toBe(nativeDate);
      expect(result[0].lastUpdated).toBe(nativeDate);
    });

    it('returns empty array on error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (getDocs as jest.Mock).mockRejectedValue(new Error('Firestore error'));

      const result = await ApplicationService.getSupervisorApplications('SUP-001');

      expect(result).toEqual([]);
      consoleErrorSpy.mockRestore();
    });
  });

  describe('createApplication', () => {
    it('creates application successfully', async () => {
      const mockDocRef = { id: 'APP-NEW' };
      (addDoc as jest.Mock).mockResolvedValue(mockDocRef);

      const applicationData = {
        ...mockApplication,
        id: undefined as any,
      };
      const result = await ApplicationService.createApplication(applicationData);

      expect(result).toBe('APP-NEW');
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          dateApplied: expect.any(Date),
          lastUpdated: expect.any(Date),
        })
      );
    });

    it('returns null on error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (addDoc as jest.Mock).mockRejectedValue(new Error('Create failed'));

      const applicationData = {
        ...mockApplication,
        id: undefined as any,
      };
      const result = await ApplicationService.createApplication(applicationData);

      expect(result).toBeNull();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('updateApplicationStatus', () => {
    it('updates status successfully', async () => {
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      const result = await ApplicationService.updateApplicationStatus(
        'APP-001',
        'approved',
        'Great project!'
      );

      expect(result).toBe(true);
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          status: 'approved',
          supervisorFeedback: 'Great project!',
          lastUpdated: expect.any(Date),
          responseDate: expect.any(Date),
        })
      );
    });

    it('updates status without feedback', async () => {
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      const result = await ApplicationService.updateApplicationStatus(
        'APP-001',
        'under_review'
      );

      expect(result).toBe(true);
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          status: 'under_review',
          lastUpdated: expect.any(Date),
        })
      );
    });

    it('adds responseDate for approved/rejected status', async () => {
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      await ApplicationService.updateApplicationStatus('APP-001', 'rejected');

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          responseDate: expect.any(Date),
        })
      );
    });

    it('returns false on error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (updateDoc as jest.Mock).mockRejectedValue(new Error('Update failed'));

      const result = await ApplicationService.updateApplicationStatus('APP-001', 'approved');

      expect(result).toBe(false);
      consoleErrorSpy.mockRestore();
    });
  });

  describe('getAllApplications', () => {
    it('returns all applications', async () => {
      const mockQuerySnapshot = {
        docs: [
          {
            id: 'APP-001',
            data: () => mockApplication,
          },
        ],
      };

      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

      const result = await ApplicationService.getAllApplications();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('APP-001');
    });

    it('converts Firestore Timestamps to Date objects for all applications', async () => {
      const mockTimestamp = createMockTimestamp(new Date('2024-01-15T10:30:00Z'));
      
      const mockData = {
        ...mockApplication,
        dateApplied: mockTimestamp,
        lastUpdated: mockTimestamp,
      };

      const mockQuerySnapshot = {
        docs: [
          {
            id: 'APP-001',
            data: () => mockData,
          },
          {
            id: 'APP-002',
            data: () => mockData,
          },
        ],
      };

      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

      const result = await ApplicationService.getAllApplications();

      expect(result).toHaveLength(2);
      result.forEach(app => {
        expect(app.dateApplied).toBeInstanceOf(Date);
        expect(app.lastUpdated).toBeInstanceOf(Date);
      });
    });

    it('returns empty array on error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (getDocs as jest.Mock).mockRejectedValue(new Error('Firestore error'));

      const result = await ApplicationService.getAllApplications();

      expect(result).toEqual([]);
      consoleErrorSpy.mockRestore();
    });
  });
});

