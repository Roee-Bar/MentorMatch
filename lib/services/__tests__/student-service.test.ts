import { StudentService } from '../firebase-services';
import { getDoc, getDocs, updateDoc, setupFirestoreMocks, createMockDoc } from './test-helpers';
import type { Student } from '@/types/database';

describe('[Unit][Firebase] StudentService', () => {
  const mockStudent: Student = {
    firstName: 'John',
    lastName: 'Doe',
    fullName: 'John Doe',
    email: 'john.doe@braude.ac.il',
    studentId: 'STU-001',
    phone: '050-1234567',
    department: 'Computer Science',
    academicYear: '4th Year',
    skills: 'JavaScript, React',
    interests: 'Web Development',
    hasPartner: false,
    profileComplete: true,
    matchStatus: 'unmatched',
    registrationDate: new Date('2024-01-01'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(() => {
    setupFirestoreMocks();
  });

  describe('getStudentById', () => {
    it('returns student data when student exists', async () => {
      const mockDoc = createMockDoc(true, mockStudent);

      (getDoc as jest.Mock).mockResolvedValue(mockDoc);

      const result = await StudentService.getStudentById('STU-001');

      expect(result).toEqual(mockStudent);
    });

    it('returns null when student does not exist', async () => {
      const mockDoc = createMockDoc(false);

      (getDoc as jest.Mock).mockResolvedValue(mockDoc);

      const result = await StudentService.getStudentById('nonexistent');

      expect(result).toBeNull();
    });

    it('returns null on error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (getDoc as jest.Mock).mockRejectedValue(new Error('Firestore error'));

      const result = await StudentService.getStudentById('STU-001');

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('getAllStudents', () => {
    it('returns all students', async () => {
      const mockStudents = [mockStudent];
      const mockQuerySnapshot = {
        docs: mockStudents.map(student => ({
          data: () => student,
        })),
      };

      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

      const result = await StudentService.getAllStudents();

      expect(result).toEqual(mockStudents);
    });

    it('returns empty array on error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (getDocs as jest.Mock).mockRejectedValue(new Error('Firestore error'));

      const result = await StudentService.getAllStudents();

      expect(result).toEqual([]);
      consoleErrorSpy.mockRestore();
    });
  });

  describe('getUnmatchedStudents', () => {
    it('returns only unmatched students', async () => {
      const unmatchedStudent = { ...mockStudent, matchStatus: 'unmatched' as const };
      const mockQuerySnapshot = {
        docs: [{ data: () => unmatchedStudent }],
      };

      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

      const result = await StudentService.getUnmatchedStudents();

      expect(result).toHaveLength(1);
      expect(result[0].matchStatus).toBe('unmatched');
    });

    it('returns empty array when no unmatched students', async () => {
      const mockQuerySnapshot = {
        docs: [],
      };

      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

      const result = await StudentService.getUnmatchedStudents();

      expect(result).toEqual([]);
    });

    it('returns empty array on error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (getDocs as jest.Mock).mockRejectedValue(new Error('Firestore error'));

      const result = await StudentService.getUnmatchedStudents();

      expect(result).toEqual([]);
      consoleErrorSpy.mockRestore();
    });
  });

  describe('updateStudent', () => {
    it('updates student successfully', async () => {
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      const result = await StudentService.updateStudent('STU-001', {
        skills: 'TypeScript, React, Node.js',
      });

      expect(result).toBe(true);
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          skills: 'TypeScript, React, Node.js',
          updatedAt: expect.any(Date),
        })
      );
    });

    it('returns false on error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (updateDoc as jest.Mock).mockRejectedValue(new Error('Update failed'));

      const result = await StudentService.updateStudent('STU-001', {
        skills: 'Updated skills',
      });

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });
});

