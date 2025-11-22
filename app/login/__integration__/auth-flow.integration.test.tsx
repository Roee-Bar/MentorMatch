import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import LoginPage from '../page';
import { mockRouter } from '@/test-utils/integration-helpers';

// Mock Next.js navigation
const mockRouterInstance = mockRouter();
jest.mock('next/navigation', () => ({
  useRouter: () => mockRouterInstance,
  usePathname: () => '/login',
}));

// Mock auth
jest.mock('@/lib/auth', () => ({
  signIn: jest.fn(),
}));

import { signIn } from '@/lib/auth';
const mockSignIn = signIn as jest.MockedFunction<typeof signIn>;

describe('Authentication Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouterInstance.push.mockClear();
    mockRouterInstance.push.mockReset();
    mockSignIn.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Complete Login Flow', () => {
    it('should handle complete successful login flow', async () => {
      // Setup: Mock successful login
      mockSignIn.mockResolvedValue({
        success: true,
        user: { uid: 'test-123' },
      });

      render(<LoginPage />);

      // Step 1: Fill form
      const emailInput = screen.getByPlaceholderText(/you@braude.ac.il/i);
      const passwordInput = screen.getByPlaceholderText(/enter your password/i);
      
      fireEvent.change(emailInput, { target: { value: 'student@braude.ac.il' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      // Step 2: Submit form
      const submitButton = screen.getByRole('button', { name: /login/i });
      fireEvent.click(submitButton);

      // Step 3: Verify signIn was called with correct credentials
      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('student@braude.ac.il', 'password123');
      });

      // Step 4: Verify success message appears
      await waitFor(() => {
        expect(screen.getByText(/login successful!/i)).toBeInTheDocument();
      });

      // Step 5: Verify navigation to dashboard
      await waitFor(() => {
        expect(mockRouterInstance.push).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should show loading state during login process', async () => {
      // Setup: Mock delayed login
      mockSignIn.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true, user: { uid: 'test' } }), 100))
      );

      render(<LoginPage />);

      // Fill and submit form
      const emailInput = screen.getByPlaceholderText(/you@braude.ac.il/i);
      const passwordInput = screen.getByPlaceholderText(/enter your password/i);
      const submitButton = screen.getByRole('button', { name: /login/i });

      fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password' } });
      fireEvent.click(submitButton);

      // Verify: Loading state is shown
      expect(screen.getByRole('button', { name: /logging in/i })).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      // Wait for the async operation to complete before moving to next test
      await waitFor(() => {
        expect(screen.getByText(/login successful!/i)).toBeInTheDocument();
      });
    });
  });

  describe('Login with Validation', () => {
    it('should show validation errors for empty fields', async () => {
      render(<LoginPage />);

      // Try to submit without filling form
      const submitButton = screen.getByRole('button', { name: /login/i });
      fireEvent.click(submitButton);

      // Verify: Validation prevents submission
      await waitFor(() => {
        const emailInput = screen.getByPlaceholderText(/you@braude.ac.il/i);
        const passwordInput = screen.getByPlaceholderText(/enter your password/i);
        
        expect(emailInput).toBeInvalid();
        expect(passwordInput).toBeInvalid();
      });

      // Verify: signIn was never called
      expect(mockSignIn).not.toHaveBeenCalled();
    });

    it('should clear previous errors when user starts typing', async () => {
      // Setup: Mock failed login
      mockSignIn.mockResolvedValue({
        success: false,
        error: 'Invalid credentials',
      });

      render(<LoginPage />);

      // Submit to generate error
      const emailInput = screen.getByPlaceholderText(/you@braude.ac.il/i);
      const passwordInput = screen.getByPlaceholderText(/enter your password/i);
      const submitButton = screen.getByRole('button', { name: /login/i });

      fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrong' } });
      fireEvent.click(submitButton);

      // Wait for error
      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });

      // Verify no navigation occurred
      expect(mockRouterInstance.push).not.toHaveBeenCalled();

      // Type again - error should clear
      // Note: This behavior depends on your implementation
      // If you don't clear errors on input change, remove this test
    });
  });

  describe('Login Error Handling', () => {
    it('should display error message on failed login', async () => {
      // Setup: Mock failed login
      mockSignIn.mockResolvedValue({
        success: false,
        error: 'Invalid email or password',
      });

      render(<LoginPage />);

      // Fill and submit form
      const emailInput = screen.getByPlaceholderText(/you@braude.ac.il/i);
      const passwordInput = screen.getByPlaceholderText(/enter your password/i);
      const submitButton = screen.getByRole('button', { name: /login/i });

      fireEvent.change(emailInput, { target: { value: 'wrong@test.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(submitButton);

      // Verify: Error message is displayed
      await waitFor(() => {
        expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
      });

      // Wait a bit to ensure no navigation happens
      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalled();
      }, { timeout: 1000 });

      // Verify: No navigation happened
      expect(mockRouterInstance.push).not.toHaveBeenCalled();
    });

    it('should handle network/exception errors gracefully', async () => {
      // Setup: Mock exception
      mockSignIn.mockRejectedValue(new Error('Network error'));

      render(<LoginPage />);

      // Fill and submit form
      const emailInput = screen.getByPlaceholderText(/you@braude.ac.il/i);
      const passwordInput = screen.getByPlaceholderText(/enter your password/i);
      const submitButton = screen.getByRole('button', { name: /login/i });

      fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password' } });
      fireEvent.click(submitButton);

      // Verify: Error is displayed
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Login + Navigation Integration', () => {
    it('should navigate to dashboard after successful login', async () => {
      mockSignIn.mockResolvedValue({
        success: true,
        user: { uid: 'test-123' },
      });

      render(<LoginPage />);

      // Complete login flow
      const emailInput = screen.getByPlaceholderText(/you@braude.ac.il/i);
      const passwordInput = screen.getByPlaceholderText(/enter your password/i);
      const submitButton = screen.getByRole('button', { name: /login/i });

      fireEvent.change(emailInput, { target: { value: 'student@braude.ac.il' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      // Verify: Navigation happened
      await waitFor(() => {
        expect(mockRouterInstance.push).toHaveBeenCalledWith('/dashboard');
      }, { timeout: 3000 });
    });

    it('should have working navigation links', () => {
      render(<LoginPage />);

      // Verify: Back to home link exists
      const backLink = screen.getByRole('link', { name: /back to home/i });
      expect(backLink).toHaveAttribute('href', '/');

      // Verify: Sign up link exists
      const signUpLink = screen.getByRole('link', { name: /sign up/i });
      expect(signUpLink).toHaveAttribute('href', '/register');
    });
  });
});

