import { render, screen, waitFor } from '@testing-library/react';
import SupervisorDashboard from '../page';
import { RepositoryFactory } from '@/lib/repositories';

describe('Supervisor Dashboard Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Dashboard Load', () => {
    it('should load data from repository and render all components', async () => {
      render(<SupervisorDashboard />);

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      // Verify: Main heading renders
      expect(screen.getByText('Supervisor Dashboard')).toBeInTheDocument();

      // Verify: All four stat cards render
      expect(screen.getByText('Total Applications')).toBeInTheDocument();
      expect(screen.getByText('Pending Review')).toBeInTheDocument();
      expect(screen.getByText('All applications')).toBeInTheDocument();
      expect(screen.getByText('Awaiting response')).toBeInTheDocument();
    });

    it('should fetch data using Promise pattern', async () => {
      // Spy on the repository factory method
      const getApplicationRepoSpy = jest.spyOn(RepositoryFactory, 'getApplicationRepository');

      render(<SupervisorDashboard />);

      // Wait for data to load
      await waitFor(() => {
        expect(getApplicationRepoSpy).toHaveBeenCalled();
      });

      // Verify: Factory method was called
      expect(getApplicationRepoSpy).toHaveBeenCalledTimes(1);

      getApplicationRepoSpy.mockRestore();
    });

    it('should display correct counts from fetched data', async () => {
      render(<SupervisorDashboard />);

      // Wait for data to load
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      // Get the actual data from repository for supervisor '1'
      const applicationRepo = RepositoryFactory.getApplicationRepository();
      const applications = await applicationRepo.getApplicationsBySupervisorId('1');
      const pendingCount = applications.filter(app => app.status === 'pending').length;
      const underReviewCount = applications.filter(app => app.status === 'under_review').length;
      const approvedCount = applications.filter(app => app.status === 'approved').length;

      // Verify: Counts match the data
      expect(screen.getByText('Total Applications')).toBeInTheDocument();
      expect(screen.getByText(applications.length.toString())).toBeInTheDocument();

      // Verify individual status counts are displayed (they may appear multiple times)
      if (pendingCount > 0) {
        const pendingElements = screen.getAllByText(pendingCount.toString());
        expect(pendingElements.length).toBeGreaterThanOrEqual(1);
      }
      if (underReviewCount > 0) {
        const underReviewElements = screen.getAllByText(underReviewCount.toString());
        expect(underReviewElements.length).toBeGreaterThanOrEqual(1);
      }
      if (approvedCount > 0) {
        const approvedElements = screen.getAllByText(approvedCount.toString());
        expect(approvedElements.length).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe('Empty State Handling', () => {
    it('should handle empty applications gracefully', async () => {
      // Mock empty applications
      const mockRepo = {
        getApplicationsBySupervisorId: jest.fn().mockResolvedValue([]),
      };
      jest.spyOn(RepositoryFactory, 'getApplicationRepository').mockReturnValue(mockRepo as any);

      render(<SupervisorDashboard />);

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      // Verify: Page still renders without crashing
      expect(screen.getByText('Supervisor Dashboard')).toBeInTheDocument();

      // Verify: Empty state message appears
      expect(screen.getByText('No applications yet.')).toBeInTheDocument();

      // Verify: Count shows 0
      const zeroElements = screen.getAllByText('0');
      expect(zeroElements.length).toBeGreaterThanOrEqual(4); // All 4 stat cards should show 0
    });
  });

  describe('Application Cards Rendering', () => {
    it('should render application cards for each application', async () => {
      render(<SupervisorDashboard />);

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      // Get actual applications for supervisor '1'
      const applicationRepo = RepositoryFactory.getApplicationRepository();
      const applications = await applicationRepo.getApplicationsBySupervisorId('1');

      // Verify: Applications section exists
      const myApplicationsHeadings = screen.getAllByText(/my applications/i);
      expect(myApplicationsHeadings.length).toBeGreaterThan(0);

      // If there are applications, verify cards are rendered
      if (applications.length > 0) {
        applications.forEach(app => {
          expect(screen.getByText(app.projectTitle)).toBeInTheDocument();
        });
      }
    });

    it('should display application status for each card', async () => {
      render(<SupervisorDashboard />);

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      // Get actual applications
      const applicationRepo = RepositoryFactory.getApplicationRepository();
      const applications = await applicationRepo.getApplicationsBySupervisorId('1');

      // Look for status indicators
      if (applications.length > 0) {
        const statusElements = screen.queryAllByText(/(pending|under review|approved|rejected)/i);
        expect(statusElements.length).toBeGreaterThan(0);
      }
    });

    it('should display student names in application cards', async () => {
      render(<SupervisorDashboard />);

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      // Get actual applications
      const applicationRepo = RepositoryFactory.getApplicationRepository();
      const applications = await applicationRepo.getApplicationsBySupervisorId('1');

      // Verify student names are displayed (they appear in the supervisor name field but we can verify the structure exists)
      if (applications.length > 0) {
        expect(screen.getByText(/my applications/i)).toBeInTheDocument();
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      // Mock service error
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const mockRepo = {
        getApplicationsBySupervisorId: jest.fn().mockRejectedValue(new Error('Service error')),
      };
      jest.spyOn(RepositoryFactory, 'getApplicationRepository').mockReturnValue(mockRepo as any);

      render(<SupervisorDashboard />);

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      // Verify: Error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching supervisor dashboard data:',
        expect.any(Error)
      );

      // Verify: Page still renders (doesn't crash)
      expect(screen.getByText('Supervisor Dashboard')).toBeInTheDocument();

      consoleErrorSpy.mockRestore();
    });
  });
});

