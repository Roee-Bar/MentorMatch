// lib/routes.ts
// Centralized route definitions to eliminate hardcoded strings

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  AUTHENTICATED: {
    STUDENT: '/authenticated/student',
    STUDENT_SUPERVISORS: '/authenticated/student/supervisors',
    STUDENT_STUDENTS: '/authenticated/student/students',
    STUDENT_PROFILE: '/authenticated/student/profile',
    STUDENT_PROFILE_EDIT: '/authenticated/student/profile/edit',
    SUPERVISOR: '/authenticated/supervisor',
    SUPERVISOR_APPLICATIONS: '/authenticated/supervisor/applications',
    SUPERVISOR_PROFILE: '/authenticated/supervisor/profile',
    SUPERVISOR_PROFILE_EDIT: '/authenticated/supervisor/profile/edit',
    ADMIN: '/authenticated/admin',
  },
} as const;

// Type for route values
export type AppRoute = typeof ROUTES[keyof typeof ROUTES] | 
  typeof ROUTES.AUTHENTICATED[keyof typeof ROUTES.AUTHENTICATED];

