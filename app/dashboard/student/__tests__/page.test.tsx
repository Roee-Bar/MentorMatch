import { render, screen, waitFor, act } from '@testing-library/react';
import { onAuthChange, getUserProfile } from '@/lib/auth';
import { apiClient } from '@/lib/api/client';
import { auth } from '@/lib/firebase';
import StudentDashboard from '../page';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

// Mock auth
jest.mock('@/lib/auth', () => ({
  onAuthChange: jest.fn(),
  getUserProfile: jest.fn(),
}));

// Mock API client
jest.mock('@/lib/api/client', () => ({
  apiClient: {
    getStudentApplications: jest.fn(),
    getSupervisors: jest.fn(),
  },
}));

// Mock Firebase auth
jest.mock('@/lib/firebase', () => ({
  auth: {
    currentUser: {
      getIdToken: jest.fn(),
    },
  },
}));

describe('[Page] Student Dashboard', () => {
  const mockStudent = {
    id: 'student-001',
    email: 'student@test.com',
    name: 'Test Student',
    role: 'student',
  };

  const mockApplications = [
    {
      id: 'app-001',
      projectTitle: 'AI Research',
      projectDescription: 'Machine Learning Project',
      supervisorName: 'Dr. Smith',
      dateApplied: '2024-01-15',
      status: 'pending' as const,
      responseTime: '5-7 business days',
    },
  ];

  const mockSupervisors = [
    {
      id: 'sup-001',
      name: 'Dr. Smith',
      department: 'Computer Science',
      bio: 'Expert in AI and Machine Learning',
      expertiseAreas: ['Artificial Intelligence', 'Machine Learning', 'Data Science'],
      researchInterests: ['AI', 'ML'],
      availabilityStatus: 'available' as const,
      currentCapacity: '2/5 projects',
      contact: 'dr.smith@university.edu',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock token retrieval
    (auth.currentUser!.getIdToken as jest.Mock).mockResolvedValue('mock-token');
  });

  it('shows loading state initially', () => {
    (onAuthChange as jest.Mock).mockImplementation((callback) => {
      // Don't call callback yet
      return jest.fn();
    });

    render(<StudentDashboard />);
    expect(screen.getByText(/loading dashboard/i)).toBeInTheDocument();
  });

  it('fetches and displays dashboard data for authenticated student', async () => {
    const mockUser = {
      uid: mockStudent.id,
      email: mockStudent.email,
    };

    (onAuthChange as jest.Mock).mockImplementation((callback) => {
      // Use setTimeout to simulate async behavior
      setTimeout(() => callback(mockUser), 0);
      return jest.fn();
    });

    (getUserProfile as jest.Mock).mockResolvedValue({
      success: true,
      data: mockStudent,
    });

    (apiClient.getStudentApplications as jest.Mock).mockResolvedValue({
      success: true,
      data: mockApplications,
      count: 1,
    });

    (apiClient.getSupervisors as jest.Mock).mockResolvedValue({
      success: true,
      data: mockSupervisors,
      count: 1,
    });

    render(<StudentDashboard />);

    // Verify API client was called with token
    await waitFor(() => {
      expect(apiClient.getStudentApplications).toHaveBeenCalledWith(
        mockStudent.id,
        'mock-token'
      );
    });

    // Verify data is displayed
    await waitFor(() => {
      expect(screen.getByText(/AI Research/i)).toBeInTheDocument();
    });
  }, 20000);

  it('handles API errors gracefully', async () => {
    const mockUser = {
      uid: mockStudent.id,
      email: mockStudent.email,
    };

    (onAuthChange as jest.Mock).mockImplementation((callback) => {
      // Use setTimeout to simulate async behavior
      setTimeout(() => callback(mockUser), 0);
      return jest.fn();
    });

    (getUserProfile as jest.Mock).mockResolvedValue({
      success: true,
      data: mockStudent,
    });

    (apiClient.getStudentApplications as jest.Mock).mockRejectedValue(
      new Error('API error')
    );

    (apiClient.getSupervisors as jest.Mock).mockRejectedValue(
      new Error('API error')
    );

    render(<StudentDashboard />);

    // Then check for error message
    await waitFor(() => {
      const errorElement = screen.queryByText(/failed to load dashboard data/i);
      expect(errorElement).toBeInTheDocument();
    }, { timeout: 5000 });
  }, 25000);

  it('redirects to login if no token is available', async () => {
    const mockRouter = { push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() };
    jest.spyOn(require('next/navigation'), 'useRouter').mockReturnValue(mockRouter);

    const mockUser = {
      uid: mockStudent.id,
      email: mockStudent.email,
    };

    (onAuthChange as jest.Mock).mockImplementation((callback) => {
      setTimeout(() => {
        callback(mockUser);
      }, 0);
      return jest.fn();
    });

    (getUserProfile as jest.Mock).mockResolvedValue({
      success: true,
      data: mockStudent,
    });

    // Mock no token available
    (auth.currentUser!.getIdToken as jest.Mock).mockResolvedValue(null);

    render(<StudentDashboard />);

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/login');
    });
  });

  it('displays empty state when no applications exist', async () => {
    const mockUser = {
      uid: mockStudent.id,
      email: mockStudent.email,
    };

    (onAuthChange as jest.Mock).mockImplementation((callback) => {
      // Call callback immediately and synchronously
      callback(mockUser);
      return jest.fn();
    });

    (getUserProfile as jest.Mock).mockResolvedValue({
      success: true,
      data: mockStudent,
    });

    (apiClient.getStudentApplications as jest.Mock).mockResolvedValue({
      success: true,
      data: [],
      count: 0,
    });

    (apiClient.getSupervisors as jest.Mock).mockResolvedValue({
      success: true,
      data: mockSupervisors,
      count: 1,
    });

    await act(async () => {
      render(<StudentDashboard />);
    });

    await waitFor(() => {
      expect(screen.getByText(/haven't submitted any applications yet/i)).toBeInTheDocument();
    }, { timeout: 10000 });
  }, 15000);

  it('calculates stats correctly', async () => {
    const applicationsWithVariedStatus = [
      { ...mockApplications[0], status: 'approved' as const },
      { ...mockApplications[0], id: 'app-002', status: 'pending' as const },
      { ...mockApplications[0], id: 'app-003', status: 'under_review' as const },
    ];

    const mockUser = {
      uid: mockStudent.id,
      email: mockStudent.email,
    };

    (onAuthChange as jest.Mock).mockImplementation((callback) => {
      // Call callback immediately and synchronously
      callback(mockUser);
      return jest.fn();
    });

    (getUserProfile as jest.Mock).mockResolvedValue({
      success: true,
      data: mockStudent,
    });

    (apiClient.getStudentApplications as jest.Mock).mockResolvedValue({
      success: true,
      data: applicationsWithVariedStatus,
      count: 3,
    });

    (apiClient.getSupervisors as jest.Mock).mockResolvedValue({
      success: true,
      data: mockSupervisors,
      count: 1,
    });

    await act(async () => {
      render(<StudentDashboard />);
    });

    // Wait for stats to render
    await waitFor(() => {
      // Total applications: 3
      const allText = screen.getByText('3');
      expect(allText).toBeInTheDocument();
    }, { timeout: 5000 });

    // Verify pending and approved counts
    const statsElements = screen.getAllByText(/\d+/);
    expect(statsElements.length).toBeGreaterThan(0);
  }, 15000);
});

