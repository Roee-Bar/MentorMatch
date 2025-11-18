import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { signIn } from '@/lib/auth';
import LoginPage from '../page';

// Mock Next.js navigation
const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  usePathname: () => '/login',
}));

// Mock auth
jest.mock('@/lib/auth', () => ({
  signIn: jest.fn(),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render login form with email and password fields', () => {
    render(<LoginPage />);
    
    expect(screen.getByPlaceholderText(/you@braude.ac.il/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter your password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('should show validation errors for empty fields', async () => {
    render(<LoginPage />);
    
    const submitButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      const emailInput = screen.getByPlaceholderText(/you@braude.ac.il/i);
      const passwordInput = screen.getByPlaceholderText(/enter your password/i);
      
      expect(emailInput).toBeInvalid();
      expect(passwordInput).toBeInvalid();
    });
  });

  it('should display error message on failed login', async () => {
    (signIn as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Invalid credentials',
    });

    render(<LoginPage />);
    
    const emailInput = screen.getByPlaceholderText(/you@braude.ac.il/i);
    const passwordInput = screen.getByPlaceholderText(/enter your password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('should display success message on successful login', async () => {
    (signIn as jest.Mock).mockResolvedValue({
      success: true,
      user: { uid: 'test-uid' },
    });

    render(<LoginPage />);
    
    const emailInput = screen.getByPlaceholderText(/you@braude.ac.il/i);
    const passwordInput = screen.getByPlaceholderText(/enter your password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/login successful!/i)).toBeInTheDocument();
    });
  });

  it('should redirect to dashboard after successful login', async () => {
    (signIn as jest.Mock).mockResolvedValue({
      success: true,
      user: { uid: 'test-uid' },
    });

    render(<LoginPage />);
    
    const emailInput = screen.getByPlaceholderText(/you@braude.ac.il/i);
    const passwordInput = screen.getByPlaceholderText(/enter your password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should have "Back to Home" link that navigates to "/"', () => {
    render(<LoginPage />);
    
    const backLink = screen.getByRole('link', { name: /← back to home/i });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute('href', '/');
  });

  it('should have "Sign up" link that navigates to "/register"', () => {
    render(<LoginPage />);
    
    const signUpLink = screen.getByRole('link', { name: /sign up as student/i });
    expect(signUpLink).toBeInTheDocument();
    expect(signUpLink).toHaveAttribute('href', '/register');
  });

  it('should show loading state during login submission', async () => {
    (signIn as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
    );

    render(<LoginPage />);
    
    const emailInput = screen.getByPlaceholderText(/you@braude.ac.il/i);
    const passwordInput = screen.getByPlaceholderText(/enter your password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    expect(screen.getByRole('button', { name: /logging in.../i })).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });
});

