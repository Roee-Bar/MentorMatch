import { render, screen, waitFor } from '@testing-library/react';
import { useSupervisorAuth } from '@/lib/hooks';
import { apiClient } from '@/lib/api/client';
import { auth } from '@/lib/firebase';
import SupervisorProfilePage from '../page';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

// Mock supervisor auth hook
jest.mock('@/lib/hooks', () => ({
  useSupervisorAuth: jest.fn(),
}));

// Mock API client
jest.mock('@/lib/api/client', () => ({
  apiClient: {
    getSupervisorById: jest.fn(),
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

describe('[Page] Supervisor Profile', () => {
  const mockSupervisor = {
    id: 'sup-001',
    fullName: 'Dr. Jane Smith',
    email: 'smith@test.com',
    phone: '+1234567890',
    department: 'Computer Science',
    researchInterests: ['AI', 'Machine Learning', 'Data Science'],
    expertiseAreas: ['Deep Learning', 'Neural Networks'],
    bio: 'Experienced researcher with 10 years in AI',
    availabilityStatus: 'available' as const,
    currentCapacity: 2,
    maxCapacity: 5,
    officeLocation: 'Building A, Room 101',
    officeHours: 'Monday-Wednesday 2-4 PM',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock token retrieval
    (auth.currentUser!.getIdToken as jest.Mock).mockResolvedValue('mock-token');
  });

  it('shows loading state while fetching data', () => {
    (useSupervisorAuth as jest.Mock).mockReturnValue({
      userId: null,
      isAuthLoading: true,
    });

    render(<SupervisorProfilePage />);
    expect(screen.getByText(/loading profile/i)).toBeInTheDocument();
  });

  it('fetches and displays supervisor profile', async () => {
    (useSupervisorAuth as jest.Mock).mockReturnValue({
      userId: mockSupervisor.id,
      isAuthLoading: false,
    });

    (apiClient.getSupervisorById as jest.Mock).mockResolvedValue({
      success: true,
      data: mockSupervisor,
    });

    render(<SupervisorProfilePage />);

    await waitFor(() => {
      expect(screen.getByText(/profile/i)).toBeInTheDocument();
    });

    // Verify API client was called with token
    expect(apiClient.getSupervisorById).toHaveBeenCalledWith(
      mockSupervisor.id,
      'mock-token'
    );

    // Verify profile data is displayed
    expect(screen.getByText(mockSupervisor.fullName)).toBeInTheDocument();
    expect(screen.getByText(mockSupervisor.email)).toBeInTheDocument();
    expect(screen.getByText(mockSupervisor.phone)).toBeInTheDocument();
    expect(screen.getByText(mockSupervisor.department)).toBeInTheDocument();
    expect(screen.getByText(mockSupervisor.bio)).toBeInTheDocument();
    expect(screen.getByText(mockSupervisor.officeLocation)).toBeInTheDocument();
    expect(screen.getByText(mockSupervisor.officeHours)).toBeInTheDocument();

    // Verify research interests
    mockSupervisor.researchInterests.forEach(interest => {
      expect(screen.getByText(interest)).toBeInTheDocument();
    });

    // Verify expertise areas
    mockSupervisor.expertiseAreas.forEach(area => {
      expect(screen.getByText(area)).toBeInTheDocument();
    });
  });

  it('displays capacity indicator', async () => {
    (useSupervisorAuth as jest.Mock).mockReturnValue({
      userId: mockSupervisor.id,
      isAuthLoading: false,
    });

    (apiClient.getSupervisorById as jest.Mock).mockResolvedValue({
      success: true,
      data: mockSupervisor,
    });

    render(<SupervisorProfilePage />);

    await waitFor(() => {
      expect(screen.getByText(/2/i)).toBeInTheDocument();
      expect(screen.getByText(/5/i)).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    (useSupervisorAuth as jest.Mock).mockReturnValue({
      userId: mockSupervisor.id,
      isAuthLoading: false,
    });

    (apiClient.getSupervisorById as jest.Mock).mockRejectedValue(
      new Error('API error')
    );

    render(<SupervisorProfilePage />);

    await waitFor(() => {
      expect(screen.getByText(/unable to load profile/i)).toBeInTheDocument();
    });
  });

  it('handles null response from API', async () => {
    (useSupervisorAuth as jest.Mock).mockReturnValue({
      userId: mockSupervisor.id,
      isAuthLoading: false,
    });

    (apiClient.getSupervisorById as jest.Mock).mockResolvedValue({
      success: true,
      data: null,
    });

    render(<SupervisorProfilePage />);

    await waitFor(() => {
      expect(screen.getByText(/unable to load profile/i)).toBeInTheDocument();
    });
  });

  it('redirects to login if no token is available', async () => {
    const mockRouter = { push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() };
    jest.spyOn(require('next/navigation'), 'useRouter').mockReturnValue(mockRouter);

    (useSupervisorAuth as jest.Mock).mockReturnValue({
      userId: mockSupervisor.id,
      isAuthLoading: false,
    });

    // Mock no token available
    (auth.currentUser!.getIdToken as jest.Mock).mockResolvedValue(null);

    render(<SupervisorProfilePage />);

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/login');
    });
  });

  it('handles profile without optional fields', async () => {
    const profileWithoutOptionalFields = {
      ...mockSupervisor,
      phone: undefined,
      officeLocation: undefined,
      officeHours: undefined,
    };

    (useSupervisorAuth as jest.Mock).mockReturnValue({
      userId: mockSupervisor.id,
      isAuthLoading: false,
    });

    (apiClient.getSupervisorById as jest.Mock).mockResolvedValue({
      success: true,
      data: profileWithoutOptionalFields,
    });

    render(<SupervisorProfilePage />);

    await waitFor(() => {
      expect(screen.getByText(mockSupervisor.fullName)).toBeInTheDocument();
    });

    // Verify optional fields are not displayed
    expect(screen.queryByText(mockSupervisor.phone)).not.toBeInTheDocument();
    expect(screen.queryByText(/office information/i)).not.toBeInTheDocument();
  });
});

