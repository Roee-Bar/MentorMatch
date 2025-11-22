import { render, screen, waitFor } from '@testing-library/react';
import StudentDashboard from '../page';
import { applications, supervisors } from '@/mock-data';

// Mock the auth module
jest.mock('@/lib/auth', () => ({
  onAuthChange: jest.fn((callback) => {
    callback({ uid: 'test-user-id' });
    return jest.fn(); // unsubscribe function
  }),
  getUserProfile: jest.fn().mockResolvedValue({
    success: true,
    data: { role: 'student', name: 'Test Student' }
  }),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
  })),
}));

// Mock the services
jest.mock('@/lib/services', () => ({
  ApplicationService: {
    getAllApplications: jest.fn(),
  },
  SupervisorService: {
    getAvailableSupervisors: jest.fn(),
  },
  StudentService: {},
}));

describe('StudentDashboard', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    const { ApplicationService, SupervisorService } = require('@/lib/services');
    
    // Set up default mock implementations using actual mock data
    ApplicationService.getAllApplications.mockResolvedValue(applications);
    
    // Filter only available supervisors like the actual service does
    const availableSupervisors = supervisors.filter(sup => sup.availabilityStatus === 'available');
    SupervisorService.getAvailableSupervisors.mockResolvedValue(availableSupervisors);
  });
  
  it('should render stat cards with data', async () => {
    render(<StudentDashboard />);
    await waitFor(() => {
      expect(screen.getAllByText('My Applications').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Available Supervisors').length).toBeGreaterThan(0);
      expect(screen.getByText('Pending Review')).toBeInTheDocument();
    });
  });


  it('should show loading state initially', async () => {
    render(<StudentDashboard />);
    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
    // Wait for loading to complete to avoid act() warnings
    await waitFor(() => {
      expect(screen.queryByText('Loading dashboard...')).not.toBeInTheDocument();
    });
  });
});

