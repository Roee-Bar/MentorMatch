import { User } from '@/types/user';

/**
 * Repository interface for User data access
 * Implementations: MockUserRepository (current), FirebaseUserRepository (future)
 */
export interface IUserRepository {
  /**
   * Get user by ID
   * @param id - The user ID
   * @returns Promise with the user or null
   */
  getUserById(id: string): Promise<User | null>;

  /**
   * Get user by email
   * @param email - The user email
   * @returns Promise with the user or null
   */
  getUserByEmail(email: string): Promise<User | null>;

  /**
   * Get current authenticated user
   * @returns Promise with the current user or null
   */
  getCurrentUser(): Promise<User | null>;
}
