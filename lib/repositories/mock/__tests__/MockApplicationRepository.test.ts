import { MockApplicationRepository } from '../MockApplicationRepository';
import { applications } from '@/mock-data/data/applications';

describe('MockApplicationRepository', () => {
  let repository: MockApplicationRepository;

  beforeEach(() => {
    repository = new MockApplicationRepository();
  });

  describe('getApplicationsBySupervisorId', () => {
    it('should return applications for a specific supervisor', async () => {
      const supervisorId = '1';
      const result = await repository.getApplicationsBySupervisorId(supervisorId);

      // Based on mock data, supervisor '1' (Dr. James Anderson) has 3 applications
      expect(result).toHaveLength(3);
      result.forEach(app => {
        expect(app.supervisorId).toBe(supervisorId);
      });
    });

    it('should return empty array when no applications found for supervisor', async () => {
      const nonExistentSupervisorId = '999';
      const result = await repository.getApplicationsBySupervisorId(nonExistentSupervisorId);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should return multiple applications for supervisor with multiple applicants', async () => {
      const supervisorId = '2';
      const result = await repository.getApplicationsBySupervisorId(supervisorId);

      // Based on mock data, supervisor '2' (Prof. Linda Martinez) has 3 applications
      expect(result.length).toBeGreaterThan(1);
      result.forEach(app => {
        expect(app.supervisorId).toBe(supervisorId);
        expect(app.supervisorName).toBe('Prof. Linda Martinez');
      });
    });

    it('should return applications with different statuses for the same supervisor', async () => {
      const supervisorId = '1';
      const result = await repository.getApplicationsBySupervisorId(supervisorId);

      const statuses = result.map(app => app.status);
      const uniqueStatuses = new Set(statuses);

      // Supervisor '1' should have applications with different statuses
      expect(uniqueStatuses.size).toBeGreaterThan(1);
    });

    it('should return new array instance (not reference to original)', async () => {
      const supervisorId = '1';
      const result = await repository.getApplicationsBySupervisorId(supervisorId);

      // Modifying the result should not affect the original data
      const originalLength = applications.filter(app => app.supervisorId === supervisorId).length;
      result.push({
        id: 'test',
        studentId: 'test',
        studentName: 'Test Student',
        supervisorId: 'test',
        supervisorName: 'Test',
        projectTitle: 'Test',
        status: 'pending',
        dateApplied: '2024-01-01',
        projectDescription: 'Test',
        responseTime: 'Test',
        comments: 'Test',
      });

      const resultAgain = await repository.getApplicationsBySupervisorId(supervisorId);
      expect(resultAgain).toHaveLength(originalLength);
    });
  });

  describe('getApplicationsByStudentId', () => {
    it('should return applications for a specific student', async () => {
      const studentId = '101';
      const result = await repository.getApplicationsByStudentId(studentId);

      expect(result).toHaveLength(1);
      expect(result[0].studentId).toBe(studentId);
      expect(result[0].studentName).toBe('Alice Johnson');
    });

    it('should return empty array when no applications found for student', async () => {
      const nonExistentStudentId = '999';
      const result = await repository.getApplicationsByStudentId(nonExistentStudentId);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('getAllApplications', () => {
    it('should return all applications', async () => {
      const result = await repository.getAllApplications();

      expect(result).toHaveLength(applications.length);
      expect(result.length).toBeGreaterThanOrEqual(9); // We added 9 applications
    });
  });

  describe('getApplicationById', () => {
    it('should return specific application by ID', async () => {
      const result = await repository.getApplicationById('1');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('1');
    });

    it('should return null for non-existent ID', async () => {
      const result = await repository.getApplicationById('999');

      expect(result).toBeNull();
    });
  });

  describe('getApplicationsCount', () => {
    it('should return total count of applications', async () => {
      const result = await repository.getApplicationsCount();

      expect(result).toBe(applications.length);
      expect(result).toBeGreaterThanOrEqual(9);
    });
  });

  describe('getApprovedApplicationsCount', () => {
    it('should return count of approved applications only', async () => {
      const result = await repository.getApprovedApplicationsCount();

      const expectedCount = applications.filter(app => app.status === 'approved').length;
      expect(result).toBe(expectedCount);
      expect(result).toBeGreaterThan(0);
    });
  });
});

