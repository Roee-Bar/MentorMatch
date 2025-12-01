// lib/routes.ts
// Centralized route definitions to eliminate hardcoded strings

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  AUTHENTICATED: {
    STUDENT: '/authenticated/student',
    SUPERVISOR: '/authenticated/supervisor',
    SUPERVISOR_APPLICATIONS: '/authenticated/supervisor/applications',
    SUPERVISOR_PROFILE: '/authenticated/supervisor/profile',
    ADMIN: '/authenticated/admin',
  },
} as const;

// Type for route values
export type AppRoute = typeof ROUTES[keyof typeof ROUTES] | 
  typeof ROUTES.AUTHENTICATED[keyof typeof ROUTES.AUTHENTICATED];

