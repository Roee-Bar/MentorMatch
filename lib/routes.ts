// lib/routes.ts
// Centralized route definitions to eliminate hardcoded strings

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: {
    ROOT: '/dashboard',
    STUDENT: '/dashboard/student',
    SUPERVISOR: '/dashboard/supervisor',
    SUPERVISOR_APPLICATIONS: '/dashboard/supervisor/applications',
    SUPERVISOR_PROFILE: '/dashboard/supervisor/profile',
    ADMIN: '/dashboard/admin',
  },
} as const;

// Type for route values
export type AppRoute = typeof ROUTES[keyof typeof ROUTES] | 
  typeof ROUTES.DASHBOARD[keyof typeof ROUTES.DASHBOARD];

