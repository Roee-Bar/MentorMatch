import { render, screen } from '@testing-library/react';
import DashboardRouter from '../page';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: jest.fn(),
  }),
}));

describe('DashboardRouter', () => {
  it('should render redirecting message', () => {
    render(<DashboardRouter />);
    expect(screen.getByText(/redirecting to dashboard/i)).toBeInTheDocument();
  });

  it('should render component structure correctly', () => {
    const { container } = render(<DashboardRouter />);
    expect(container.querySelector('.min-h-screen')).toBeInTheDocument();
  });
});

