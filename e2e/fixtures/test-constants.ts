/**
 * Common timeout values for E2E tests
 * Centralized to ensure consistency and easy maintenance
 */

export const TIMEOUTS = {
  /** Short timeout for elements that should be immediately visible */
  SHORT: 5000,
  
  /** Standard timeout for most UI elements and interactions */
  STANDARD: 10000,
  
  /** Medium timeout for page navigation and form submissions */
  MEDIUM: 15000,
  
  /** Long timeout for dashboard loads and complex pages */
  LONG: 20000,
  
  /** Extra long timeout for slow operations like navigation, seed data, etc */
  EXTRA_LONG: 45000,
  
  /** Maximum timeout for very slow operations */
  MAX: 90000,
};

/**
 * Common routes used in E2E tests
 */
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  ADMIN_SEED: '/admin/seed',
  SUPERVISOR_PROFILE: '/dashboard/supervisor/profile',
  SUPERVISOR_APPLICATIONS: '/dashboard/supervisor/applications',
};

/**
 * Common wait until strategies for page navigation
 */
export const WAIT_STRATEGIES = {
  NETWORK_IDLE: 'networkidle' as const,
  LOAD: 'load' as const,
  DOM_CONTENT_LOADED: 'domcontentloaded' as const,
};

/**
 * Common delay values for waiting between actions
 */
export const DELAYS = {
  /** Short delay for UI animations */
  SHORT: 100,
  
  /** Medium delay for client-side routing */
  MEDIUM: 500,
  
  /** Long delay for complex operations */
  LONG: 1000,
};

