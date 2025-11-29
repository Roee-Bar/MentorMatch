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

describe('[Integration] Login Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows validation errors for empty fields', async () => {
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

  it('displays error message on failed login', async () => {
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

  it('displays success message on successful login', async () => {
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

  it('redirects to dashboard after successful login', async () => {
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

  it('shows loading state during login submission', async () => {
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

  it('handles auth/user-not-found error code', async () => {
    (signIn as jest.Mock).mockResolvedValue({
      success: false,
      error: 'User not found',
    });

    render(<LoginPage />);
    
    const emailInput = screen.getByPlaceholderText(/you@braude.ac.il/i);
    const passwordInput = screen.getByPlaceholderText(/enter your password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(emailInput, { target: { value: 'notfound@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/user not found/i)).toBeInTheDocument();
    });
  });

  it('handles auth/wrong-password error code', async () => {
    (signIn as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Wrong password',
    });

    render(<LoginPage />);
    
    const emailInput = screen.getByPlaceholderText(/you@braude.ac.il/i);
    const passwordInput = screen.getByPlaceholderText(/enter your password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/wrong password/i)).toBeInTheDocument();
    });
  });

  it('handles auth/invalid-email error code', async () => {
    (signIn as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Invalid email format',
    });

    render(<LoginPage />);
    
    const emailInput = screen.getByPlaceholderText(/you@braude.ac.il/i);
    const passwordInput = screen.getByPlaceholderText(/enter your password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });
  });

  it('handles auth/too-many-requests error code', async () => {
    (signIn as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Too many failed login attempts',
    });

    render(<LoginPage />);
    
    const emailInput = screen.getByPlaceholderText(/you@braude.ac.il/i);
    const passwordInput = screen.getByPlaceholderText(/enter your password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/too many failed login attempts/i)).toBeInTheDocument();
    });
  });

  it('handles network errors gracefully', async () => {
    (signIn as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Network error occurred',
    });

    render(<LoginPage />);
    
    const emailInput = screen.getByPlaceholderText(/you@braude.ac.il/i);
    const passwordInput = screen.getByPlaceholderText(/enter your password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/network error occurred/i)).toBeInTheDocument();
    });
  });

  it('clears error message after correcting input', async () => {
    (signIn as jest.Mock).mockResolvedValueOnce({
      success: false,
      error: 'Invalid credentials',
    }).mockResolvedValueOnce({
      success: true,
      user: { uid: 'test-uid' },
    });

    render(<LoginPage />);
    
    const emailInput = screen.getByPlaceholderText(/you@braude.ac.il/i);
    const passwordInput = screen.getByPlaceholderText(/enter your password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    // First attempt - incorrect credentials
    fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrong123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });

    // Second attempt - correct credentials
    fireEvent.change(emailInput, { target: { value: 'correct@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'correct123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/login successful!/i)).toBeInTheDocument();
    });
  });

  it('calls signIn with correct parameters', async () => {
    (signIn as jest.Mock).mockResolvedValue({
      success: true,
      user: { uid: 'test-uid' },
    });

    render(<LoginPage />);
    
    const emailInput = screen.getByPlaceholderText(/you@braude.ac.il/i);
    const passwordInput = screen.getByPlaceholderText(/enter your password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    const testEmail = 'test@example.com';
    const testPassword = 'password123';

    fireEvent.change(emailInput, { target: { value: testEmail } });
    fireEvent.change(passwordInput, { target: { value: testPassword } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith(testEmail, testPassword);
    });
  });
});

