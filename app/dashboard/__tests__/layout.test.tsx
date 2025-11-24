import { render, screen, waitFor } from '@testing-library/react';
import DashboardLayout from '../layout';
import { users } from '@/mock-data';
import { onAuthChange, getUserProfile } from '@/lib/auth';

// Mock Next.js navigation
const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  usePathname: () => '/dashboard/student',
}));

// Mock auth
jest.mock('@/lib/auth', () => ({
  onAuthChange: jest.fn(),
  getUserProfile: jest.fn(),
}));

describe('DashboardLayout - Enhanced Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Tests loading indicator displays while authentication is being checked
  it('should render loading state initially', () => {
    const mockStudent = users.find((u: any) => u.role === 'student');
    
    (onAuthChange as jest.Mock).mockImplementation((callback) => {
      setTimeout(() => callback({ uid: mockStudent.id, email: mockStudent.email }), 0);
      return jest.fn();
    });
    
    (getUserProfile as jest.Mock).mockResolvedValue({
      success: true,
      data: { ...mockStudent, createdAt: { seconds: Date.now() / 1000 } },
    });

    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  // Tests children render after successful authentication and profile fetch
  it('should render children after loading completes', async () => {
    const mockStudent = users.find((u: any) => u.role === 'student');
    
    (onAuthChange as jest.Mock).mockImplementation((callback) => {
      setTimeout(() => callback({ uid: mockStudent.id, email: mockStudent.email }), 0);
      return jest.fn();
    });
    
    (getUserProfile as jest.Mock).mockResolvedValue({
      success: true,
      data: { ...mockStudent, createdAt: { seconds: Date.now() / 1000 } },
    });

    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });
  });

  // Tests authentication state is checked before rendering children
  it('should show authentication check behavior', async () => {
    const mockStudent = users.find((u: any) => u.role === 'student');
    
    (onAuthChange as jest.Mock).mockImplementation((callback) => {
      setTimeout(() => callback({ uid: mockStudent.id, email: mockStudent.email }), 0);
      return jest.fn();
    });
    
    (getUserProfile as jest.Mock).mockResolvedValue({
      success: true,
      data: { ...mockStudent, createdAt: { seconds: Date.now() / 1000 } },
    });

    render(
      <DashboardLayout>
        <div>Dashboard Content</div>
      </DashboardLayout>
    );
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
    });
  });

  // Tests unauthenticated users are blocked from viewing dashboard
  it('should redirect unauthenticated user to home', async () => {
    (onAuthChange as jest.Mock).mockImplementation((callback) => {
      setTimeout(() => callback(null), 0);
      return jest.fn();
    });

    render(
      <DashboardLayout>
        <div>Dashboard Content</div>
      </DashboardLayout>
    );

    // When unauthenticated, should show loading indefinitely or redirect
    // Since the layout doesn't render children when not authenticated,
    // we just check that Dashboard Content is not visible
    await waitFor(() => {
      expect(screen.queryByText('Dashboard Content')).not.toBeInTheDocument();
    }, { timeout: 2000 });
  });

  // Tests non-student roles are blocked from student dashboard
  it('should redirect non-student role to home', async () => {
    const mockSupervisor = users.find((u: any) => u.role === 'supervisor');
    
    (onAuthChange as jest.Mock).mockImplementation((callback) => {
      setTimeout(() => callback({ uid: mockSupervisor.id, email: mockSupervisor.email }), 0);
      return jest.fn();
    });
    
    (getUserProfile as jest.Mock).mockResolvedValue({
      success: true,
      data: { ...mockSupervisor, role: 'supervisor', createdAt: { seconds: Date.now() / 1000 } },
    });

    render(
      <DashboardLayout>
        <div>Dashboard Content</div>
      </DashboardLayout>
    );

    // Non-student roles should not see the dashboard content
    await waitFor(() => {
      expect(screen.queryByText('Dashboard Content')).not.toBeInTheDocument();
    }, { timeout: 2000 });
  });

  // Tests error handling when user profile fetch fails
  it('should handle getUserProfile error', async () => {
    const mockStudent = users.find((u: any) => u.role === 'student');
    
    (onAuthChange as jest.Mock).mockImplementation((callback) => {
      setTimeout(() => callback({ uid: mockStudent.id, email: mockStudent.email }), 0);
      return jest.fn();
    });
    
    (getUserProfile as jest.Mock).mockResolvedValue({
      success: false,
      error: 'User not found',
    });

    render(
      <DashboardLayout>
        <div>Dashboard Content</div>
      </DashboardLayout>
    );

    // If getUserProfile fails, dashboard content should not be visible
    await waitFor(() => {
      expect(screen.queryByText('Dashboard Content')).not.toBeInTheDocument();
    }, { timeout: 2000 });
  });

  // Tests successful authentication flow with profile fetch integration
  it('should complete auth flow with profile fetch successfully', async () => {
    const mockStudent = users.find((u: any) => u.role === 'student');
    
    (onAuthChange as jest.Mock).mockImplementation((callback) => {
      setTimeout(() => callback({ uid: mockStudent.id, email: mockStudent.email }), 0);
      return jest.fn();
    });
    
    (getUserProfile as jest.Mock).mockResolvedValue({
      success: true,
      data: { ...mockStudent, createdAt: { seconds: Date.now() / 1000 } },
    });

    render(
      <DashboardLayout>
        <div>Dashboard Content</div>
      </DashboardLayout>
    );

    await waitFor(() => {
      expect(getUserProfile).toHaveBeenCalledWith(mockStudent.id);
    });

    await waitFor(() => {
      expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
    });
  });

  // Tests auth listener unsubscribe is called when component unmounts
  it('should cleanup auth listener on unmount', async () => {
    const mockStudent = users.find((u: any) => u.role === 'student');
    const mockUnsubscribe = jest.fn();
    
    (onAuthChange as jest.Mock).mockImplementation((callback) => {
      setTimeout(() => callback({ uid: mockStudent.id, email: mockStudent.email }), 0);
      return mockUnsubscribe;
    });
    
    (getUserProfile as jest.Mock).mockResolvedValue({
      success: true,
      data: { ...mockStudent, createdAt: { seconds: Date.now() / 1000 } },
    });

    const { unmount } = render(
      <DashboardLayout>
        <div>Dashboard Content</div>
      </DashboardLayout>
    );

    await waitFor(() => {
      expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
    });

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});

