import { UserService } from '../firebase-services';
import { getDoc, getDocs, setupFirestoreMocks, createMockDoc, createMockQuerySnapshot } from './test-helpers';
import { users } from '@/mock-data';

describe('[Unit][Firebase] UserService', () => {
  beforeEach(() => {
    setupFirestoreMocks();
  });

  describe('getUserById', () => {
    it('returns user data when user exists', async () => {
      const mockUser = users[0];
      const mockDoc = createMockDoc(true, mockUser);

      (getDoc as jest.Mock).mockResolvedValue(mockDoc);

      const result = await UserService.getUserById('1');

      expect(result).toEqual(mockUser);
      expect(getDoc).toHaveBeenCalledTimes(1);
    });

    it('returns null when user does not exist', async () => {
      const mockDoc = createMockDoc(false);

      (getDoc as jest.Mock).mockResolvedValue(mockDoc);

      const result = await UserService.getUserById('nonexistent');

      expect(result).toBeNull();
    });

    it('returns null on error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (getDoc as jest.Mock).mockRejectedValue(new Error('Firestore error'));

      const result = await UserService.getUserById('1');

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching user:', expect.any(Error));
      consoleErrorSpy.mockRestore();
    });
  });

  describe('getAllUsers', () => {
    it('returns all users', async () => {
      const mockQuerySnapshot = {
        docs: users.map(user => ({
          id: user.id,
          data: () => user,
        })),
      };

      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

      const result = await UserService.getAllUsers();

      expect(result).toEqual(users);
      expect(getDocs).toHaveBeenCalledTimes(1);
    });

    it('returns empty array when no users exist', async () => {
      const mockQuerySnapshot = {
        docs: [],
      };

      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);

      const result = await UserService.getAllUsers();

      expect(result).toEqual([]);
    });

    it('returns empty array on error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (getDocs as jest.Mock).mockRejectedValue(new Error('Firestore error'));

      const result = await UserService.getAllUsers();

      expect(result).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching users:', expect.any(Error));
      consoleErrorSpy.mockRestore();
    });
  });
});

