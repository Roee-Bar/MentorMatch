import {
  IApplicationRepository,
  IUserRepository,
  ISupervisorRepository,
} from './interfaces';
import {
  MockApplicationRepository,
  MockUserRepository,
  MockSupervisorRepository,
} from './mock';

// Check if Firebase should be used based on environment variable
const USE_FIREBASE = process.env.NEXT_PUBLIC_USE_FIREBASE === 'true';

/**
 * Factory for creating repository instances
 * Switches between Mock and Firebase implementations based on environment configuration
 * 
 * @example
 * ```typescript
 * const appRepo = RepositoryFactory.getApplicationRepository();
 * const applications = await appRepo.getAllApplications();
 * ```
 */
export class RepositoryFactory {
  /**
   * Get Application repository instance
   * @returns IApplicationRepository implementation
   */
  static getApplicationRepository(): IApplicationRepository {
    if (USE_FIREBASE) {
      // TODO: Replace with FirebaseApplicationRepository when implemented
      // return new FirebaseApplicationRepository();
      throw new Error('Firebase implementation not yet available');
    }
    return new MockApplicationRepository();
  }

  /**
   * Get User repository instance
   * @returns IUserRepository implementation
   */
  static getUserRepository(): IUserRepository {
    if (USE_FIREBASE) {
      // TODO: Replace with FirebaseUserRepository when implemented
      // return new FirebaseUserRepository();
      throw new Error('Firebase implementation not yet available');
    }
    return new MockUserRepository();
  }

  /**
   * Get Supervisor repository instance
   * @returns ISupervisorRepository implementation
   */
  static getSupervisorRepository(): ISupervisorRepository {
    if (USE_FIREBASE) {
      // TODO: Replace with FirebaseSupervisorRepository when implemented
      // return new FirebaseSupervisorRepository();
      throw new Error('Firebase implementation not yet available');
    }
    return new MockSupervisorRepository();
  }
}
