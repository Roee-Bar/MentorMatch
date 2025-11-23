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

  it('displays correct status badge for approved application', () => {
    const approvedApplication: Application = {
      ...mockApplication,
      status: 'approved',
    };
    render(<ApplicationCard application={approvedApplication} />);
    expect(screen.getByText('Approved')).toBeInTheDocument();
  });

  it('displays correct status badge for rejected application', () => {
    const rejectedApplication: Application = {
      ...mockApplication,
      status: 'rejected',
    };
    render(<ApplicationCard application={rejectedApplication} />);
    expect(screen.getByText('Rejected')).toBeInTheDocument();
  });

  it('displays correct status badge for under review application', () => {
    const underReviewApplication: Application = {
      ...mockApplication,
      status: 'under_review',
    };
    render(<ApplicationCard application={underReviewApplication} />);
    expect(screen.getByText('Under Review')).toBeInTheDocument();
  });

  it('renders without comments if none provided', () => {
    const noCommentsApplication: Application = {
      ...mockApplication,
      comments: '',
    };
    render(<ApplicationCard application={noCommentsApplication} />);
    expect(screen.queryByText('Comments:')).not.toBeInTheDocument();
  });

  describe('Button Interactions', () => {
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

    it('should not display "Withdraw" button for non-pending applications', () => {
      const approvedApplication: Application = {
        ...mockApplication,
        status: 'approved',
      };
      render(<ApplicationCard application={approvedApplication} />);
      
      expect(screen.queryByRole('button', { name: /withdraw/i })).not.toBeInTheDocument();
    });

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

    it('should not display "Edit & Resubmit" button for non-revision applications', () => {
      const pendingApplication: Application = {
        ...mockApplication,
        status: 'pending',
      };
      render(<ApplicationCard application={pendingApplication} />);
      
      expect(screen.queryByRole('button', { name: /edit & resubmit/i })).not.toBeInTheDocument();
    });

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

