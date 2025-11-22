import { render, screen, waitFor } from '@testing-library/react';
import ProfilePage from '../page';
import { users } from '@/mock-data';

// Mock Next.js Link component
jest.mock('next/link', () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
  MockLink.displayName = 'MockLink';
  return MockLink;
});

// Mock RepositoryFactory
jest.mock('@/lib/repositories/RepositoryFactory', () => ({
  RepositoryFactory: {
    getUserRepository: jest.fn(() => ({
      getCurrentUser: jest.fn(),
    })),
  },
}));

// Define test users
const testUsers = [
  {
    id: '1',
    name: 'Test Student',
    email: 'student@example.com',
    role: 'student' as const,
    profileImage: '/test.jpg',
    studentId: 'STU-001',
    degree: 'B.Sc. Software Engineering',
  },
];

describe('ProfilePage', () => {
  const mockStudent = testUsers[0];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should render loading message initially', () => {
      const { RepositoryFactory } = require('@/lib/repositories/RepositoryFactory');
      RepositoryFactory.getUserRepository.mockReturnValue({
        getCurrentUser: jest.fn().mockImplementation(
          () => new Promise(() => {}) // Never resolves
        ),
      });

      render(<ProfilePage />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should have loading state with correct styling', () => {
      const { RepositoryFactory } = require('@/lib/repositories/RepositoryFactory');
      RepositoryFactory.getUserRepository.mockReturnValue({
        getCurrentUser: jest.fn().mockImplementation(
          () => new Promise(() => {})
        ),
      });

      const { container } = render(<ProfilePage />);
      const loadingOuterContainer = container.querySelector('.min-h-screen.bg-gradient-to-br.from-blue-50.to-indigo-100');
      expect(loadingOuterContainer).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display "User not found" when user is null', async () => {
      const { RepositoryFactory } = require('@/lib/repositories/RepositoryFactory');
      RepositoryFactory.getUserRepository.mockReturnValue({
        getCurrentUser: jest.fn().mockResolvedValue(null),
      });

      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText('User not found')).toBeInTheDocument();
      });
    });

    it('should handle error during user fetch', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const { RepositoryFactory } = require('@/lib/repositories/RepositoryFactory');
      RepositoryFactory.getUserRepository.mockReturnValue({
        getCurrentUser: jest.fn().mockRejectedValue(new Error('Fetch failed')),
      });

      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText('User not found')).toBeInTheDocument();
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching user:', expect.any(Error));
      consoleErrorSpy.mockRestore();
    });

    it('should have error state with correct styling', async () => {
      const { RepositoryFactory } = require('@/lib/repositories/RepositoryFactory');
      RepositoryFactory.getUserRepository.mockReturnValue({
        getCurrentUser: jest.fn().mockResolvedValue(null),
      });

      const { container } = render(<ProfilePage />);

      await waitFor(() => {
        const errorOuterContainer = container.querySelector('.min-h-screen.bg-gradient-to-br.from-blue-50.to-indigo-100');
        expect(errorOuterContainer).toBeInTheDocument();
      });
    });
  });

  describe('Successful User Load', () => {
    beforeEach(() => {
      const { RepositoryFactory } = require('@/lib/repositories/RepositoryFactory');
      RepositoryFactory.getUserRepository.mockReturnValue({
        getCurrentUser: jest.fn().mockResolvedValue(mockStudent),
      });
    });

    it('should render header with MentorMatch logo and title', async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText('MentorMatch')).toBeInTheDocument();
      });
    });

    it('should render navigation links in header', async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getAllByRole('link', { name: /home/i }).length).toBeGreaterThan(0);
        expect(screen.getByText('Profile')).toBeInTheDocument();
      });
    });

    it('should have Home link with correct href', async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        const homeLink = screen.getAllByRole('link', { name: /home/i })[0];
        expect(homeLink).toHaveAttribute('href', '/');
      });
    });

    it('should render breadcrumb navigation', async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText('My Profile')).toBeInTheDocument();
      });
    });

    it('should have breadcrumb home link', async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        const breadcrumbLinks = screen.getAllByRole('link', { name: /home/i });
        // Should have at least one link (could be multiple Home links)
        expect(breadcrumbLinks.length).toBeGreaterThan(0);
      });
    });

    it('should render footer with copyright', async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText(/MentorMatch - Braude College of Engineering © 2025/i)).toBeInTheDocument();
      });
    });

    it('should have correct page background styling', async () => {
      const { container } = render(<ProfilePage />);

      await waitFor(() => {
        const mainContainer = container.querySelector('.min-h-screen.bg-gradient-to-br');
        expect(mainContainer).toBeInTheDocument();
      });
    });
  });

  describe('Header Structure', () => {
    beforeEach(() => {
      const { RepositoryFactory } = require('@/lib/repositories/RepositoryFactory');
      RepositoryFactory.getUserRepository.mockReturnValue({
        getCurrentUser: jest.fn().mockResolvedValue(mockStudent),
      });
    });

    it('should render header with white background', async () => {
      const { container } = render(<ProfilePage />);

      await waitFor(() => {
        const header = container.querySelector('header');
        expect(header).toBeInTheDocument();
        expect(header).toHaveClass('bg-white', 'shadow-sm');
      });
    });

    it('should render logo SVG icon', async () => {
      const { container } = render(<ProfilePage />);

      await waitFor(() => {
        const svg = container.querySelector('svg.w-10.h-10.text-blue-600');
        expect(svg).toBeInTheDocument();
      });
    });

    it('should have clickable logo linking to home', async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        const logoLink = screen.getByText('MentorMatch').closest('a');
        expect(logoLink).toHaveAttribute('href', '/');
      });
    });
  });

  describe('Footer Structure', () => {
    beforeEach(() => {
      const { RepositoryFactory } = require('@/lib/repositories/RepositoryFactory');
      RepositoryFactory.getUserRepository.mockReturnValue({
        getCurrentUser: jest.fn().mockResolvedValue(mockStudent),
      });
    });

    it('should render footer element', async () => {
      const { container } = render(<ProfilePage />);

      await waitFor(() => {
        const footer = container.querySelector('footer');
        expect(footer).toBeInTheDocument();
      });
    });

    it('should have footer with correct styling', async () => {
      const { container } = render(<ProfilePage />);

      await waitFor(() => {
        const footer = container.querySelector('footer');
        expect(footer).toHaveClass('mt-16', 'bg-white', 'border-t', 'border-gray-200');
      });
    });
  });

  describe('Semantic HTML', () => {
    beforeEach(() => {
      const { RepositoryFactory } = require('@/lib/repositories/RepositoryFactory');
      RepositoryFactory.getUserRepository.mockReturnValue({
        getCurrentUser: jest.fn().mockResolvedValue(mockStudent),
      });
    });

    it('should use semantic header element', async () => {
      const { container } = render(<ProfilePage />);

      await waitFor(() => {
        expect(container.querySelector('header')).toBeInTheDocument();
      });
    });

    it('should use semantic footer element', async () => {
      const { container } = render(<ProfilePage />);

      await waitFor(() => {
        expect(container.querySelector('footer')).toBeInTheDocument();
      });
    });

    it('should use semantic nav element', async () => {
      const { container } = render(<ProfilePage />);

      await waitFor(() => {
        expect(container.querySelector('nav')).toBeInTheDocument();
      });
    });
  });
});

