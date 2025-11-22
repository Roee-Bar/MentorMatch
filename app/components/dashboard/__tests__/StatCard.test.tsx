import { render, screen } from '@testing-library/react';
import StatCard from '../StatCard';

describe('StatCard', () => {
  it('should render title prop correctly', () => {
    render(
      <StatCard
        title="Test Stat"
        value="42"
        description="Test description"
        color="blue"
      />
    );
    
    expect(screen.getByText('Test Stat')).toBeInTheDocument();
  });

  it('should render value prop correctly', () => {
    render(
      <StatCard
        title="Test Stat"
        value="42"
        description="Test description"
        color="blue"
      />
    );
    
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('should render description prop correctly', () => {
    render(
      <StatCard
        title="Test Stat"
        value="42"
        description="Test description"
        color="blue"
      />
    );
    
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('should apply correct color class based on color prop', () => {
    const { container } = render(
      <StatCard
        title="Test"
        value="10"
        description="desc"
        color="green"
      />
    );
    
    expect(container.querySelector('.text-green-600')).toBeInTheDocument();
  });

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
