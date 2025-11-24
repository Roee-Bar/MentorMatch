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

  it('should redirect to student dashboard', () => {
    const mockReplace = jest.fn();
    
    // Update the mock to return our new mockReplace
    jest.spyOn(require('next/navigation'), 'useRouter').mockReturnValue({
      replace: mockReplace,
    });
    
    render(<DashboardRouter />);
    
    expect(mockReplace).toHaveBeenCalledWith('/dashboard/student');
  });
});

