import { render, screen } from '@testing-library/react';
import StatCard from '../StatCard';

describe('StatCard', () => {
  // Tests optional icon prop renders when provided
  it('should render optional icon when provided', () => {
    const TestIcon = () => <span data-testid="test-icon">Icon</span>;
    
    render(
      <StatCard
        title="Test"
        value="10"
        description="desc"
        color="blue"
        icon={<TestIcon />}
      />
    );
    
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });
});
