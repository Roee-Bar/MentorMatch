import { render, screen, waitFor } from '@testing-library/react';
import DashboardLayout from '../layout';
import { users } from '@/mock-data';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  usePathname: () => '/dashboard/student',
}));

// Mock auth - using mock data inside the factory function
jest.mock('@/lib/auth', () => {
  const { users } = jest.requireActual('@/mock-data');
  const mockStudent = users.find((u: any) => u.role === 'student');

  return {
    onAuthChange: jest.fn((callback) => {
      // Simulate authenticated user after a short delay
      setTimeout(() => {
        callback({
          uid: mockStudent.id,
          email: mockStudent.email,
        });
      }, 0);
      return jest.fn(); // unsubscribe function
    }),
    getUserProfile: jest.fn().mockResolvedValue({
      success: true,
      data: {
        ...mockStudent,
        createdAt: { seconds: Date.now() / 1000 },
      },
    }),
  };
});

describe('DashboardLayout', () => {
  it('should render loading state initially', () => {
    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should render children after loading completes', async () => {
    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });
  });

  it('should show authentication check behavior', async () => {
    render(
      <DashboardLayout>
        <div>Dashboard Content</div>
      </DashboardLayout>
    );
    
    // Initially loading
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    // After auth check, content should be visible
    await waitFor(() => {
      expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
    });
  });
});

