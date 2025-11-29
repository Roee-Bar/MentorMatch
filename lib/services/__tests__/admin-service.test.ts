import { AdminService } from '../firebase-services';
import { getDoc, getDocs, setupFirestoreMocks, createMockDoc } from './test-helpers';
import type { Admin } from '@/types/database';

describe('[Unit][Firebase] AdminService', () => {
  const mockAdmin: Admin = {
    firstName: 'Admin',
    lastName: 'User',
    fullName: 'Admin User',
    email: 'admin@braude.ac.il',
    department: 'Administration',
    adminRole: 'system_admin',
    permissions: ['manage_users', 'view_reports'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    setupFirestoreMocks();
  });

  describe('getAdminById', () => {
    it('returns admin when it exists', async () => {
      const mockDoc = createMockDoc(true, mockAdmin);

      (getDoc as jest.Mock).mockResolvedValue(mockDoc);

      const result = await AdminService.getAdminById('ADM-001');

      expect(result).toEqual(mockAdmin);
    });

    it('returns null when admin does not exist', async () => {
      const mockDoc = createMockDoc(false);

      (getDoc as jest.Mock).mockResolvedValue(mockDoc);

      const result = await AdminService.getAdminById('nonexistent');

      expect(result).toBeNull();
    });

    it('returns null on error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (getDoc as jest.Mock).mockRejectedValue(new Error('Firestore error'));

      const result = await AdminService.getAdminById('ADM-001');

      expect(result).toBeNull();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('getDashboardStats', () => {
    it('calculates dashboard stats correctly', async () => {
      const mockStudentsSnapshot = {
        docs: [
          { data: () => ({ matchStatus: 'matched' }) },
          { data: () => ({ matchStatus: 'unmatched' }) },
          { data: () => ({ matchStatus: 'pending' }) },
        ],
        size: 3,
      };

      const mockSupervisorsSnapshot = {
        docs: [],
        size: 5,
      };

      (getDocs as jest.Mock)
        .mockResolvedValueOnce(mockStudentsSnapshot)
        .mockResolvedValueOnce(mockSupervisorsSnapshot);

      const result = await AdminService.getDashboardStats();

      expect(result).toEqual({
        totalStudents: 3,
        matchedStudents: 1,
        pendingMatches: 2,
        activeSupervisors: 5,
      });
    });

    it('returns zero stats on error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (getDocs as jest.Mock).mockRejectedValue(new Error('Firestore error'));

      const result = await AdminService.getDashboardStats();

      expect(result).toEqual({
        totalStudents: 0,
        matchedStudents: 0,
        pendingMatches: 0,
        activeSupervisors: 0,
      });
      consoleErrorSpy.mockRestore();
    });

    it('handles empty collections', async () => {
      const mockEmptySnapshot = {
        docs: [],
        size: 0,
      };

      (getDocs as jest.Mock)
        .mockResolvedValueOnce(mockEmptySnapshot)
        .mockResolvedValueOnce(mockEmptySnapshot);

      const result = await AdminService.getDashboardStats();

      expect(result).toEqual({
        totalStudents: 0,
        matchedStudents: 0,
        pendingMatches: 0,
        activeSupervisors: 0,
      });
    });
  });
});

