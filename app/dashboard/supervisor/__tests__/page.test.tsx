import { render, screen, waitFor } from '@testing-library/react';
import { useSupervisorAuth } from '@/lib/hooks';
import { apiClient } from '@/lib/api/client';
import { auth } from '@/lib/firebase';
import SupervisorDashboard from '../page';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

// Mock supervisor auth hook
jest.mock('@/lib/hooks', () => ({
  useSupervisorAuth: jest.fn(),
}));

// Mock API client
jest.mock('@/lib/api/client', () => ({
  apiClient: {
    getSupervisorById: jest.fn(),
    getSupervisorApplications: jest.fn(),
    getSupervisorProjects: jest.fn(),
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

describe('[Page] Supervisor Dashboard', () => {
  const mockSupervisor = {
    id: 'sup-001',
    fullName: 'Dr. Smith',
    email: 'smith@test.com',
    department: 'Computer Science',
    researchInterests: ['AI', 'ML'],
    expertiseAreas: ['Machine Learning'],
    bio: 'Experienced researcher',
    availabilityStatus: 'available' as const,
    currentCapacity: 2,
    maxCapacity: 5,
  };

  const mockApplications = [
    {
      id: 'app-001',
      studentId: 'stu-001',
      supervisorId: 'sup-001',
      projectTitle: 'AI Research',
      projectDescription: 'ML Project',
      supervisorName: 'Dr. Smith',
      dateApplied: new Date('2024-01-15'),
      status: 'pending' as const,
      responseTime: '5-7 business days',
    },
  ];

  const mockProjects = [
    {
      id: 'proj-001',
      title: 'AI Research',
      description: 'ML Project',
      supervisorId: 'sup-001',
      studentId: 'stu-001',
      status: 'approved' as const,
      startDate: new Date('2024-01-01'),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock token retrieval
    (auth.currentUser!.getIdToken as jest.Mock).mockResolvedValue('mock-token');
  });

  it('shows loading state while fetching data', () => {
    (useSupervisorAuth as jest.Mock).mockReturnValue({
      userId: null,
      userProfile: null,
      isAuthLoading: true,
    });

    render(<SupervisorDashboard />);
    expect(screen.getByText(/loading dashboard/i)).toBeInTheDocument();
  });

  it('fetches and displays dashboard data for authenticated supervisor', async () => {
    (useSupervisorAuth as jest.Mock).mockReturnValue({
      userId: mockSupervisor.id,
      userProfile: { name: mockSupervisor.fullName, role: 'supervisor' },
      isAuthLoading: false,
    });

    (apiClient.getSupervisorById as jest.Mock).mockResolvedValue({
      success: true,
      data: mockSupervisor,
    });

    (apiClient.getSupervisorApplications as jest.Mock).mockResolvedValue({
      success: true,
      data: mockApplications,
      count: 1,
    });

    (apiClient.getSupervisorProjects as jest.Mock).mockResolvedValue({
      success: true,
      data: mockProjects,
      count: 1,
    });

    render(<SupervisorDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/supervisor dashboard/i)).toBeInTheDocument();
    });

    // Verify API client was called with token
    await waitFor(() => {
      expect(apiClient.getSupervisorById).toHaveBeenCalledWith(
        mockSupervisor.id,
        'mock-token'
      );
      expect(apiClient.getSupervisorApplications).toHaveBeenCalledWith(
        mockSupervisor.id,
        'mock-token'
      );
      expect(apiClient.getSupervisorProjects).toHaveBeenCalledWith(
        mockSupervisor.id,
        'mock-token'
      );
    });

    // Verify data is displayed
    expect(screen.getByText(/AI Research/i)).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    (useSupervisorAuth as jest.Mock).mockReturnValue({
      userId: mockSupervisor.id,
      userProfile: { name: mockSupervisor.fullName, role: 'supervisor' },
      isAuthLoading: false,
    });

    (apiClient.getSupervisorById as jest.Mock).mockRejectedValue(
      new Error('API error')
    );

    (apiClient.getSupervisorApplications as jest.Mock).mockRejectedValue(
      new Error('API error')
    );

    (apiClient.getSupervisorProjects as jest.Mock).mockRejectedValue(
      new Error('API error')
    );

    render(<SupervisorDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load some dashboard data/i)).toBeInTheDocument();
    });
  });

  it('redirects to login if no token is available', async () => {
    const mockRouter = { push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() };
    jest.spyOn(require('next/navigation'), 'useRouter').mockReturnValue(mockRouter);

    (useSupervisorAuth as jest.Mock).mockReturnValue({
      userId: mockSupervisor.id,
      userProfile: { name: mockSupervisor.fullName, role: 'supervisor' },
      isAuthLoading: false,
    });

    // Mock no token available
    (auth.currentUser!.getIdToken as jest.Mock).mockResolvedValue(null);

    render(<SupervisorDashboard />);

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/login');
    });
  });

  it('displays capacity indicator correctly', async () => {
    (useSupervisorAuth as jest.Mock).mockReturnValue({
      userId: mockSupervisor.id,
      userProfile: { name: mockSupervisor.fullName, role: 'supervisor' },
      isAuthLoading: false,
    });

    (apiClient.getSupervisorById as jest.Mock).mockResolvedValue({
      success: true,
      data: mockSupervisor,
    });

    (apiClient.getSupervisorApplications as jest.Mock).mockResolvedValue({
      success: true,
      data: [],
      count: 0,
    });

    (apiClient.getSupervisorProjects as jest.Mock).mockResolvedValue({
      success: true,
      data: [],
      count: 0,
    });

    render(<SupervisorDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/2 \/ 5 students/i)).toBeInTheDocument();
    });
  });

  it('calculates pending applications count correctly', async () => {
    const mixedApplications = [
      { ...mockApplications[0], status: 'pending' as const },
      { ...mockApplications[0], id: 'app-002', status: 'under_review' as const },
      { ...mockApplications[0], id: 'app-003', status: 'approved' as const },
    ];

    (useSupervisorAuth as jest.Mock).mockReturnValue({
      userId: mockSupervisor.id,
      userProfile: { name: mockSupervisor.fullName, role: 'supervisor' },
      isAuthLoading: false,
    });

    (apiClient.getSupervisorById as jest.Mock).mockResolvedValue({
      success: true,
      data: mockSupervisor,
    });

    (apiClient.getSupervisorApplications as jest.Mock).mockResolvedValue({
      success: true,
      data: mixedApplications,
      count: 3,
    });

    (apiClient.getSupervisorProjects as jest.Mock).mockResolvedValue({
      success: true,
      data: [],
      count: 0,
    });

    render(<SupervisorDashboard />);

    await waitFor(() => {
      // Total applications: 3
      expect(screen.getByText('3')).toBeInTheDocument();
      // Pending review: 2 (pending + under_review)
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });
});

