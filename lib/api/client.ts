/**
 * API Client Library
 * 
 * Type-safe client for making API calls to backend routes
 */

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

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }

  return data;
}

/**
 * API Client with methods for all endpoints
 */
export const apiClient = {
  // ========================================
  // Auth API
  // ========================================
  
  registerUser: (userData: any) => {
    return apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // ========================================
  // Supervisors API
  // ========================================
  
  getSupervisors: (token: string, params?: { available?: boolean; department?: string }) => {
    const query = new URLSearchParams();
    if (params?.available) query.append('available', 'true');
    if (params?.department) query.append('department', params.department);
    
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

  updateSupervisor: (id: string, data: any, token: string) => {
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

  createApplication: (data: any, token: string) => {
    return apiFetch('/applications', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    });
  },

  updateApplicationStatus: (id: string, status: string, feedback: string, token: string) => {
    return apiFetch(`/applications/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, feedback }),
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

  updateStudent: (id: string, data: any, token: string) => {
    return apiFetch(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      token,
    });
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

  createProject: (data: any, token: string) => {
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

  // ========================================
  // Users API
  // ========================================
  
  getUsers: (token: string) => {
    return apiFetch('/users', { token });
  },

  getUserById: (id: string, token: string) => {
    return apiFetch(`/users/${id}`, { token });
  },

  updateUser: (id: string, data: any, token: string) => {
    return apiFetch(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      token,
    });
  },
};

