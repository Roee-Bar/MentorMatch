import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { onAuthChange, getUserProfile } from '@/lib/auth';
import Home from '../page';

// Mock Next.js navigation
const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  usePathname: () => '/',
}));

// Mock auth
jest.mock('@/lib/auth', () => ({
  onAuthChange: jest.fn(),
  getUserProfile: jest.fn(),
}));

describe('Home Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should redirect authenticated users to "/dashboard"', async () => {
    const mockUser = {
      uid: 'test-uid',
      email: 'test@example.com',
    };

    (onAuthChange as jest.Mock).mockImplementation((callback) => {
      setTimeout(() => {
        callback(mockUser);
      }, 0);
      return jest.fn();
    });

    (getUserProfile as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        name: 'Test User',
        email: 'test@example.com',
        role: 'student',
      },
    });

    render(<Home />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/dashboard');
    }, { timeout: 2000 });
  });

  it('should show loading state while checking authentication', () => {
    (onAuthChange as jest.Mock).mockImplementation(() => {
      // Don't call callback immediately to simulate loading
      return jest.fn();
    });

    render(<Home />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});

