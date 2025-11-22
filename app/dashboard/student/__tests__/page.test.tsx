import { render, screen, waitFor } from '@testing-library/react';
import StudentDashboard from '../page';
import { ApplicationService, SupervisorService, applications, supervisors } from '@/mock-data';

// Mock the services
jest.mock('@/mock-data', () => {
  const actualMockData = jest.requireActual('@/mock-data');
  return {
    ...actualMockData,
    ApplicationService: {
      getAllApplications: jest.fn(),
    },
    SupervisorService: {
      getAvailableSupervisors: jest.fn(),
    },
  };
});

describe('StudentDashboard', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Set up default mock implementations using actual mock data
    (ApplicationService.getAllApplications as jest.Mock).mockResolvedValue(applications);
    
    // Filter only available supervisors like the actual service does
    const availableSupervisors = supervisors.filter(sup => sup.availabilityStatus === 'available');
    (SupervisorService.getAvailableSupervisors as jest.Mock).mockResolvedValue(availableSupervisors);
  });
  it('should render dashboard title', async () => {
    render(<StudentDashboard />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /student dashboard/i })).toBeInTheDocument();
    });
  });

  it('should render stat cards with data', async () => {
    render(<StudentDashboard />);
    await waitFor(() => {
      expect(screen.getAllByText('My Applications').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Available Supervisors').length).toBeGreaterThan(0);
      expect(screen.getByText('Application Status')).toBeInTheDocument();
    });
  });

  it('should display applications and supervisors after loading', async () => {
    render(<StudentDashboard />);
    
    await waitFor(() => {
      // Check for actual data from mock-data folder
      expect(screen.getByText(applications[0].projectTitle)).toBeInTheDocument();
      const availableSupervisors = supervisors.filter(sup => sup.availabilityStatus === 'available');
      expect(screen.getByText(availableSupervisors[0].name)).toBeInTheDocument();
    });
  });

  it('should show loading state initially', async () => {
    render(<StudentDashboard />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    // Wait for loading to complete to avoid act() warnings
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });
});

