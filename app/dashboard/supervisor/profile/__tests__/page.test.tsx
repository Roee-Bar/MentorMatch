import { render, screen, waitFor } from '@testing-library/react';
import SupervisorProfilePage from '../page';
import { SupervisorService } from '@/lib/services';
import { onAuthChange, getUserProfile } from '@/lib/auth';

// Mock the Firebase services
jest.mock('@/lib/services', () => ({
  SupervisorService: {
    getSupervisorById: jest.fn(),
  },
}));

// Mock the auth module
jest.mock('@/lib/auth', () => ({
  onAuthChange: jest.fn((callback) => {
    callback({ uid: 'supervisor-123' });
    return jest.fn();
  }),
  getUserProfile: jest.fn().mockResolvedValue({
    success: true,
    data: { role: 'supervisor', name: 'Dr. Test Supervisor' },
  }),
}));

// Mock next/navigation
const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: mockPush,
    replace: mockReplace,
  })),
}));

describe('SupervisorProfilePage', () => {
  const mockSupervisor = {
    id: 'supervisor-123',
    firstName: 'Test',
    lastName: 'Supervisor',
    fullName: 'Dr. Test Supervisor',
    email: 'supervisor@test.com',
    phone: '+1234567890',
    department: 'Computer Science',
    title: 'Dr.',
    photoURL: 'https://example.com/photo.jpg',
    bio: 'Experienced researcher in AI and Machine Learning with 15 years of experience.',
    researchInterests: ['Artificial Intelligence', 'Machine Learning', 'Deep Learning'],
    expertiseAreas: ['Neural Networks', 'Computer Vision', 'NLP'],
    officeLocation: 'Building A, Room 301',
    officeHours: 'Monday 2-4 PM, Wednesday 3-5 PM',
    maxCapacity: 5,
    currentCapacity: 2,
    availabilityStatus: 'available' as const,
    isApproved: true,
    isActive: true,
    notificationPreference: 'immediate' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (SupervisorService.getSupervisorById as jest.Mock).mockResolvedValue(mockSupervisor);
  });
  
  // Test: Shows loading state
  it('should show loading state initially', () => {
    render(<SupervisorProfilePage />);
    expect(screen.getByText('Loading profile...')).toBeInTheDocument();
  });
  
  // Test: Fetches supervisor profile on mount
  it('should fetch supervisor profile on mount', async () => {
    render(<SupervisorProfilePage />);
    
    await waitFor(() => {
      expect(SupervisorService.getSupervisorById).toHaveBeenCalledWith('supervisor-123');
    });
  });
  
  // Test: Displays supervisor name and title
  it('should display supervisor name and title', async () => {
    render(<SupervisorProfilePage />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading profile...')).not.toBeInTheDocument();
    });
    
    expect(screen.getByText('Dr. Test Supervisor')).toBeInTheDocument();
  });
  
  // Test: Displays contact information
  it('should display contact information', async () => {
    render(<SupervisorProfilePage />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading profile...')).not.toBeInTheDocument();
    });
    
    expect(screen.getByText('supervisor@test.com')).toBeInTheDocument();
    expect(screen.getByText('+1234567890')).toBeInTheDocument();
  });
  
  // Test: Displays bio
  it('should display supervisor bio', async () => {
    render(<SupervisorProfilePage />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading profile...')).not.toBeInTheDocument();
    });
    
    expect(screen.getByText(/Experienced researcher in AI/i)).toBeInTheDocument();
  });
  
  // Test: Displays research interests
  it('should display all research interests', async () => {
    render(<SupervisorProfilePage />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading profile...')).not.toBeInTheDocument();
    });
    
    mockSupervisor.researchInterests.forEach(interest => {
      expect(screen.getByText(interest)).toBeInTheDocument();
    });
  });
  
  // Test: Displays expertise areas
  it('should display all expertise areas', async () => {
    render(<SupervisorProfilePage />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading profile...')).not.toBeInTheDocument();
    });
    
    mockSupervisor.expertiseAreas.forEach(area => {
      expect(screen.getByText(area)).toBeInTheDocument();
    });
  });
  
  // Test: Displays office information
  it('should display office location and hours', async () => {
    render(<SupervisorProfilePage />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading profile...')).not.toBeInTheDocument();
    });
    
    expect(screen.getByText('Building A, Room 301')).toBeInTheDocument();
    expect(screen.getByText(/Monday 2-4 PM/i)).toBeInTheDocument();
  });
  
  // Test: Displays capacity information with CapacityIndicator
  it('should display capacity information using CapacityIndicator', async () => {
    render(<SupervisorProfilePage />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading profile...')).not.toBeInTheDocument();
    });
    
    // Check that capacity values are displayed
    expect(screen.getByText('2 / 5')).toBeInTheDocument();
  });
  
  // Test: Shows availability status
  it('should display availability status', async () => {
    render(<SupervisorProfilePage />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading profile...')).not.toBeInTheDocument();
    });
    
    expect(screen.getByText('Available')).toBeInTheDocument();
  });
  
  // Test: Handles missing optional fields gracefully
  it('should handle missing optional fields gracefully', async () => {
    const supervisorWithoutOptionals = {
      ...mockSupervisor,
      phone: undefined,
      photoURL: undefined,
      officeLocation: undefined,
      officeHours: undefined,
    };
    
    (SupervisorService.getSupervisorById as jest.Mock).mockResolvedValue(supervisorWithoutOptionals);
    
    render(<SupervisorProfilePage />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading profile...')).not.toBeInTheDocument();
    });
    
    // Should still render without errors
    expect(screen.getByText('Dr. Test Supervisor')).toBeInTheDocument();
  });
  
  // Test: Shows error state when profile fetch fails
  it('should handle error when profile fetch fails', async () => {
    (SupervisorService.getSupervisorById as jest.Mock).mockResolvedValue(null);
    
    render(<SupervisorProfilePage />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading profile...')).not.toBeInTheDocument();
    });
    
    expect(screen.getByText(/unable to load profile/i)).toBeInTheDocument();
  });
});

