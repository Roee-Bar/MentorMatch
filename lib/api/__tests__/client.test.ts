/**
 * [Integration] API Client Tests
 * 
 * Tests for the API client library that wraps fetch calls
 */

// Mock global fetch
global.fetch = jest.fn();

import { apiClient, apiFetch } from '../client';

describe('[Integration] API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('apiFetch', () => {
    it('should make a GET request with authorization header', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      });

      await apiFetch('/test', { token: 'test-token' });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should make a request without authorization header when no token provided', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      await apiFetch('/test');

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'Authorization': expect.anything(),
          }),
        })
      );
    });

    it('should return JSON response on success', async () => {
      const mockData = { success: true, data: { id: 1, name: 'Test' } };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      const result = await apiFetch('/test');

      expect(result).toEqual(mockData);
    });

    it('should throw error on failed request', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Not found' }),
      });

      await expect(apiFetch('/test')).rejects.toThrow('Not found');
    });

    it('should throw generic error when no error message in response', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({}),
      });

      await expect(apiFetch('/test')).rejects.toThrow('API request failed');
    });
  });

  describe('Supervisors API', () => {
    it('should call getSupervisors with token', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      });

      await apiClient.getSupervisors('test-token');

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/supervisors?',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
          }),
        })
      );
    });

    it('should build query string for available supervisors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      });

      await apiClient.getSupervisors('test-token', { available: true });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/supervisors?available=true',
        expect.anything()
      );
    });

    it('should build query string for department filter', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      });

      await apiClient.getSupervisors('test-token', { department: 'CS' });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/supervisors?department=CS',
        expect.anything()
      );
    });

    it('should call getSupervisorById', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: {} }),
      });

      await apiClient.getSupervisorById('supervisor-123', 'test-token');

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/supervisors/supervisor-123',
        expect.anything()
      );
    });

    it('should call updateSupervisor with PUT method', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      const updateData = { bio: 'New bio' };
      await apiClient.updateSupervisor('supervisor-123', updateData, 'test-token');

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/supervisors/supervisor-123',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updateData),
        })
      );
    });
  });

  describe('Applications API', () => {
    it('should call getApplications', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      });

      await apiClient.getApplications('test-token');

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/applications',
        expect.anything()
      );
    });

    it('should call createApplication with POST method', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      const applicationData = {
        supervisorId: 'sup-123',
        projectTitle: 'Test Project',
        projectDescription: 'Description',
        hasPartner: false,
      };

      await apiClient.createApplication(applicationData, 'test-token');

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/applications',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(applicationData),
        })
      );
    });

    it('should call updateApplicationStatus with PATCH method', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      await apiClient.updateApplicationStatus('app-123', 'approved', 'Great work!', 'test-token');

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/applications/app-123/status',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ status: 'approved', feedback: 'Great work!' }),
        })
      );
    });

    it('should call deleteApplication with DELETE method', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      await apiClient.deleteApplication('app-123', 'test-token');

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/applications/app-123',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('Students API', () => {
    it('should call getStudents', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      });

      await apiClient.getStudents('test-token');

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/students',
        expect.anything()
      );
    });

    it('should call getStudentById', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: {} }),
      });

      await apiClient.getStudentById('student-123', 'test-token');

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/students/student-123',
        expect.anything()
      );
    });

    it('should call updateStudent with PUT method', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      const updateData = { matchStatus: 'matched' };
      await apiClient.updateStudent('student-123', updateData, 'test-token');

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/students/student-123',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updateData),
        })
      );
    });
  });

  describe('Projects API', () => {
    it('should call getProjects', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      });

      await apiClient.getProjects('test-token');

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/projects',
        expect.anything()
      );
    });

    it('should call createProject with POST method', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      const projectData = {
        title: 'New Project',
        description: 'Description',
        supervisorId: 'sup-123',
      };

      await apiClient.createProject(projectData, 'test-token');

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/projects',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(projectData),
        })
      );
    });
  });

  describe('Admin API', () => {
    it('should call getAdminStats', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: {} }),
      });

      await apiClient.getAdminStats('test-token');

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/stats',
        expect.anything()
      );
    });

    it('should call getAdminReports', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: {} }),
      });

      await apiClient.getAdminReports('test-token');

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/reports',
        expect.anything()
      );
    });
  });

  describe('Users API', () => {
    it('should call getUsers', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      });

      await apiClient.getUsers('test-token');

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/users',
        expect.anything()
      );
    });

    it('should call getUserById', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: {} }),
      });

      await apiClient.getUserById('user-123', 'test-token');

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/users/user-123',
        expect.anything()
      );
    });

    it('should call updateUser with PUT method', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      const updateData = { role: 'admin' };
      await apiClient.updateUser('user-123', updateData, 'test-token');

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/users/user-123',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updateData),
        })
      );
    });
  });
});

