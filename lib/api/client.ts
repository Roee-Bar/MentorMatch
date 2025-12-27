/**
 * API Client Library
 * 
 * Type-safe client for making API calls to backend routes
 */

import type {
  SupervisorFilterParams,
  RegistrationData,
  Supervisor,
  Application,
  Student,
  BaseUser,
  CreateApplicationData,
  UpdateApplicationData,
  CreateProjectData,
  ApplicationStatus,
} from '@/types/database';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

interface FetchOptions extends RequestInit {
  token?: string;
}

/**
 * Wrapper for making API calls with authentication
 */
export async function apiFetch(
  endpoint: string, 
  options: FetchOptions = {}
) {
  const { token, ...fetchOptions } = options;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add any existing headers
  if (fetchOptions.headers) {
    Object.assign(headers, fetchOptions.headers);
  }

  // Add auth token if provided
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...fetchOptions,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      // Extract error message from various formats
      const errorMessage = 
        data.error || 
        data.message || 
        data.data?.error || 
        data.details ||
        (typeof data === 'string' ? data : 'API request failed');
      throw new Error(errorMessage);
    }

    return data;
  } catch (error: unknown) {
    // Handle network errors gracefully
    const err = error as Error;
    if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
      throw new Error('Network error. Please check your connection and try again.');
    }
    throw error;
  }
}

/**
 * API Client with methods for all endpoints
 */
