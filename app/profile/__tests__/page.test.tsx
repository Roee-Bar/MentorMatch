import { render, screen, waitFor } from '@testing-library/react';
import { onAuthChange } from '@/lib/auth';
import { apiClient } from '@/lib/api/client';
import { auth } from '@/lib/firebase';
import ProfilePage from '../page';

// Mock Next.js modules
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

jest.mock('next/link', () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
  MockLink.displayName = 'MockLink';
  return MockLink;
});

// Mock auth
jest.mock('@/lib/auth', () => ({
  onAuthChange: jest.fn(),
}));

// Mock API client
jest.mock('@/lib/api/client', () => ({
  apiClient: {
    getUserById: jest.fn(),
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

describe('[Page] Profile', () => {
  const mockUser = {
    id: 'user-001',
    email: 'user@test.com',
    name: 'Test User',
    role: 'student' as const,
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

    render(<ProfilePage />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('fetches and displays user profile', async () => {
    const mockAuthUser = {
      uid: mockUser.id,
      email: mockUser.email,
    };

    (onAuthChange as jest.Mock).mockImplementation((callback) => {
      setTimeout(() => {
        callback(mockAuthUser);
      }, 0);
      return jest.fn();
    });

    (apiClient.getUserById as jest.Mock).mockResolvedValue({
      success: true,
      data: mockUser,
    });

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText(/personal profile/i)).toBeInTheDocument();
    });

    // Verify API client was called with token
    expect(apiClient.getUserById).toHaveBeenCalledWith(
      mockUser.id,
      'mock-token'
    );
  });

  it('handles unauthenticated user', async () => {
    (onAuthChange as jest.Mock).mockImplementation((callback) => {
      setTimeout(() => {
        callback(null);
      }, 0);
      return jest.fn();
    });

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText(/user not found/i)).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    const mockAuthUser = {
      uid: mockUser.id,
      email: mockUser.email,
    };

    (onAuthChange as jest.Mock).mockImplementation((callback) => {
      setTimeout(() => {
        callback(mockAuthUser);
      }, 0);
      return jest.fn();
    });

    (apiClient.getUserById as jest.Mock).mockRejectedValue(
      new Error('API error')
    );

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText(/user not found/i)).toBeInTheDocument();
    });
  });

  it('handles missing token gracefully', async () => {
    const mockAuthUser = {
      uid: mockUser.id,
      email: mockUser.email,
    };

    (onAuthChange as jest.Mock).mockImplementation((callback) => {
      setTimeout(() => {
        callback(mockAuthUser);
      }, 0);
      return jest.fn();
    });

    // Mock no token available
    (auth.currentUser!.getIdToken as jest.Mock).mockResolvedValue(null);

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText(/user not found/i)).toBeInTheDocument();
    });

    // Verify getUserById was not called
    expect(apiClient.getUserById).not.toHaveBeenCalled();
  });

  it('displays header and navigation links', async () => {
    const mockAuthUser = {
      uid: mockUser.id,
      email: mockUser.email,
    };

    (onAuthChange as jest.Mock).mockImplementation((callback) => {
      setTimeout(() => {
        callback(mockAuthUser);
      }, 0);
      return jest.fn();
    });

    (apiClient.getUserById as jest.Mock).mockResolvedValue({
      success: true,
      data: mockUser,
    });

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getAllByText(/mentormatch/i).length).toBeGreaterThan(0);
    });

    // Check for navigation links
    const homeLinks = screen.getAllByText(/home/i);
    expect(homeLinks.length).toBeGreaterThan(0);
    
    expect(screen.getByText(/profile/i)).toBeInTheDocument();
  });

  it('displays footer', async () => {
    const mockAuthUser = {
      uid: mockUser.id,
      email: mockUser.email,
    };

    (onAuthChange as jest.Mock).mockImplementation((callback) => {
      setTimeout(() => {
        callback(mockAuthUser);
      }, 0);
      return jest.fn();
    });

    (apiClient.getUserById as jest.Mock).mockResolvedValue({
      success: true,
      data: mockUser,
    });

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText(/braude college of engineering/i)).toBeInTheDocument();
    });
  });
});

