import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import SupervisorApplicationsPage from '../page';
import { applications } from '@/mock-data';
import { ApplicationService } from '@/lib/services';
import { onAuthChange, getUserProfile } from '@/lib/auth';

// Mock the Firebase services
jest.mock('@/lib/services', () => ({
  ApplicationService: {
    getSupervisorApplications: jest.fn(),
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

describe('SupervisorApplicationsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock applications data
    const mockApplications = applications.map(app => ({
      id: app.id,
      studentId: 'student-' + app.id,
      studentName: 'Student ' + app.id,
      studentEmail: 'student' + app.id + '@test.com',
      supervisorId: 'supervisor-123',
      supervisorName: app.supervisorName,
      projectTitle: app.projectTitle,
      projectDescription: app.projectDescription,
      isOwnTopic: true,
      studentSkills: 'Test skills',
      studentInterests: 'Test interests',
      hasPartner: false,
      status: app.status,
      dateApplied: new Date(app.dateApplied),
      lastUpdated: new Date(app.dateApplied),
      supervisorFeedback: app.comments,
      responseTime: app.responseTime,
    }));
    
    (ApplicationService.getSupervisorApplications as jest.Mock).mockResolvedValue(mockApplications);
  });

  describe('Loading States', () => {
    it('should show loading state initially', () => {
      render(<SupervisorApplicationsPage />);
      expect(screen.getByText('Loading applications...')).toBeInTheDocument();
    });
  });

  describe('Data Fetching', () => {
    it('should fetch applications data on mount', async () => {
      render(<SupervisorApplicationsPage />);
      
      await waitFor(() => {
        expect(ApplicationService.getSupervisorApplications).toHaveBeenCalledWith('supervisor-123');
      });
    });
  });

  describe('Display', () => {
    it('should display all applications when no filter is applied', async () => {
      render(<SupervisorApplicationsPage />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading applications...')).not.toBeInTheDocument();
      });
      
      // Check that all application titles are rendered
      applications.forEach(app => {
        expect(screen.getByText(app.projectTitle)).toBeInTheDocument();
      });
    });
    
    it('should show empty state when no applications exist', async () => {
      (ApplicationService.getSupervisorApplications as jest.Mock).mockResolvedValue([]);
      
      render(<SupervisorApplicationsPage />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading applications...')).not.toBeInTheDocument();
      });
      
      expect(screen.getByText(/no applications/i)).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    it('should filter applications to show only pending status', async () => {
      render(<SupervisorApplicationsPage />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading applications...')).not.toBeInTheDocument();
      });
      
      // Click pending filter button
      const pendingButton = screen.getByRole('button', { name: /pending/i });
      fireEvent.click(pendingButton);
      
      // Should show only pending applications
      const pendingApps = applications.filter(app => app.status === 'pending');
      const nonPendingApps = applications.filter(app => app.status !== 'pending');
      
      pendingApps.forEach(app => {
        expect(screen.getByText(app.projectTitle)).toBeInTheDocument();
      });
      
      nonPendingApps.forEach(app => {
        expect(screen.queryByText(app.projectTitle)).not.toBeInTheDocument();
      });
    });
    
    it('should filter applications to show only under_review status', async () => {
      render(<SupervisorApplicationsPage />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading applications...')).not.toBeInTheDocument();
      });
      
      // Click under review filter button
      const underReviewButton = screen.getByRole('button', { name: /under review/i });
      fireEvent.click(underReviewButton);
      
      // Should show only under_review applications
      const underReviewApps = applications.filter(app => app.status === 'under_review');
      
      underReviewApps.forEach(app => {
        expect(screen.getByText(app.projectTitle)).toBeInTheDocument();
      });
    });
    
    it('should filter applications to show only approved status', async () => {
      render(<SupervisorApplicationsPage />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading applications...')).not.toBeInTheDocument();
      });
      
      // Click approved filter button
      const approvedButton = screen.getByRole('button', { name: /approved/i });
      fireEvent.click(approvedButton);
      
      // Should show only approved applications
      const approvedApps = applications.filter(app => app.status === 'approved');
      
      approvedApps.forEach(app => {
        expect(screen.getByText(app.projectTitle)).toBeInTheDocument();
      });
    });
    
    it('should show all applications when All filter is clicked', async () => {
      render(<SupervisorApplicationsPage />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading applications...')).not.toBeInTheDocument();
      });
      
      // First filter to pending
      const pendingButton = screen.getByRole('button', { name: /pending/i });
      fireEvent.click(pendingButton);
      
      // Then click "All" to show all again - button text includes count like "All (3)"
      const allButton = screen.getByRole('button', { name: /^all\s*\(/i });
      fireEvent.click(allButton);
      
      // Should show all applications again
      applications.forEach(app => {
        expect(screen.getByText(app.projectTitle)).toBeInTheDocument();
      });
    });
    
    it('should display correct application count for each status', async () => {
      render(<SupervisorApplicationsPage />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading applications...')).not.toBeInTheDocument();
      });
      
      // Count applications by status
      const pendingCount = applications.filter(app => app.status === 'pending').length;
      const underReviewCount = applications.filter(app => app.status === 'under_review').length;
      const approvedCount = applications.filter(app => app.status === 'approved').length;
      
      // Check that counts are displayed in filter buttons (more specific queries)
      const pendingButton = screen.getByRole('button', { name: /pending/i });
      expect(pendingButton).toHaveTextContent(`Pending (${pendingCount})`);
      
      const underReviewButton = screen.getByRole('button', { name: /under review/i });
      expect(underReviewButton).toHaveTextContent(`Under Review (${underReviewCount})`);
      
      const approvedButton = screen.getByRole('button', { name: /approved/i });
      expect(approvedButton).toHaveTextContent(`Approved (${approvedCount})`);
    });
    
    it('should highlight the active filter button', async () => {
      render(<SupervisorApplicationsPage />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading applications...')).not.toBeInTheDocument();
      });
      
      const pendingButton = screen.getByRole('button', { name: /pending/i });
      fireEvent.click(pendingButton);
      
      // Active button should have different styling
      expect(pendingButton).toHaveClass('filter-btn-active');
    });
  });
});
