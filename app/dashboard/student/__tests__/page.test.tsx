import { render, screen, waitFor } from '@testing-library/react';
import StudentDashboard from '../page';
import { applications, supervisors } from '@/mock-data';
import { ApplicationService, SupervisorService } from '@/lib/services';

// Mock navigation functions
const mockPush = jest.fn();
const mockReplace = jest.fn();

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
    push: mockPush,
    replace: mockReplace,
  })),
}));

describe('StudentDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
    mockReplace.mockClear();
    
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
  
  // Verifies stat cards calculate and display correct values from mock data
  it('should display correct stat card values based on data', async () => {
    render(<StudentDashboard />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading dashboard...')).not.toBeInTheDocument();
    });

    // Verify the calculated values are displayed correctly
    // Total applications count (from mock data: applications.length)
    const totalAppsCount = applications.length;
    expect(screen.getByText(totalAppsCount.toString())).toBeInTheDocument();
    
    // Pending count (pending + under_review statuses)
    const pendingCount = applications.filter(
      app => app.status === 'pending' || app.status === 'under_review'
    ).length;
    // Find the "Pending Review" stat card and verify its value
    const pendingReviewCard = screen.getByText('Pending Review').closest('.card-base');
    expect(pendingReviewCard).toHaveTextContent(pendingCount.toString());
    
    // Approved count
    const approvedCount = applications.filter(app => app.status === 'approved').length;
    expect(screen.getByText(approvedCount.toString())).toBeInTheDocument();
    
    // Available supervisors count
    const availableSupervisorsCount = supervisors.filter(
      sup => sup.availabilityStatus === 'available'
    ).length;
    // Find the "Available Supervisors" stat card (h3 title) and verify its value
    const availableSupervisorsTitles = screen.getAllByText('Available Supervisors');
    const statCardTitle = availableSupervisorsTitles.find(el => el.tagName === 'H3');
    expect(statCardTitle).toBeInTheDocument();
    const availableSupervisorsCard = statCardTitle!.closest('.card-base');
    expect(availableSupervisorsCard).toHaveTextContent(availableSupervisorsCount.toString());
  });

  // Tests loading indicator displays while dashboard data is being fetched
  it('should show loading state initially', async () => {
    render(<StudentDashboard />);
    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByText('Loading dashboard...')).not.toBeInTheDocument();
    });
  });
});
