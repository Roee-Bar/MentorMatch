// Re-export all services
export * from './services/applicationService';
export * from './services/supervisorService';
export * from './services/userService';

// Re-export raw data (for testing purposes)
export { applications } from './data/applications';
export { supervisors } from './data/supervisors';
export { users } from './data/users';

