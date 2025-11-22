import { render, screen } from '@testing-library/react';
import SupervisorCard from '../SupervisorCard';
import { Supervisor } from '@/types/dashboard';
import { supervisors } from '@/mock-data';

describe('SupervisorCard', () => {
  // Use mock data directly from the mock-data folder
  const mockSupervisor = supervisors[0];

  // Ensure mock data exists
  if (!mockSupervisor) {
    throw new Error('Mock supervisor data is missing. Please check mock-data/data/supervisors.ts');
  }

  it('displays correct availability badge for available supervisor', () => {
    render(<SupervisorCard supervisor={mockSupervisor} />);
    expect(screen.getByText('Available')).toBeInTheDocument();
  });

  it('displays correct availability badge for limited capacity', () => {
    const limitedSupervisor: Supervisor = {
      ...mockSupervisor,
      availabilityStatus: 'limited',
    };
    render(<SupervisorCard supervisor={limitedSupervisor} />);
    expect(screen.getByText('Limited Capacity')).toBeInTheDocument();
  });

  it('displays correct availability badge for unavailable supervisor', () => {
    const unavailableSupervisor: Supervisor = {
      ...mockSupervisor,
      availabilityStatus: 'unavailable',
    };
    render(<SupervisorCard supervisor={unavailableSupervisor} />);
    expect(screen.getByText('Unavailable')).toBeInTheDocument();
  });
});

