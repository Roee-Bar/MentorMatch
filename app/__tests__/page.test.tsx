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

  it('should render landing page for unauthenticated users', async () => {
    (onAuthChange as jest.Mock).mockImplementation((callback) => {
      callback(null);
      return jest.fn(); // unsubscribe function
    });

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText(/find your perfect project supervisor/i)).toBeInTheDocument();
    });
  });

  it('should show hero section with "Sign Up" and "Login" buttons', async () => {
    (onAuthChange as jest.Mock).mockImplementation((callback) => {
      callback(null);
      return jest.fn();
    });

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /sign up as student/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
    });
  });

  it('should have "Sign Up" button that links to "/register"', async () => {
    (onAuthChange as jest.Mock).mockImplementation((callback) => {
      callback(null);
      return jest.fn();
    });

    render(<Home />);

    await waitFor(() => {
      const signUpLink = screen.getByRole('link', { name: /sign up as student/i });
      expect(signUpLink).toHaveAttribute('href', '/register');
    });
  });

  it('should have "Login" button that links to "/login"', async () => {
    (onAuthChange as jest.Mock).mockImplementation((callback) => {
      callback(null);
      return jest.fn();
    });

    render(<Home />);

    await waitFor(() => {
      const loginLink = screen.getByRole('link', { name: /login/i });
      expect(loginLink).toHaveAttribute('href', '/login');
    });
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

  it('should display correct content based on auth state', async () => {
    (onAuthChange as jest.Mock).mockImplementation((callback) => {
      callback(null);
      return jest.fn();
    });

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText(/connect with experienced supervisors/i)).toBeInTheDocument();
    });
  });
});

