import { render, screen, fireEvent } from '@testing-library/react';
import ApplicationCard from '../ApplicationCard';
import { Application } from '@/types/dashboard';
import { applications } from '@/mock-data';

describe('ApplicationCard', () => {
  // Use mock data directly from the mock-data folder
  const mockApplication = applications[0];

  // Ensure mock data exists
  if (!mockApplication) {
    throw new Error('Mock application data is missing. Please check mock-data/data/applications.ts');
  }

  // Tests conditional badge rendering for approved status
  it('displays correct status badge for approved application', () => {
    const approvedApplication: Application = {
      ...mockApplication,
      status: 'approved',
    };
    render(<ApplicationCard application={approvedApplication} />);
    expect(screen.getByText('Approved')).toBeInTheDocument();
  });

  // Tests conditional badge rendering for rejected status
  it('displays correct status badge for rejected application', () => {
    const rejectedApplication: Application = {
      ...mockApplication,
      status: 'rejected',
    };
    render(<ApplicationCard application={rejectedApplication} />);
    expect(screen.getByText('Rejected')).toBeInTheDocument();
  });

  // Tests conditional badge rendering for under review status
  it('displays correct status badge for under review application', () => {
    const underReviewApplication: Application = {
      ...mockApplication,
      status: 'under_review',
    };
    render(<ApplicationCard application={underReviewApplication} />);
    expect(screen.getByText('Under Review')).toBeInTheDocument();
  });

  // Tests conditional rendering hides comments section when empty
  it('renders without comments if none provided', () => {
    const noCommentsApplication: Application = {
      ...mockApplication,
      comments: '',
    };
    render(<ApplicationCard application={noCommentsApplication} />);
    expect(screen.queryByText('Comments:')).not.toBeInTheDocument();
  });

  describe('Button Interactions', () => {
    // Tests withdraw button displays only for pending status
    it('should display "Withdraw" button only for pending applications', () => {
      const pendingApplication: Application = {
        ...mockApplication,
        status: 'pending',
      };
      render(<ApplicationCard application={pendingApplication} />);
      
      const withdrawButton = screen.getByRole('button', { name: /withdraw/i });
      expect(withdrawButton).toBeInTheDocument();
      expect(withdrawButton).toHaveClass('btn-danger');
    });

    // Tests withdraw button hidden for non-pending statuses
    it('should not display "Withdraw" button for non-pending applications', () => {
      const approvedApplication: Application = {
        ...mockApplication,
        status: 'approved',
      };
      render(<ApplicationCard application={approvedApplication} />);
      
      expect(screen.queryByRole('button', { name: /withdraw/i })).not.toBeInTheDocument();
    });

    // Tests edit button displays only for revision_requested status
    it('should display "Edit & Resubmit" button only for revision_requested applications', () => {
      const revisionApplication: Application = {
        ...mockApplication,
        status: 'revision_requested',
      };
      render(<ApplicationCard application={revisionApplication} />);
      
      const editButton = screen.getByRole('button', { name: /edit & resubmit/i });
      expect(editButton).toBeInTheDocument();
      expect(editButton).toHaveClass('btn-primary');
    });

    // Tests edit button hidden for non-revision statuses
    it('should not display "Edit & Resubmit" button for non-revision applications', () => {
      const pendingApplication: Application = {
        ...mockApplication,
        status: 'pending',
      };
      render(<ApplicationCard application={pendingApplication} />);
      
      expect(screen.queryByRole('button', { name: /edit & resubmit/i })).not.toBeInTheDocument();
    });

    // Tests view project button displays only for approved status
    it('should display "View Project Details" button only for approved applications', () => {
      const approvedApplication: Application = {
        ...mockApplication,
        status: 'approved',
      };
      render(<ApplicationCard application={approvedApplication} />);
      
      const viewButton = screen.getByRole('button', { name: /view project details/i });
      expect(viewButton).toBeInTheDocument();
      expect(viewButton).toHaveClass('btn-success');
    });

    // Tests view project button hidden for non-approved statuses
    it('should not display "View Project Details" button for non-approved applications', () => {
      const pendingApplication: Application = {
        ...mockApplication,
        status: 'pending',
      };
      render(<ApplicationCard application={pendingApplication} />);
      
      expect(screen.queryByRole('button', { name: /view project details/i })).not.toBeInTheDocument();
    });
  });
});

