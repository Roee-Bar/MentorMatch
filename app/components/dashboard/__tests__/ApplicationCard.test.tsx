import { render, screen } from '@testing-library/react';
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

  it('displays correct status badge for application', () => {
    render(<ApplicationCard application={mockApplication} />);
    // Check for the correct status based on the mock data
    const statusMap: Record<string, string> = {
      'pending': 'Pending',
      'approved': 'Approved',
      'rejected': 'Rejected',
      'under_review': 'Under Review'
    };
    const expectedStatus = statusMap[mockApplication.status];
    expect(screen.getByText(expectedStatus)).toBeInTheDocument();
  });

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
});

