import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { signOut, onAuthChange, getUserProfile } from '@/lib/auth';
import Header from '../Header';
import { users } from '@/mock-data';

// Mock Next.js navigation and Link
jest.mock('next/navigation', () => ({
  usePathname: () => '/',
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

// Mock Next.js Image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...props} />;
  },
}));

// Mock auth
jest.mock('@/lib/auth', () => ({
  signOut: jest.fn(),
  onAuthChange: jest.fn(),
  getUserProfile: jest.fn(),
}));

describe('[Component] Header', () => {
  // Use mock data directly from the mock-data folder
  const mockStudent = users.find(u => u.role === 'student');

  // Ensure mock data exists
  if (!mockStudent) {
    throw new Error('Mock student data is missing. Please check mock-data/data/users.ts');
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Tests authenticated user's name displays in header
  it('should show user avatar when authenticated', async () => {
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

    render(<Header />);

    await waitFor(() => {
      expect(screen.getByText(new RegExp(mockStudent.name, 'i'))).toBeInTheDocument();
    });
  });

  // Tests dropdown menu displays when user avatar is clicked
  it('should show dropdown menu when avatar is clicked', async () => {
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

    render(<Header />);

    await waitFor(() => {
      const avatarButton = screen.getByText(new RegExp(mockStudent.name, 'i')).closest('button');
      if (avatarButton) {
        fireEvent.click(avatarButton);
        expect(screen.getByText(/view profile/i)).toBeInTheDocument();
      }
    });
  });

  // Tests signOut service is called when logout button is clicked
  it('should call signOut function when logout button is clicked', async () => {
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

    render(<Header />);

    // Wait for the user name to appear
    await waitFor(() => {
      expect(screen.getByText(new RegExp(mockStudent.name, 'i'))).toBeInTheDocument();
    });

    // Find and click the avatar button
    const avatarButton = screen.getByText(new RegExp(mockStudent.name, 'i')).closest('button');
    expect(avatarButton).toBeTruthy();
    if (avatarButton) {
      fireEvent.click(avatarButton);
      
      // Wait for logout button to appear
      await waitFor(() => {
        expect(screen.getByText(/logout/i)).toBeInTheDocument();
      });
      
      const logoutButton = screen.getByText(/logout/i);
      fireEvent.click(logoutButton);
      expect(signOut).toHaveBeenCalled();
    }
  });

  // Tests dropdown menu closes when clicking outside
  it('should close dropdown when clicking outside', async () => {
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

    render(<Header />);

    // Wait for the user name to appear
    await waitFor(() => {
      expect(screen.getByText(new RegExp(mockStudent.name, 'i'))).toBeInTheDocument();
    });

    // Find and click the avatar button
    const avatarButton = screen.getByText(new RegExp(mockStudent.name, 'i')).closest('button');
    expect(avatarButton).toBeTruthy();
    if (avatarButton) {
      fireEvent.click(avatarButton);
      
      // Wait for dropdown to appear
      await waitFor(() => {
        expect(screen.getByText(/view profile/i)).toBeInTheDocument();
      });
      
      // Click outside
      fireEvent.mouseDown(document.body);
      
      // Wait for dropdown to close and verify
      await waitFor(() => {
        expect(screen.queryByText(/view profile/i)).not.toBeInTheDocument();
      });
    }
  });

  // Tests user section hidden when not authenticated
  it('should not show user section when not authenticated', () => {
    (onAuthChange as jest.Mock).mockImplementation((callback) => {
      callback(null);
      return jest.fn();
    });

    render(<Header />);

    expect(screen.queryByText(/view profile/i)).not.toBeInTheDocument();
  });
});

