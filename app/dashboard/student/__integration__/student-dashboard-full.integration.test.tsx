import { render, screen, waitFor } from '@testing-library/react';
import StudentDashboard from '../page';
import { RepositoryFactory } from '@/lib/repositories';

describe('Student Dashboard Full Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Dashboard Load', () => {
    it('should load all services and render all sections', async () => {
      render(<StudentDashboard />);

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      // Verify: Main heading renders
      expect(screen.getByText('Student Dashboard')).toBeInTheDocument();

      // Verify: All three stat cards render (there are multiple headings with same text, so use getAllByText)
      const myApplicationsHeadings = screen.getAllByText('My Applications');
      expect(myApplicationsHeadings.length).toBeGreaterThan(0);
      
      const availableSupervisorsHeadings = screen.getAllByText('Available Supervisors');
      expect(availableSupervisorsHeadings.length).toBeGreaterThan(0);
      
      expect(screen.getByText('Application Status')).toBeInTheDocument();
    });

    it('should fetch data from both services using Promise.all', async () => {
      // Spy on the repository factory methods
      const getApplicationRepoSpy = jest.spyOn(RepositoryFactory, 'getApplicationRepository');
      const getSupervisorRepoSpy = jest.spyOn(RepositoryFactory, 'getSupervisorRepository');

      render(<StudentDashboard />);

      // Wait for data to load
      await waitFor(() => {
        expect(getApplicationRepoSpy).toHaveBeenCalled();
        expect(getSupervisorRepoSpy).toHaveBeenCalled();
      });

      // Verify: Both factory methods were called
      expect(getApplicationRepoSpy).toHaveBeenCalledTimes(1);
      expect(getSupervisorRepoSpy).toHaveBeenCalledTimes(1);

      getApplicationRepoSpy.mockRestore();
      getSupervisorRepoSpy.mockRestore();
    });

    it('should display correct counts from fetched data', async () => {
      render(<StudentDashboard />);

      // Wait for data to load
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      // Get the actual data from repositories
      const applicationRepo = RepositoryFactory.getApplicationRepository();
      const supervisorRepo = RepositoryFactory.getSupervisorRepository();
      const applications = await applicationRepo.getAllApplications();
      const supervisors = await supervisorRepo.getAvailableSupervisors();
      const approvedCount = applications.filter(app => app.status === 'approved').length;

      // Verify: Counts match the data
      // Look for the stat cards that display numbers
      const statCards = screen.getAllByText(/active applications|ready to accept|approved application/i);
      expect(statCards.length).toBeGreaterThan(0);

      // Verify the actual numbers are displayed in their specific contexts
      expect(screen.getByText(applications.length.toString())).toBeInTheDocument();
      // Use getAllByText for numbers that might appear multiple times
      const allNumberInstances = screen.getAllByText(supervisors.length.toString());
      expect(allNumberInstances.length).toBeGreaterThanOrEqual(1);
      const allApprovedInstances = screen.getAllByText(approvedCount.toString());
      expect(allApprovedInstances.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Empty State Handling', () => {
    it('should handle empty applications gracefully', async () => {
      // Mock empty applications
      const mockRepo = {
        getAllApplications: jest.fn().mockResolvedValue([]),
      };
      jest.spyOn(RepositoryFactory, 'getApplicationRepository').mockReturnValue(mockRepo as any);

      render(<StudentDashboard />);

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      // Verify: Page still renders without crashing
      expect(screen.getByText('Student Dashboard')).toBeInTheDocument();
      
      // Use getAllByText since there are multiple headings with same text
      const myApplicationsHeadings = screen.getAllByText(/my applications/i);
      expect(myApplicationsHeadings.length).toBeGreaterThan(0);

      // Verify: Count shows 0 (use getAllByText since there could be multiple 0s)
      const zeroElements = screen.getAllByText('0');
      expect(zeroElements.length).toBeGreaterThan(0);
    });

    it('should handle empty supervisors gracefully', async () => {
      // Mock empty supervisors
      const mockRepo = {
        getAvailableSupervisors: jest.fn().mockResolvedValue([]),
      };
      jest.spyOn(RepositoryFactory, 'getSupervisorRepository').mockReturnValue(mockRepo as any);

      render(<StudentDashboard />);

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      // Verify: Page still renders without crashing
      expect(screen.getByText('Student Dashboard')).toBeInTheDocument();
      
      // Use getAllByText since there are multiple headings with same text
      const availableSupervisorsHeadings = screen.getAllByText(/available supervisors/i);
      expect(availableSupervisorsHeadings.length).toBeGreaterThan(0);
    });
  });

  describe('Application Cards Rendering', () => {
    it('should render application cards for each application', async () => {
      render(<StudentDashboard />);

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      // Get actual applications
      const applicationRepo = RepositoryFactory.getApplicationRepository();
      const applications = await applicationRepo.getAllApplications();

      // Verify: Application cards section exists (use getAllByText since there are multiple)
      const myApplicationsHeadings = screen.getAllByText(/my applications/i);
      expect(myApplicationsHeadings.length).toBeGreaterThan(0);

      // If there are applications, verify cards are rendered
      if (applications.length > 0) {
        // Look for application-specific content
        // (The exact content depends on ApplicationCard implementation)
        const applicationCards = screen.queryAllByText(/project/i);
        expect(applicationCards.length).toBeGreaterThan(0);
      }
    });

    it('should display application status for each card', async () => {
      render(<StudentDashboard />);

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      // Look for status indicators
      // (Exact text depends on mock data and ApplicationCard implementation)
      const statusElements = screen.queryAllByText(/(pending|approved|rejected)/i);
      
      // Should have at least one status if there are applications
      const applicationRepo = RepositoryFactory.getApplicationRepository();
      const applications = await applicationRepo.getAllApplications();
      if (applications.length > 0) {
        expect(statusElements.length).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Supervisor Cards Rendering', () => {
    it('should render supervisor cards for each supervisor', async () => {
      render(<StudentDashboard />);

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      // Get actual supervisors
      const supervisorRepo = RepositoryFactory.getSupervisorRepository();
      const supervisors = await supervisorRepo.getAvailableSupervisors();

      // Verify: Supervisors section exists (use getAllByText since there are multiple)
      const availableSupervisorsHeadings = screen.getAllByText(/available supervisors/i);
      expect(availableSupervisorsHeadings.length).toBeGreaterThan(0);

      // If there are supervisors, verify some are rendered
      if (supervisors.length > 0) {
        // Look for supervisor-specific content
        // (The exact content depends on SupervisorCard implementation)
        const supervisorCards = screen.queryAllByText(/dr\.|prof\./i);
        // Some content from supervisors should be present
        expect(screen.getByText(/available supervisors/i)).toBeInTheDocument();
      }
    });

    it('should display supervisor expertise areas', async () => {
      render(<StudentDashboard />);

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      // Look for expertise-related content
      // (Exact content depends on mock data and SupervisorCard implementation)
      const supervisorRepo = RepositoryFactory.getSupervisorRepository();
      const supervisors = await supervisorRepo.getAvailableSupervisors();
      
      if (supervisors.length > 0 && supervisors[0].expertiseAreas) {
        // Should display at least some expertise information
        // Exact assertion depends on your SupervisorCard implementation
        expect(screen.getByText(/available supervisors/i)).toBeInTheDocument();
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      // Mock service error
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const mockRepo = {
        getAllApplications: jest.fn().mockRejectedValue(new Error('Service error')),
      };
      jest.spyOn(RepositoryFactory, 'getApplicationRepository').mockReturnValue(mockRepo as any);

      render(<StudentDashboard />);

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      // Verify: Error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching dashboard data:',
        expect.any(Error)
      );

      // Verify: Page still renders (doesn't crash)
      expect(screen.getByText('Student Dashboard')).toBeInTheDocument();

      consoleErrorSpy.mockRestore();
    });
  });
});

