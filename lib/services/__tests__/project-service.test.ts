import { ProjectService } from '../firebase-services';
import { getDoc, getDocs, addDoc, setupFirestoreMocks, createMockDoc } from './test-helpers';
import type { Project } from '@/types/database';

describe('[Unit][Firebase] ProjectService', () => {
  const mockProject: Project = {
    id: 'PRJ-001',
    projectCode: '2024-1-C-01',
    studentIds: ['STU-001'],
    studentNames: ['John Doe'],
    supervisorId: 'SUP-001',
    supervisorName: 'Dr. Smith',
    title: 'AI Project',
    description: 'Building an AI system',
    status: 'in_progress',
    phase: 'A',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    setupFirestoreMocks();
  });

  describe('getProjectById', () => {
    it('returns project when it exists', async () => {
      const mockDoc = {
        exists: () => true,
        id: 'PRJ-001',
        data: () => ({ ...mockProject, id: undefined }),
      };

      (getDoc as jest.Mock).mockResolvedValue(mockDoc);

      const result = await ProjectService.getProjectById('PRJ-001');

      expect(result).toBeTruthy();
      expect(result?.id).toBe('PRJ-001');
    });

    it('returns null when project does not exist', async () => {
      const mockDoc = {
        exists: () => false,
      };

      (getDoc as jest.Mock).mockResolvedValue(mockDoc);

      const result = await ProjectService.getProjectById('nonexistent');

      expect(result).toBeNull();
    });

    it('returns null on error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (getDoc as jest.Mock).mockRejectedValue(new Error('Firestore error'));

      const result = await ProjectService.getProjectById('PRJ-001');

      expect(result).toBeNull();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('getAllProjects', () => {
    it('returns all projects', async () => {
      const mockQuerySnapshot = {
        docs: [
          {
            id: 'PRJ-001',
            data: () => mockProject,
          },
        ],
      };

      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

      const result = await ProjectService.getAllProjects();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('PRJ-001');
    });

    it('returns empty array on error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (getDocs as jest.Mock).mockRejectedValue(new Error('Firestore error'));

      const result = await ProjectService.getAllProjects();

      expect(result).toEqual([]);
      consoleErrorSpy.mockRestore();
    });
  });

  describe('getSupervisorProjects', () => {
    it('returns projects for supervisor', async () => {
      const mockQuerySnapshot = {
        docs: [
          {
            id: 'PRJ-001',
            data: () => mockProject,
          },
        ],
      };

      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

      const result = await ProjectService.getSupervisorProjects('SUP-001');

      expect(result).toHaveLength(1);
      expect(result[0].supervisorId).toBe('SUP-001');
    });

    it('returns empty array on error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (getDocs as jest.Mock).mockRejectedValue(new Error('Firestore error'));

      const result = await ProjectService.getSupervisorProjects('SUP-001');

      expect(result).toEqual([]);
      consoleErrorSpy.mockRestore();
    });
  });

  describe('createProject', () => {
    it('creates project successfully', async () => {
      const mockDocRef = { id: 'PRJ-NEW' };
      (addDoc as jest.Mock).mockResolvedValue(mockDocRef);

      const projectData = {
        ...mockProject,
        id: undefined as any,
      };
      const result = await ProjectService.createProject(projectData);

      expect(result).toBe('PRJ-NEW');
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        })
      );
    });

    it('returns null on error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (addDoc as jest.Mock).mockRejectedValue(new Error('Create failed'));

      const projectData = {
        ...mockProject,
        id: undefined as any,
      };
      const result = await ProjectService.createProject(projectData);

      expect(result).toBeNull();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('generateProjectCode', () => {
    it('generates correct project code format', () => {
      const code = ProjectService.generateProjectCode(2024, 1, 'Computer Science', 5);

      expect(code).toBe('2024-1-C-05');
    });

    it('pads single digit numbers', () => {
      const code = ProjectService.generateProjectCode(2024, 2, 'Software Engineering', 3);

      expect(code).toBe('2024-2-S-03');
    });

    it('uses first letter of department', () => {
      const code = ProjectService.generateProjectCode(2024, 1, 'Mechanical Engineering', 10);

      expect(code).toBe('2024-1-M-10');
    });
  });
});

