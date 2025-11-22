import { User } from '@/types/user';
import { users } from '../data/users';

/**
 * Service for managing user data
 * TODO: Replace with real database calls (Firebase/API)
 */
export class UserService {
  /**
   * Get user by ID
   * @param id - The user ID
   * @returns Promise with the user or null
   */
  static async getUserById(id: string): Promise<User | null> {
    const user = users.find(u => u.id === id);
    return Promise.resolve(user || null);
  }

  /**
   * Get user by email
   * @param email - The user email
   * @returns Promise with the user or null
   */
  static async getUserByEmail(email: string): Promise<User | null> {
    const user = users.find(u => u.email === email);
    return Promise.resolve(user || null);
  }

  /**
   * Get current authenticated user
   * @returns Promise with the current user (mock returns first student)
   */
  static async getCurrentUser(): Promise<User | null> {
    // TODO: Replace with actual auth check
    return Promise.resolve(users[0] || null);
  }
}

