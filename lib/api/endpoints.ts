/**
 * API Endpoint Constants
 * 
 * Centralized list of all API endpoints
 */

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    SESSION: '/auth/session',
  },

  // Users
  USERS: {
    LIST: '/users',
    BY_ID: (id: string) => `/users/${id}`,
  },

  // Students
  STUDENTS: {
    LIST: '/students',
    BY_ID: (id: string) => `/students/${id}`,
    UNMATCHED: '/students/unmatched',
  },

  // Supervisors
  SUPERVISORS: {
    LIST: '/supervisors',
    BY_ID: (id: string) => `/supervisors/${id}`,
    AVAILABLE: '/supervisors/available',
    APPLICATIONS: (id: string) => `/supervisors/${id}/applications`,
    PROJECTS: (id: string) => `/supervisors/${id}/projects`,
  },

  // Applications
  APPLICATIONS: {
    LIST: '/applications',
    BY_ID: (id: string) => `/applications/${id}`,
    STATUS: (id: string) => `/applications/${id}/status`,
  },

  // Projects
  PROJECTS: {
    LIST: '/projects',
    BY_ID: (id: string) => `/projects/${id}`,
  },

  // Admin
  ADMIN: {
    STATS: '/admin/stats',
    REPORTS: '/admin/reports',
  },
} as const;

