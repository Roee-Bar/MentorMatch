import { render, screen, waitFor } from '@testing-library/react';
import DashboardRouter from '../page';
import { onAuthChange, getUserProfile } from '@/lib/auth';
import { useRouter } from 'next/navigation';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock auth functions
jest.mock('@/lib/auth', () => ({
  onAuthChange: jest.fn(),
  getUserProfile: jest.fn(),
}));

describe('DashboardRouter', () => {
  const mockReplace = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      replace: mockReplace,
    });
  });

  it('should redirect to student dashboard when user role is student', async () => {
    const mockUser = { uid: 'student123' };
    const mockProfile = {
      success: true,
      data: { role: 'student', name: 'Test Student' },
    };

    (onAuthChange as jest.Mock).mockImplementation((callback) => {
      callback(mockUser);
      return jest.fn();
    });
    (getUserProfile as jest.Mock).mockResolvedValue(mockProfile);

    render(<DashboardRouter />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/dashboard/student');
    });
  });

  it('should redirect to supervisor dashboard when user role is supervisor', async () => {
    const mockUser = { uid: 'supervisor123' };
    const mockProfile = {
      success: true,
      data: { role: 'supervisor', name: 'Test Supervisor' },
    };

    (onAuthChange as jest.Mock).mockImplementation((callback) => {
      callback(mockUser);
      return jest.fn();
    });
    (getUserProfile as jest.Mock).mockResolvedValue(mockProfile);

    render(<DashboardRouter />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/dashboard/supervisor');
    });
  });

  it('should redirect to admin dashboard when user role is admin', async () => {
    const mockUser = { uid: 'admin123' };
    const mockProfile = {
      success: true,
      data: { role: 'admin', name: 'Test Admin' },
    };

    (onAuthChange as jest.Mock).mockImplementation((callback) => {
      callback(mockUser);
      return jest.fn();
    });
    (getUserProfile as jest.Mock).mockResolvedValue(mockProfile);

    render(<DashboardRouter />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/dashboard/admin');
    });
  });

  it('should redirect to home when user is not authenticated', async () => {
    (onAuthChange as jest.Mock).mockImplementation((callback) => {
      callback(null);
      return jest.fn();
    });

    render(<DashboardRouter />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });

  it('should redirect to home when user profile fetch fails', async () => {
    const mockUser = { uid: 'test123' };
    const mockProfile = {
      success: false,
    };

    (onAuthChange as jest.Mock).mockImplementation((callback) => {
      callback(mockUser);
      return jest.fn();
    });
    (getUserProfile as jest.Mock).mockResolvedValue(mockProfile);

    render(<DashboardRouter />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });

  it('should render redirecting message initially', () => {
    (onAuthChange as jest.Mock).mockImplementation(() => jest.fn());
    
    render(<DashboardRouter />);
    expect(screen.getByText(/redirecting to dashboard/i)).toBeInTheDocument();
  });
});

