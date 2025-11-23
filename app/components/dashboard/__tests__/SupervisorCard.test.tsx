import { render, screen, fireEvent } from '@testing-library/react';
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

  describe('Button Interactions', () => {
    it('should display "Apply for Supervision" button when supervisor is available', () => {
      const availableSupervisor: Supervisor = {
        ...mockSupervisor,
        availabilityStatus: 'available',
      };
      render(<SupervisorCard supervisor={availableSupervisor} showApplyButton={true} />);
      
      const applyButton = screen.getByRole('button', { name: /apply for supervision/i });
      expect(applyButton).toBeInTheDocument();
      expect(applyButton).toHaveClass('btn-primary');
    });

    it('should display "Apply for Supervision" button when supervisor has limited capacity', () => {
      const limitedSupervisor: Supervisor = {
        ...mockSupervisor,
        availabilityStatus: 'limited',
      };
      render(<SupervisorCard supervisor={limitedSupervisor} showApplyButton={true} />);
      
      const applyButton = screen.getByRole('button', { name: /apply for supervision/i });
      expect(applyButton).toBeInTheDocument();
    });

    it('should not display "Apply for Supervision" button when supervisor is unavailable', () => {
      const unavailableSupervisor: Supervisor = {
        ...mockSupervisor,
        availabilityStatus: 'unavailable',
      };
      render(<SupervisorCard supervisor={unavailableSupervisor} showApplyButton={true} />);
      
      expect(screen.queryByRole('button', { name: /apply for supervision/i })).not.toBeInTheDocument();
    });

    it('should not display action buttons when showApplyButton is false', () => {
      const availableSupervisor: Supervisor = {
        ...mockSupervisor,
        availabilityStatus: 'available',
      };
      render(<SupervisorCard supervisor={availableSupervisor} showApplyButton={false} />);
      
      expect(screen.queryByRole('button', { name: /apply for supervision/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /view details/i })).not.toBeInTheDocument();
    });

    it('should call onApply callback when "Apply for Supervision" button is clicked', () => {
      const mockOnApply = jest.fn();
      const availableSupervisor: Supervisor = {
        ...mockSupervisor,
        availabilityStatus: 'available',
      };
      
      render(
        <SupervisorCard 
          supervisor={availableSupervisor} 
          showApplyButton={true}
          onApply={mockOnApply}
        />
      );
      
      const applyButton = screen.getByRole('button', { name: /apply for supervision/i });
      fireEvent.click(applyButton);
      
      expect(mockOnApply).toHaveBeenCalledWith(availableSupervisor.id);
      expect(mockOnApply).toHaveBeenCalledTimes(1);
    });

    it('should display "View Details" button alongside "Apply" button', () => {
      const availableSupervisor: Supervisor = {
        ...mockSupervisor,
        availabilityStatus: 'available',
      };
      render(<SupervisorCard supervisor={availableSupervisor} showApplyButton={true} />);
      
      expect(screen.getByRole('button', { name: /apply for supervision/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /view details/i })).toBeInTheDocument();
    });
  });

  describe('Contact Link', () => {
    it('should render contact email as clickable mailto link', () => {
      render(<SupervisorCard supervisor={mockSupervisor} />);
      
      const emailLink = screen.getByRole('link', { name: mockSupervisor.contact });
      expect(emailLink).toBeInTheDocument();
      expect(emailLink).toHaveAttribute('href', `mailto:${mockSupervisor.contact}`);
    });
  });
});

