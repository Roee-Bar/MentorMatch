import { render, screen, waitFor } from '@testing-library/react';
import SupervisorDashboard from '../page';
import { applications } from '@/mock-data';
import { ApplicationService, SupervisorService, ProjectService } from '@/lib/services';
import { onAuthChange, getUserProfile } from '@/lib/auth';

// Mock the Firebase services
jest.mock('@/lib/services', () => ({
  ApplicationService: {
    getSupervisorApplications: jest.fn(),
    getPendingApplications: jest.fn(),
  },
  SupervisorService: {
    getSupervisorById: jest.fn(),
  },
  ProjectService: {
    getSupervisorProjects: jest.fn(),
  },
}));

// Mock the auth module
jest.mock('@/lib/auth', () => ({
  onAuthChange: jest.fn(),
  getUserProfile: jest.fn(),
}));

// Mock next/navigation
const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: mockPush,
    replace: mockReplace,
  })),
}));

describe('SupervisorDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
    mockReplace.mockClear();
    
    // Set up default auth mocks
    (onAuthChange as jest.Mock).mockImplementation((callback) => {
      // Simulate authenticated supervisor user asynchronously
      setTimeout(() => {
        callback({ uid: 'supervisor-123' });
      }, 0);
      return jest.fn(); // Return unsubscribe function
    });
    
    (getUserProfile as jest.Mock).mockResolvedValue({
      success: true,
      data: { role: 'supervisor', name: 'Dr. Test Supervisor' },
    });
    
    // Mock supervisor profile data
    const mockSupervisor = {
      id: 'supervisor-123',
      firstName: 'Test',
      lastName: 'Supervisor',
      fullName: 'Dr. Test Supervisor',
      email: 'supervisor@test.com',
      department: 'Computer Science',
      title: 'Dr.',
      bio: 'Test bio',
      researchInterests: ['AI', 'ML'],
      expertiseAreas: ['Deep Learning', 'NLP'],
      maxCapacity: 5,
      currentCapacity: 2,
      availabilityStatus: 'available' as const,
      isApproved: true,
      isActive: true,
      notificationPreference: 'immediate' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    (SupervisorService.getSupervisorById as jest.Mock).mockResolvedValue(mockSupervisor);
    
    // Mock applications data - convert to Application type
    const mockApplications = applications.map(app => ({
      id: app.id,
      studentId: 'student-' + app.id,
      studentName: 'Student ' + app.id,
      studentEmail: 'student' + app.id + '@test.com',
      supervisorId: 'supervisor-123',
      supervisorName: app.supervisorName,
      projectTitle: app.projectTitle,
      projectDescription: app.projectDescription,
      isOwnTopic: true,
      studentSkills: 'Test skills',
      studentInterests: 'Test interests',
      hasPartner: false,
      status: app.status,
      dateApplied: new Date(app.dateApplied),
      lastUpdated: new Date(app.dateApplied),
      supervisorFeedback: app.comments,
      responseTime: app.responseTime,
    }));
    
    (ApplicationService.getSupervisorApplications as jest.Mock).mockResolvedValue(mockApplications);
    
    // Mock pending applications
    const pendingApps = mockApplications.filter(
      app => app.status === 'pending' || app.status === 'under_review'
    );
    (ApplicationService.getPendingApplications as jest.Mock).mockResolvedValue(pendingApps);
    
    // Mock projects
    (ProjectService.getSupervisorProjects as jest.Mock).mockResolvedValue([
      {
        id: 'project-1',
        projectCode: '25-2-D-01',
        studentIds: ['student-1'],
        studentNames: ['Student 1'],
        supervisorId: 'supervisor-123',
        supervisorName: 'Dr. Test Supervisor',
        title: 'Test Project',
        description: 'Test description',
        status: 'approved' as const,
        phase: 'A' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  });
  
  // Test: Redirects unauthenticated users
  it('should redirect unauthenticated users to login', async () => {
    (onAuthChange as jest.Mock).mockImplementation((callback) => {
      setTimeout(() => {
        callback(null); // No user
      }, 0);
      return jest.fn();
    });
    
    render(<SupervisorDashboard />);
    
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/login');
    }, { timeout: 3000 });
  });
  
  // Test: Redirects non-supervisor users
  it('should redirect non-supervisor users to appropriate dashboard', async () => {
    // Override the onAuthChange mock to still provide a user
    (onAuthChange as jest.Mock).mockImplementation((callback) => {
      setTimeout(() => {
        callback({ uid: 'student-123' });
      }, 0);
      return jest.fn();
    });
    
    // Mock getUserProfile to return student role
    (getUserProfile as jest.Mock).mockResolvedValue({
      success: true,
      data: { role: 'student' },
    });
    
    render(<SupervisorDashboard />);
    
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/dashboard/student');
    }, { timeout: 3000 });
  });
  
  // Test: Shows loading state
  it('should show loading state initially', () => {
    render(<SupervisorDashboard />);
    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
  });
  
  // Test: Fetches supervisor data on mount
  it('should fetch supervisor data on mount', async () => {
    render(<SupervisorDashboard />);
    
    await waitFor(() => {
      expect(SupervisorService.getSupervisorById).toHaveBeenCalledWith('supervisor-123');
    }, { timeout: 3000 });
  });
  
  // Test: Fetches applications data on mount
  it('should fetch applications data on mount', async () => {
    render(<SupervisorDashboard />);
    
    await waitFor(() => {
      expect(ApplicationService.getSupervisorApplications).toHaveBeenCalledWith('supervisor-123');
    }, { timeout: 3000 });
  });
  
  // Test: Displays correct stat card values
  it('should display correct stat card values based on data', async () => {
    render(<SupervisorDashboard />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading dashboard...')).not.toBeInTheDocument();
    }, { timeout: 3000 });

    // Total applications count
    const totalAppsCount = applications.length;
    expect(screen.getByText(totalAppsCount.toString())).toBeInTheDocument();
    
    // Pending count (pending + under_review)
    const pendingCount = applications.filter(
      app => app.status === 'pending' || app.status === 'under_review'
    ).length;
    const pendingReviewCard = screen.getByText('Pending Review').closest('.card-base');
    expect(pendingReviewCard).toHaveTextContent(pendingCount.toString());
    
    // Current capacity - use getAllByText since "2" appears multiple times
    const capacityElements = screen.getAllByText('2');
    expect(capacityElements.length).toBeGreaterThan(0);
    
    // Approved projects count - use getAllByText since "1" appears multiple times
    const projectElements = screen.getAllByText('1');
    expect(projectElements.length).toBeGreaterThan(0);
  });
  
  // Test: Shows empty state when no applications
  it('should show empty state when no applications exist', async () => {
    (ApplicationService.getSupervisorApplications as jest.Mock).mockResolvedValue([]);
    
    render(<SupervisorDashboard />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading dashboard...')).not.toBeInTheDocument();
    }, { timeout: 3000 });
    
    expect(screen.getByText(/no applications/i)).toBeInTheDocument();
  });
  
  // Test: Displays application cards when data exists
  it('should render application cards when applications exist', async () => {
    render(<SupervisorDashboard />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading dashboard...')).not.toBeInTheDocument();
    }, { timeout: 3000 });
    
    // Check that application titles are rendered
    applications.forEach(app => {
      expect(screen.getByText(app.projectTitle)).toBeInTheDocument();
    });
  });
});

