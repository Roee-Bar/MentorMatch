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

describe('LoginPage - Enhanced Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Tests HTML5 validation triggers for required empty fields
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

  // Tests error message display when login fails
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

  // Tests success message display after successful authentication
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

  // Tests navigation to dashboard after successful authentication
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

  // Tests loading state displays with disabled button during async login
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

  // Tests error handling for user not found error
  it('should handle auth/user-not-found error code', async () => {
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

  // Tests error handling for wrong password error
  it('should handle auth/wrong-password error code', async () => {
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

  // Tests error handling for invalid email format error
  it('should handle auth/invalid-email error code', async () => {
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

  // Tests error handling for too many failed login attempts error
  it('should handle auth/too-many-requests error code', async () => {
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

  // Tests error handling for network connection errors
  it('should handle network errors gracefully', async () => {
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

  // Tests error message clears when retrying with correct credentials
  it('should clear error message after correcting input', async () => {
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

  // Tests signIn service is called with correct email and password parameters
  it('should call signIn with correct parameters', async () => {
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

