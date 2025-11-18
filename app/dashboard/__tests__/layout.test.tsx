import { render, screen, waitFor } from '@testing-library/react';
import DashboardLayout from '../layout';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  usePathname: () => '/dashboard/student',
}));

// Mock auth
jest.mock('@/lib/auth', () => ({
  onAuthChange: jest.fn((callback) => {
    // Simulate authenticated user after a short delay
    setTimeout(() => {
      callback({
        uid: 'test-uid',
        email: 'test@example.com',
      });
    }, 0);
    return jest.fn(); // unsubscribe function
  }),
  getUserProfile: jest.fn().mockResolvedValue({
    success: true,
    data: {
      name: 'Test Student',
      email: 'test@example.com',
      role: 'student',
      department: 'Computer Science',
      createdAt: { seconds: Date.now() / 1000 },
    },
  }),
}));

describe('DashboardLayout', () => {
  it('should render loading state initially', () => {
    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
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

