import { render, screen, waitFor } from '@testing-library/react';
import SupervisorDashboard from '../page';
import { applications } from '@/mock-data';

// Mock the RepositoryFactory
jest.mock('@/lib/repositories/RepositoryFactory', () => ({
  RepositoryFactory: {
    getApplicationRepository: jest.fn(() => ({
      getApplicationsBySupervisorId: jest.fn(),
    })),
  },
}));

describe('SupervisorDashboard', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    const { RepositoryFactory } = require('@/lib/repositories/RepositoryFactory');
    
    // Filter applications for supervisor ID '1' like the actual component does
    const supervisor1Applications = applications.filter(app => app.supervisorId === '1');
    
    // Set up default mock implementation using actual mock data
    RepositoryFactory.getApplicationRepository.mockReturnValue({
      getApplicationsBySupervisorId: jest.fn().mockResolvedValue(supervisor1Applications),
    });
  });

  it('should render supervisor dashboard title', async () => {
    render(<SupervisorDashboard />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /supervisor dashboard/i })).toBeInTheDocument();
    });
  });

  it('should display stat cards with data', async () => {
    render(<SupervisorDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Total Applications')).toBeInTheDocument();
      expect(screen.getByText('Pending Review')).toBeInTheDocument();
      expect(screen.getByText('All applications')).toBeInTheDocument();
      expect(screen.getByText('Awaiting response')).toBeInTheDocument();
    });
  });

  it('should fetch applications using RepositoryFactory', async () => {
    const { RepositoryFactory } = require('@/lib/repositories/RepositoryFactory');
    const mockGetApplicationsBySupervisorId = jest.fn().mockResolvedValue(applications.filter(app => app.supervisorId === '1'));
    
    RepositoryFactory.getApplicationRepository.mockReturnValue({
      getApplicationsBySupervisorId: mockGetApplicationsBySupervisorId,
    });

    render(<SupervisorDashboard />);

    await waitFor(() => {
      expect(RepositoryFactory.getApplicationRepository).toHaveBeenCalled();
      expect(mockGetApplicationsBySupervisorId).toHaveBeenCalledWith('1');
    });
  });

  it('should display all applications in grid layout', async () => {
    render(<SupervisorDashboard />);

    await waitFor(() => {
      // Check for actual data from mock-data folder for supervisor '1'
      const supervisor1Apps = applications.filter(app => app.supervisorId === '1');
      supervisor1Apps.forEach(app => {
        expect(screen.getByText(app.projectTitle)).toBeInTheDocument();
      });
    });
  });

  it('should show loading state initially', async () => {
    render(<SupervisorDashboard />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    // Wait for loading to complete to avoid act() warnings
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });

  it('should handle empty applications gracefully', async () => {
    const { RepositoryFactory } = require('@/lib/repositories/RepositoryFactory');
    
    RepositoryFactory.getApplicationRepository.mockReturnValue({
      getApplicationsBySupervisorId: jest.fn().mockResolvedValue([]),
    });

    render(<SupervisorDashboard />);

    await waitFor(() => {
      expect(screen.getByText('No applications yet.')).toBeInTheDocument();
    });
  });
});
