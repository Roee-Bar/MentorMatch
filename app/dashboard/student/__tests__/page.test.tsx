import { render, screen, waitFor } from '@testing-library/react';
import StudentDashboard from '../page';
import { applications, supervisors } from '@/mock-data';

// Mock the Firebase services
jest.mock('@/lib/services', () => ({
  ApplicationService: {
    getStudentApplications: jest.fn(),
  },
  SupervisorService: {
    getAvailableSupervisors: jest.fn(),
  },
  StudentService: {},
}));

// Mock the auth module
jest.mock('@/lib/auth', () => ({
  onAuthChange: jest.fn((callback) => {
    // Simulate authenticated user
    callback({ uid: 'test-user-id' });
    return jest.fn(); // Return unsubscribe function
  }),
  getUserProfile: jest.fn().mockResolvedValue({
    success: true,
    data: { role: 'student', name: 'Test Student' },
  }),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
  })),
}));

import { ApplicationService, SupervisorService } from '@/lib/services';

describe('StudentDashboard', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Convert mock applications to ApplicationCardData format
    const applicationCards = applications.map(app => ({
      id: app.id,
      projectTitle: app.projectTitle,
      projectDescription: app.projectDescription,
      supervisorName: app.supervisorName,
      dateApplied: app.dateApplied,
      status: app.status,
      responseTime: app.responseTime,
      comments: app.comments,
    }));
    
    // Set up default mock implementations using actual mock data
    (ApplicationService.getStudentApplications as jest.Mock).mockResolvedValue(applicationCards);
    
    // Convert supervisors to SupervisorCardData format
    const supervisorCards = supervisors
      .filter(sup => sup.availabilityStatus === 'available')
      .map(sup => ({
        id: sup.id,
        name: sup.name,
        department: sup.department,
        bio: sup.bio,
        expertiseAreas: sup.expertiseAreas,
        researchInterests: sup.researchInterests,
        availabilityStatus: sup.availabilityStatus,
        currentCapacity: sup.currentCapacity,
        contact: sup.contact,
      }));
    
    (SupervisorService.getAvailableSupervisors as jest.Mock).mockResolvedValue(supervisorCards);
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
