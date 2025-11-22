import { User } from '@/types/user';
import { users } from '@/mock-data/data/users';
import { IUserRepository } from '../interfaces/IUserRepository';

/**
 * Mock implementation of IUserRepository
 * Uses static mock data from @/mock-data/data/users
 */
export class MockUserRepository implements IUserRepository {
  /**
   * Get user by ID
   * @param id - The user ID
   * @returns Promise with the user or null
   */
  async getUserById(id: string): Promise<User | null> {
    const user = users.find(u => u.id === id);
    return Promise.resolve(user || null);
  }

  /**
   * Get user by email
   * @param email - The user email
   * @returns Promise with the user or null
   */
  async getUserByEmail(email: string): Promise<User | null> {
    const user = users.find(u => u.email === email);
    return Promise.resolve(user || null);
  }

  /**
   * Get current authenticated user
   * @returns Promise with the current user (mock returns first student)
   */
  async getCurrentUser(): Promise<User | null> {
    // TODO: Replace with actual auth check when Firebase auth is implemented
    return Promise.resolve(users[0] || null);
  }
}