export const apiClient = {
  // ========================================
  // Auth API
  // ========================================
  
  registerUser: (userData: RegistrationData) => {
    return apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // ========================================
  // Supervisors API
  // ========================================
  
  getSupervisors: (token: string, params?: SupervisorFilterParams) => {
    const query = new URLSearchParams();
    if (params?.department) query.append('department', params.department);
    if (params?.search) query.append('search', params.search);
    if (params?.availability) query.append('availability', params.availability);
    if (params?.expertise) query.append('expertise', params.expertise);
    if (params?.interests) query.append('interests', params.interests);
    
    return apiFetch(`/supervisors?${query.toString()}`, { token });
  },

  getSupervisorById: (id: string, token: string) => {
    return apiFetch(`/supervisors/${id}`, { token });
  },

  getSupervisorApplications: (id: string, token: string) => {
    return apiFetch(`/supervisors/${id}/applications`, { token });
  },

  getSupervisorProjects: (id: string, token: string) => {
    return apiFetch(`/supervisors/${id}/projects`, { token });
  },

  updateSupervisor: (id: string, data: Partial<Supervisor>, token: string) => {
    return apiFetch(`/supervisors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      token,
    });
  },

  // ========================================
  // Applications API
  // ========================================
  
  getApplications: (token: string) => {
    return apiFetch('/applications', { token });
  },

  getApplicationById: (id: string, token: string) => {
    return apiFetch(`/applications/${id}`, { token });
  },

  createApplication: (data: CreateApplicationData, token: string) => {
    return apiFetch('/applications', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    });
  },

  updateApplicationStatus: (id: string, status: ApplicationStatus, feedback: string, token: string) => {
    return apiFetch(`/applications/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, feedback }),
      token,
    });
  },

  updateApplication: (id: string, data: UpdateApplicationData, token: string) => {
    return apiFetch(`/applications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      token,
    });
  },

  resubmitApplication: (id: string, token: string) => {
    return apiFetch(`/applications/${id}/resubmit`, {
      method: 'POST',
      token,
    });
  },

  deleteApplication: (id: string, token: string) => {
    return apiFetch(`/applications/${id}`, {
      method: 'DELETE',
      token,
    });
  },

  // ========================================
  // Students API
  // ========================================
  
  getStudents: (token: string) => {
    return apiFetch('/students', { token });
  },

  getStudentById: (id: string, token: string) => {
    return apiFetch(`/students/${id}`, { token });
  },

  getStudentApplications: (id: string, token: string) => {
    return apiFetch(`/students/${id}/applications`, { token });
  },

  getUnmatchedStudents: (token: string) => {
    return apiFetch('/students/unmatched', { token });
  },

  updateStudent: (id: string, data: Partial<Student>, token: string) => {
    return apiFetch(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      token,
    });
  },

  // ========================================
  // Student Partnerships API
  // ========================================
  
  getAvailablePartners: (token: string) => {
    return apiFetch('/students/available-partners', { token });
  },

  createPartnershipRequest: (data: { targetStudentId: string }, token: string) => {
    return apiFetch('/partnerships/request', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    });
  },

  getPartnershipRequests: (studentId: string, type: string, token: string) => {
    return apiFetch(`/students/${studentId}/partnership-requests?type=${type}`, { token });
  },

  respondToPartnershipRequest: (requestId: string, action: string, token: string) => {
    return apiFetch(`/partnerships/${requestId}/respond`, {
      method: 'POST',
      body: JSON.stringify({ action }),
      token,
    });
  },

  cancelPartnershipRequest: (requestId: string, token: string) => {
    return apiFetch(`/partnerships/${requestId}`, {
      method: 'DELETE',
      token,
    });
  },

  unpairFromPartner: (token: string) => {
    return apiFetch('/partnerships/unpair', {
      method: 'POST',
      token,
    });
  },

  getPartnerDetails: (partnerId: string, token: string) => {
    return apiFetch(`/students/${partnerId}`, { token });
  },

  // ========================================
  // Supervisor Partnerships API
  // ========================================
  
  getAvailableSupervisorPartners: (token: string) => {
    return apiFetch('/supervisor-partnerships/available', { token });
  },

  createSupervisorPartnershipRequest: (data: { targetSupervisorId: string; projectId: string }, token: string) => {
    return apiFetch('/supervisor-partnerships/request', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    });
  },

  getSupervisorPartnershipRequests: (type: 'incoming' | 'outgoing' | 'all', token: string) => {
    const queryParam = type ? `?type=${type}` : '';
    return apiFetch(`/supervisor-partnerships/requests${queryParam}`, { token });
  },

  respondToSupervisorPartnershipRequest: (requestId: string, action: string, token: string) => {
    return apiFetch(`/supervisor-partnerships/${requestId}/respond`, {
      method: 'POST',
      body: JSON.stringify({ action }),
      token,
    });
  },

  cancelSupervisorPartnershipRequest: (requestId: string, token: string) => {
    return apiFetch(`/supervisor-partnerships/${requestId}`, {
      method: 'DELETE',
      token,
    });
  },

  removeCoSupervisor: (projectId: string, token: string) => {
    return apiFetch('/supervisor-partnerships/unpair', {
      method: 'POST',
      body: JSON.stringify({ projectId }),
      token,
    });
  },

  getSupervisorPartnerships: (token: string) => {
    return apiFetch('/supervisor-partnerships/partner', { token });
  },

  getSupervisorPartnersWithCapacity: (token: string) => {
    return apiFetch('/supervisor-partnerships/partners-with-capacity', { token });
  },

  // ========================================
  // Projects API
  // ========================================
  
  getProjects: (token: string) => {
    return apiFetch('/projects', { token });
  },

  getProjectById: (id: string, token: string) => {
    return apiFetch(`/projects/${id}`, { token });
  },

  createProject: (data: CreateProjectData, token: string) => {
    return apiFetch('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    });
  },

  // ========================================
  // Admin API
  // ========================================
  
  getAdminStats: (token: string) => {
    return apiFetch('/admin/stats', { token });
  },

  // Get all supervisors for admin (full data including maxCapacity)
  getAdminSupervisors: (token: string) => {
    return apiFetch('/admin/supervisors', { token });
  },

  // Admin capacity override endpoint
  updateSupervisorCapacity: async (
    supervisorId: string,
    maxCapacity: number,
    reason: string,
    token: string
  ) => {
    return apiFetch(
      `/admin/supervisors/${supervisorId}/capacity`,
      {
        method: 'PATCH',
        body: JSON.stringify({ maxCapacity, reason }),
        token,
      }
    );
  },

  // ========================================
  // Users API
  // ========================================
  
  getUsers: (token: string) => {
    return apiFetch('/users', { token });
  },

  getUserById: (id: string, token: string) => {
    return apiFetch(`/users/${id}`, { token });
  },

  updateUser: (id: string, data: Partial<BaseUser>, token: string) => {
    return apiFetch(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      token,
    });
  },
};

