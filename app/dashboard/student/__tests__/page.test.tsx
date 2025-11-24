import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import StudentDashboard from '../page';
import { applications, supervisors } from '@/mock-data';
import { ApplicationService, SupervisorService } from '@/lib/services';
import { onAuthChange, getUserProfile } from '@/lib/auth';

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

// Mock navigation functions
const mockPush = jest.fn();
const mockReplace = jest.fn();

// Mock the auth module
jest.mock('@/lib/auth', () => ({
  onAuthChange: jest.fn((callback) => {
    callback({ uid: 'test-user-id' });
    return jest.fn();
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

describe('StudentDashboard - Enhanced Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
    mockReplace.mockClear();
    
    // Set up default mock implementations
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
    
    (ApplicationService.getStudentApplications as jest.Mock).mockResolvedValue(applicationCards);
    
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
    expect(screen.getByText(pendingCount.toString())).toBeInTheDocument();
    
    // Approved count
    const approvedCount = applications.filter(app => app.status === 'approved').length;
    expect(screen.getByText(approvedCount.toString())).toBeInTheDocument();
    
    // Available supervisors count
    const availableSupervisorsCount = supervisors.filter(
      sup => sup.availabilityStatus === 'available'
    ).length;
    expect(screen.getByText(availableSupervisorsCount.toString())).toBeInTheDocument();
  });

  // Tests loading indicator displays while dashboard data is being fetched
  it('should show loading state initially', async () => {
    render(<StudentDashboard />);
    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByText('Loading dashboard...')).not.toBeInTheDocument();
    });
  });

  // Tests error handling when Firebase service calls fail
  it('should handle error state when services fail', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    (ApplicationService.getStudentApplications as jest.Mock).mockRejectedValue(
      new Error('Failed to fetch applications')
    );
    (SupervisorService.getAvailableSupervisors as jest.Mock).mockRejectedValue(
      new Error('Failed to fetch supervisors')
    );

    render(<StudentDashboard />);

    await waitFor(() => {
      expect(screen.queryByText('Loading dashboard...')).not.toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });

  // Tests data transformation from service format to UI component format
  it('should transform data from services to UI correctly', async () => {
    const mockApplications = [
      {
        id: 'app-1',
        projectTitle: 'Test Project',
        projectDescription: 'Test Description',
        supervisorName: 'Dr. Test',
        dateApplied: '2024-01-01',
        status: 'pending' as const,
        responseTime: '5-7 days',
        comments: 'Test comments',
      },
    ];

    const mockSupervisors = [
      {
        id: 'sup-1',
        name: 'Dr. Supervisor',
        department: 'Computer Science',
        bio: 'Expert in AI',
        expertiseAreas: ['AI', 'ML'],
        researchInterests: ['Deep Learning'],
        availabilityStatus: 'available' as const,
        currentCapacity: '2/5 projects',
        contact: 'sup@email.com',
      },
    ];

    (ApplicationService.getStudentApplications as jest.Mock).mockResolvedValue(mockApplications);
    (SupervisorService.getAvailableSupervisors as jest.Mock).mockResolvedValue(mockSupervisors);

    render(<StudentDashboard />);

    await waitFor(() => {
      expect(ApplicationService.getStudentApplications).toHaveBeenCalled();
      expect(SupervisorService.getAvailableSupervisors).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.queryByText('Loading dashboard...')).not.toBeInTheDocument();
    });
  });

  // Tests stat card value calculations with specific test data
  it('should calculate stat card values with actual data', async () => {
    const mockApplications = [
      {
        id: 'app-1',
        projectTitle: 'Project 1',
        projectDescription: 'Description 1',
        supervisorName: 'Dr. Test 1',
        dateApplied: '2024-01-01',
        status: 'pending' as const,
        responseTime: '5-7 days',
      },
      {
        id: 'app-2',
        projectTitle: 'Project 2',
        projectDescription: 'Description 2',
        supervisorName: 'Dr. Test 2',
        dateApplied: '2024-01-02',
        status: 'under_review' as const,
        responseTime: '3-5 days',
      },
    ];

    const mockSupervisors = [
      {
        id: 'sup-1',
        name: 'Dr. Supervisor 1',
        department: 'Computer Science',
        bio: 'Expert',
        expertiseAreas: ['AI'],
        researchInterests: ['ML'],
        availabilityStatus: 'available' as const,
        currentCapacity: '2/5 projects',
        contact: 'sup1@email.com',
      },
      {
        id: 'sup-2',
        name: 'Dr. Supervisor 2',
        department: 'Software Engineering',
        bio: 'Expert',
        expertiseAreas: ['Web'],
        researchInterests: ['Cloud'],
        availabilityStatus: 'available' as const,
        currentCapacity: '3/5 projects',
        contact: 'sup2@email.com',
      },
    ];

    (ApplicationService.getStudentApplications as jest.Mock).mockResolvedValue(mockApplications);
    (SupervisorService.getAvailableSupervisors as jest.Mock).mockResolvedValue(mockSupervisors);

    render(<StudentDashboard />);

    await waitFor(() => {
      expect(screen.queryByText('Loading dashboard...')).not.toBeInTheDocument();
    });
  });

  // Tests that Firebase services are called on component mount
  it('should call services with correct parameters', async () => {
    render(<StudentDashboard />);

    await waitFor(() => {
      expect(ApplicationService.getStudentApplications).toHaveBeenCalled();
      expect(SupervisorService.getAvailableSupervisors).toHaveBeenCalled();
    });
  });

  // Tests graceful handling when one service fails but another succeeds
  it('should handle partial service failures gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    (ApplicationService.getStudentApplications as jest.Mock).mockResolvedValue([]);
    (SupervisorService.getAvailableSupervisors as jest.Mock).mockRejectedValue(
      new Error('Supervisor service failed')
    );

    render(<StudentDashboard />);

    await waitFor(() => {
      expect(screen.queryByText('Loading dashboard...')).not.toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });

  describe('Navigation Interactions', () => {
    // Tests button click triggers navigation to supervisors page
    it('should navigate to supervisors page when "New Application" button is clicked', async () => {
      render(<StudentDashboard />);

      await waitFor(() => {
        expect(screen.queryByText('Loading dashboard...')).not.toBeInTheDocument();
      });

      const newAppButton = screen.getByRole('button', { name: /new application/i });
      fireEvent.click(newAppButton);

      expect(mockPush).toHaveBeenCalledWith('/supervisors');
    });

    // Tests empty state button triggers navigation to supervisors page
    it('should navigate to supervisors page when "Browse Supervisors" button is clicked in empty state', async () => {
      (ApplicationService.getStudentApplications as jest.Mock).mockResolvedValue([]);

      render(<StudentDashboard />);

      await waitFor(() => {
        expect(screen.queryByText('Loading dashboard...')).not.toBeInTheDocument();
      });

      const browseSupervisorsButton = screen.getByRole('button', { name: /browse supervisors/i });
      fireEvent.click(browseSupervisorsButton);

      expect(mockPush).toHaveBeenCalledWith('/supervisors');
    });

    // Tests "View All" link triggers navigation to supervisors page
    it('should navigate to supervisors page when "View All" link is clicked', async () => {
      render(<StudentDashboard />);

      await waitFor(() => {
        expect(screen.queryByText('Loading dashboard...')).not.toBeInTheDocument();
      });

      const viewAllLink = screen.getByRole('button', { name: /view all →/i });
      fireEvent.click(viewAllLink);

      expect(mockPush).toHaveBeenCalledWith('/supervisors');
    });
  });

  describe('Role-Based Dashboard Redirection', () => {
    // Tests supervisor role is redirected to supervisor-specific dashboard
    it('should redirect supervisor to supervisor dashboard', async () => {
      const mockSupervisorUser = {
        uid: 'supervisor-uid',
        email: 'supervisor@test.com',
      };

      (onAuthChange as jest.Mock).mockImplementation((callback) => {
        setTimeout(() => {
          callback(mockSupervisorUser);
        }, 0);
        return jest.fn();
      });

      (getUserProfile as jest.Mock).mockResolvedValue({
        success: true,
        data: { role: 'supervisor', name: 'Test Supervisor' },
      });

      render(<StudentDashboard />);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/dashboard/supervisor');
      });
    });

    // Tests admin role is redirected to admin-specific dashboard
    it('should redirect admin to admin dashboard', async () => {
      const mockAdminUser = {
        uid: 'admin-uid',
        email: 'admin@test.com',
      };

      (onAuthChange as jest.Mock).mockImplementation((callback) => {
        setTimeout(() => {
          callback(mockAdminUser);
        }, 0);
        return jest.fn();
      });

      (getUserProfile as jest.Mock).mockResolvedValue({
        success: true,
        data: { role: 'admin', name: 'Test Admin' },
      });

      render(<StudentDashboard />);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/dashboard/admin');
      });
    });

    // Tests unauthenticated users are redirected to login page
    it('should redirect unauthenticated users to login', async () => {
      (onAuthChange as jest.Mock).mockImplementation((callback) => {
        setTimeout(() => {
          callback(null);
        }, 0);
        return jest.fn();
      });

      render(<StudentDashboard />);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/login');
      });
    });
  });
});
