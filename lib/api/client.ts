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
  } catch (error: any) {
    // Handle network errors gracefully
    if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
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

  updateUser: (id: string, data: any, token: string) => {
    return apiFetch(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      token,
    });
  },
};

