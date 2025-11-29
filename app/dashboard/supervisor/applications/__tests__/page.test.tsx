import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useSupervisorAuth } from '@/lib/hooks';
import { apiClient } from '@/lib/api/client';
import { auth } from '@/lib/firebase';
import SupervisorApplicationsPage from '../page';

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
    getSupervisorApplications: jest.fn(),
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

describe('[Page] Supervisor Applications', () => {
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
    {
      id: 'app-002',
      studentId: 'stu-002',
      supervisorId: 'sup-001',
      projectTitle: 'Web Development',
      projectDescription: 'React Project',
      supervisorName: 'Dr. Smith',
      dateApplied: new Date('2024-01-16'),
      status: 'under_review' as const,
      responseTime: '5-7 business days',
    },
    {
      id: 'app-003',
      studentId: 'stu-003',
      supervisorId: 'sup-001',
      projectTitle: 'Data Science',
      projectDescription: 'Analytics Project',
      supervisorName: 'Dr. Smith',
      dateApplied: new Date('2024-01-17'),
      status: 'approved' as const,
      responseTime: '5-7 business days',
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
      isAuthLoading: true,
    });

    render(<SupervisorApplicationsPage />);
    expect(screen.getByText(/loading applications/i)).toBeInTheDocument();
  });

  it('fetches and displays applications', async () => {
    (useSupervisorAuth as jest.Mock).mockReturnValue({
      userId: 'sup-001',
      isAuthLoading: false,
    });

    (apiClient.getSupervisorApplications as jest.Mock).mockResolvedValue({
      success: true,
      data: mockApplications,
      count: 3,
    });

    render(<SupervisorApplicationsPage />);

    await waitFor(() => {
      expect(screen.getByText(/applications/i)).toBeInTheDocument();
    });

    // Verify API client was called with token
    expect(apiClient.getSupervisorApplications).toHaveBeenCalledWith(
      'sup-001',
      'mock-token'
    );

    // Verify applications are displayed
    expect(screen.getByText(/AI Research/i)).toBeInTheDocument();
    expect(screen.getByText(/Web Development/i)).toBeInTheDocument();
    expect(screen.getByText(/Data Science/i)).toBeInTheDocument();
  });

  it('filters applications by status', async () => {
    (useSupervisorAuth as jest.Mock).mockReturnValue({
      userId: 'sup-001',
      isAuthLoading: false,
    });

    (apiClient.getSupervisorApplications as jest.Mock).mockResolvedValue({
      success: true,
      data: mockApplications,
      count: 3,
    });

    render(<SupervisorApplicationsPage />);

    await waitFor(() => {
      expect(screen.getByText(/AI Research/i)).toBeInTheDocument();
    });

    // Click on "Pending" filter
    const pendingButton = screen.getByText(/Pending \(1\)/i);
    fireEvent.click(pendingButton);

    // Should only show pending applications
    expect(screen.getByText(/AI Research/i)).toBeInTheDocument();
    expect(screen.queryByText(/Web Development/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Data Science/i)).not.toBeInTheDocument();
  });

  it('displays correct status counts', async () => {
    (useSupervisorAuth as jest.Mock).mockReturnValue({
      userId: 'sup-001',
      isAuthLoading: false,
    });

    (apiClient.getSupervisorApplications as jest.Mock).mockResolvedValue({
      success: true,
      data: mockApplications,
      count: 3,
    });

    render(<SupervisorApplicationsPage />);

    await waitFor(() => {
      expect(screen.getByText(/All \(3\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Pending \(1\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Under Review \(1\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Approved \(1\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Rejected \(0\)/i)).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    (useSupervisorAuth as jest.Mock).mockReturnValue({
      userId: 'sup-001',
      isAuthLoading: false,
    });

    (apiClient.getSupervisorApplications as jest.Mock).mockRejectedValue(
      new Error('API error')
    );

    render(<SupervisorApplicationsPage />);

    await waitFor(() => {
      expect(screen.getByText(/unable to load applications/i)).toBeInTheDocument();
    });
  });

  it('redirects to login if no token is available', async () => {
    const mockRouter = { push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() };
    jest.spyOn(require('next/navigation'), 'useRouter').mockReturnValue(mockRouter);

    (useSupervisorAuth as jest.Mock).mockReturnValue({
      userId: 'sup-001',
      isAuthLoading: false,
    });

    // Mock no token available
    (auth.currentUser!.getIdToken as jest.Mock).mockResolvedValue(null);

    render(<SupervisorApplicationsPage />);

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/login');
    });
  });

  it('displays empty state when no applications exist', async () => {
    (useSupervisorAuth as jest.Mock).mockReturnValue({
      userId: 'sup-001',
      isAuthLoading: false,
    });

    (apiClient.getSupervisorApplications as jest.Mock).mockResolvedValue({
      success: true,
      data: [],
      count: 0,
    });

    render(<SupervisorApplicationsPage />);

    await waitFor(() => {
      expect(screen.getByText(/no applications received yet/i)).toBeInTheDocument();
    });
  });
});

