import { render, screen, waitFor } from '@testing-library/react';
import { onAuthChange, getUserProfile } from '@/lib/auth';
import { apiClient } from '@/lib/api/client';
import { auth } from '@/lib/firebase';
import AdminDashboard from '../page';

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
    getAdminStats: jest.fn(),
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

describe('[Page] Admin Dashboard', () => {
  const mockAdmin = {
    id: 'admin-001',
    email: 'admin@test.com',
    name: 'Admin User',
    role: 'admin',
  };

  const mockStats = {
    totalStudents: 25,
    totalSupervisors: 10,
    totalProjects: 15,
    pendingApplications: 8,
  };

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

    render(<AdminDashboard />);
    expect(screen.getByText(/loading admin dashboard/i)).toBeInTheDocument();
  });

  it('fetches and displays admin statistics', async () => {
    const mockUser = {
      uid: mockAdmin.id,
      email: mockAdmin.email,
    };

    (onAuthChange as jest.Mock).mockImplementation((callback) => {
      setTimeout(() => {
        callback(mockUser);
      }, 0);
      return jest.fn();
    });

    (getUserProfile as jest.Mock).mockResolvedValue({
      success: true,
      data: mockAdmin,
    });

    (apiClient.getAdminStats as jest.Mock).mockResolvedValue({
      success: true,
      data: mockStats,
    });

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/admin dashboard/i)).toBeInTheDocument();
    });

    // Verify API client was called with token
    await waitFor(() => {
      expect(apiClient.getAdminStats).toHaveBeenCalledWith('mock-token');
    });

    // Verify stats are displayed
    expect(screen.getByText('25')).toBeInTheDocument(); // Total Students
    expect(screen.getByText('10')).toBeInTheDocument(); // Total Supervisors
    expect(screen.getByText('15')).toBeInTheDocument(); // Active Projects
    expect(screen.getByText('8')).toBeInTheDocument(); // Pending Applications
  });

  it('redirects non-admin users', async () => {
    const mockRouter = { push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() };
    jest.spyOn(require('next/navigation'), 'useRouter').mockReturnValue(mockRouter);

    const mockUser = {
      uid: 'user-001',
      email: 'user@test.com',
    };

    const nonAdminUser = {
      ...mockAdmin,
      role: 'student',
    };

    (onAuthChange as jest.Mock).mockImplementation((callback) => {
      setTimeout(() => {
        callback(mockUser);
      }, 0);
      return jest.fn();
    });

    (getUserProfile as jest.Mock).mockResolvedValue({
      success: true,
      data: nonAdminUser,
    });

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/');
    });
  });

  it('redirects unauthenticated users', async () => {
    const mockRouter = { push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() };
    jest.spyOn(require('next/navigation'), 'useRouter').mockReturnValue(mockRouter);

    (onAuthChange as jest.Mock).mockImplementation((callback) => {
      setTimeout(() => {
        callback(null);
      }, 0);
      return jest.fn();
    });

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/');
    });
  });

  it('handles API errors gracefully', async () => {
    const mockUser = {
      uid: mockAdmin.id,
      email: mockAdmin.email,
    };

    (onAuthChange as jest.Mock).mockImplementation((callback) => {
      setTimeout(() => {
        callback(mockUser);
      }, 0);
      return jest.fn();
    });

    (getUserProfile as jest.Mock).mockResolvedValue({
      success: true,
      data: mockAdmin,
    });

    (apiClient.getAdminStats as jest.Mock).mockRejectedValue(
      new Error('API error')
    );

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load statistics/i)).toBeInTheDocument();
    });

    // Verify retry button is present
    expect(screen.getByText(/retry/i)).toBeInTheDocument();
  });

  it('redirects to login if no token is available', async () => {
    const mockRouter = { push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() };
    jest.spyOn(require('next/navigation'), 'useRouter').mockReturnValue(mockRouter);

    const mockUser = {
      uid: mockAdmin.id,
      email: mockAdmin.email,
    };

    (onAuthChange as jest.Mock).mockImplementation((callback) => {
      setTimeout(() => {
        callback(mockUser);
      }, 0);
      return jest.fn();
    });

    (getUserProfile as jest.Mock).mockResolvedValue({
      success: true,
      data: mockAdmin,
    });

    // Mock no token available
    (auth.currentUser!.getIdToken as jest.Mock).mockResolvedValue(null);

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/login');
    });
  });

  it('displays placeholder when stats are not loaded', async () => {
    const mockUser = {
      uid: mockAdmin.id,
      email: mockAdmin.email,
    };

    (onAuthChange as jest.Mock).mockImplementation((callback) => {
      setTimeout(() => {
        callback(mockUser);
      }, 0);
      return jest.fn();
    });

    (getUserProfile as jest.Mock).mockResolvedValue({
      success: true,
      data: mockAdmin,
    });

    (apiClient.getAdminStats as jest.Mock).mockResolvedValue({
      success: true,
      data: null,
    });

    render(<AdminDashboard />);

    // Wait for the stats section to be visible (after loading completes)
    await waitFor(() => {
      expect(screen.getByText(/total students/i)).toBeInTheDocument();
    });

    // Check for placeholders
    const placeholders = screen.getAllByText('-');
    expect(placeholders.length).toBeGreaterThan(0);
  });

  it('displays database seeder button', async () => {
    const mockUser = {
      uid: mockAdmin.id,
      email: mockAdmin.email,
    };

    (onAuthChange as jest.Mock).mockImplementation((callback) => {
      setTimeout(() => {
        callback(mockUser);
      }, 0);
      return jest.fn();
    });

    (getUserProfile as jest.Mock).mockResolvedValue({
      success: true,
      data: mockAdmin,
    });

    (apiClient.getAdminStats as jest.Mock).mockResolvedValue({
      success: true,
      data: mockStats,
    });

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/database seeder/i)).toBeInTheDocument();
    });
  });
});

