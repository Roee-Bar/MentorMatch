import { render, screen } from '@testing-library/react';
import CapacityIndicator from '../CapacityIndicator';

describe('[Component][Dashboard] CapacityIndicator', () => {
  // Test: Renders with correct values
  it('should render with current and max capacity values', () => {
    render(<CapacityIndicator current={2} max={5} status="available" />);
    
    expect(screen.getByText('2 / 5')).toBeInTheDocument();
  });
  
  // Test: Calculates percentage correctly
  it('should calculate and display correct percentage', () => {
    render(<CapacityIndicator current={3} max={10} status="available" />);
    
    // 3/10 = 30%
    expect(screen.getByText('30%')).toBeInTheDocument();
  });
  
  // Test: Shows 0% when max is 0
  it('should show 0% when max capacity is 0', () => {
    render(<CapacityIndicator current={0} max={0} status="unavailable" />);
    
    expect(screen.getByText('0%')).toBeInTheDocument();
  });
  
  // Test: Shows 100% when at full capacity
  it('should show 100% when at full capacity', () => {
    render(<CapacityIndicator current={5} max={5} status="unavailable" />);
    
    expect(screen.getByText('100%')).toBeInTheDocument();
  });
  
  // Test: Displays available status text
  it('should display available status text', () => {
    render(<CapacityIndicator current={1} max={5} status="available" />);
    expect(screen.getByText('Available')).toBeInTheDocument();
  });
  
  // Test: Displays limited status text
  it('should display limited status text', () => {
    render(<CapacityIndicator current={4} max={5} status="limited" />);
    expect(screen.getByText('Limited')).toBeInTheDocument();
  });
  
  // Test: Displays unavailable status text
  it('should display unavailable status text', () => {
    render(<CapacityIndicator current={5} max={5} status="unavailable" />);
    expect(screen.getByText('Unavailable')).toBeInTheDocument();
  });
  
  // Test: Progress bar width matches percentage
  it('should set progress bar width based on capacity percentage', () => {
    const { container } = render(<CapacityIndicator current={3} max={10} status="available" />);
    
    const progressBar = container.querySelector('[style*="width"]');
    expect(progressBar).toHaveStyle({ width: '30%' });
  });
});

