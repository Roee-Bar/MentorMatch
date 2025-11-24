import { render, screen } from '@testing-library/react';
import DashboardRouter from '../page';
import { onAuthChange, getUserProfile } from '@/lib/auth';

// Mock Next.js navigation
const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

// Mock auth functions
jest.mock('@/lib/auth', () => ({
  onAuthChange: jest.fn(),
  getUserProfile: jest.fn(),
}));

describe('DashboardRouter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up default mock for onAuthChange to prevent unsubscribe errors
    (onAuthChange as jest.Mock).mockImplementation((callback) => {
      return jest.fn(); // Return unsubscribe function
    });
  });

  it('should redirect to student dashboard for student role', async () => {
    // Mock authenticated student user
    (onAuthChange as jest.Mock).mockImplementation((callback) => {
      callback({ uid: 'student123' });
      return jest.fn(); // unsubscribe function
    });
    
    (getUserProfile as jest.Mock).mockResolvedValue({
      success: true,
      data: { role: 'student' },
    });
    
    render(<DashboardRouter />);
    
    // Wait for async operations
    await screen.findByText(/redirecting to dashboard/i);
    
    expect(mockReplace).toHaveBeenCalledWith('/dashboard/student');
  });

  it('should redirect to supervisor dashboard for supervisor role', async () => {
    // Mock authenticated supervisor user
    (onAuthChange as jest.Mock).mockImplementation((callback) => {
      callback({ uid: 'supervisor123' });
      return jest.fn(); // unsubscribe function
    });
    
    (getUserProfile as jest.Mock).mockResolvedValue({
      success: true,
      data: { role: 'supervisor' },
    });
    
    render(<DashboardRouter />);
    
    // Wait for async operations
    await screen.findByText(/redirecting to dashboard/i);
    
    expect(mockReplace).toHaveBeenCalledWith('/dashboard/supervisor');
  });

  it('should redirect to admin dashboard for admin role', async () => {
    // Mock authenticated admin user
    (onAuthChange as jest.Mock).mockImplementation((callback) => {
      callback({ uid: 'admin123' });
      return jest.fn(); // unsubscribe function
    });
    
    (getUserProfile as jest.Mock).mockResolvedValue({
      success: true,
      data: { role: 'admin' },
    });
    
    render(<DashboardRouter />);
    
    // Wait for async operations
    await screen.findByText(/redirecting to dashboard/i);
    
    expect(mockReplace).toHaveBeenCalledWith('/dashboard/admin');
  });

  it('should redirect to home for unauthenticated users', async () => {
    // Mock unauthenticated user
    (onAuthChange as jest.Mock).mockImplementation((callback) => {
      callback(null);
      return jest.fn(); // unsubscribe function
    });
    
    render(<DashboardRouter />);
    
    // Wait for async operations
    await screen.findByText(/redirecting to dashboard/i);
    
    expect(mockReplace).toHaveBeenCalledWith('/');
  });
});

