import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RegisterPage from '../page';
import { mockRouter } from '@/test-utils/integration-helpers';

// Mock Next.js components
jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter(),
}));

jest.mock('next/link', () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
  MockLink.displayName = 'MockLink';
  return MockLink;
});

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...props} />;
  },
}));

// Mock Firebase
jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  setDoc: jest.fn(),
}));

jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
}));

jest.mock('@/lib/firebase', () => ({
  auth: {},
  db: {},
  storage: {},
}));

import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc } from 'firebase/firestore';

describe('Registration Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Registration Flow', () => {
    it('should handle complete successful registration', async () => {
      // Mock successful registration
      (createUserWithEmailAndPassword as jest.Mock).mockResolvedValue({
        user: { uid: 'new-user-123' },
      });
      (setDoc as jest.Mock).mockResolvedValue(undefined);

      render(<RegisterPage />);

      // Fill all required fields
      const emailInput = screen.getByPlaceholderText(/student@braude.ac.il/i);
      const passwordInput = screen.getByPlaceholderText(/minimum 6 characters/i);
      const confirmPasswordInput = screen.getByPlaceholderText(/re-enter password/i);
      const firstNameInput = screen.getByPlaceholderText(/john/i);
      const lastNameInput = screen.getByPlaceholderText(/doe/i);
      const studentIdInput = screen.getByPlaceholderText(/e\.g\., 312345678/i);
      const phoneInput = screen.getByPlaceholderText(/050-1234567/i);
      const skillsInput = screen.getByPlaceholderText(/react, python/i);
      const interestsInput = screen.getByPlaceholderText(/describe your research interests/i);

      fireEvent.change(emailInput, { target: { value: 'newstudent@braude.ac.il' } });
      fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'Password123!' } });
      fireEvent.change(firstNameInput, { target: { value: 'John' } });
      fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
      fireEvent.change(studentIdInput, { target: { value: '316123456' } });
      fireEvent.change(phoneInput, { target: { value: '050-1234567' } });
      fireEvent.change(skillsInput, { target: { value: 'React, Node.js, Python' } });
      fireEvent.change(interestsInput, { target: { value: 'Web development and machine learning' } });
      
      // Fill department and academic year
      const departmentSelect = screen.getByDisplayValue('Select Department');
      fireEvent.change(departmentSelect, { target: { value: 'Computer Science' } });
      
      const yearSelect = screen.getByDisplayValue('Select Year');
      fireEvent.change(yearSelect, { target: { value: '4th Year' } });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /complete registration/i });
      fireEvent.click(submitButton);

      // Verify success message
      await waitFor(() => {
        expect(screen.getByText(/registration successful/i)).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    it('should show loading state during registration', async () => {
      // Mock delayed registration
      (createUserWithEmailAndPassword as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ user: { uid: '123' } }), 100))
      );

      render(<RegisterPage />);

      // Fill and submit form with all required fields
      fireEvent.change(screen.getByPlaceholderText(/student@braude.ac.il/i), {
        target: { value: 'test@braude.ac.il' },
      });
      fireEvent.change(screen.getByPlaceholderText(/minimum 6 characters/i), {
        target: { value: 'Password123!' },
      });
      fireEvent.change(screen.getByPlaceholderText(/re-enter password/i), {
        target: { value: 'Password123!' },
      });
      fireEvent.change(screen.getByPlaceholderText(/john/i), {
        target: { value: 'Test' },
      });
      fireEvent.change(screen.getByPlaceholderText(/doe/i), {
        target: { value: 'User' },
      });
      fireEvent.change(screen.getByPlaceholderText(/e\.g\., 312345678/i), {
        target: { value: '316123456' },
      });
      fireEvent.change(screen.getByPlaceholderText(/050-1234567/i), {
        target: { value: '050-1234567' },
      });
      
      // Fill department and academic year
      const departmentSelect = screen.getByDisplayValue('Select Department');
      fireEvent.change(departmentSelect, { target: { value: 'Computer Science' } });
      
      const yearSelect = screen.getByDisplayValue('Select Year');
      fireEvent.change(yearSelect, { target: { value: '4th Year' } });
      
      // Fill skills and interests
      fireEvent.change(screen.getByPlaceholderText(/react, python/i), {
        target: { value: 'React, Node.js' },
      });
      fireEvent.change(screen.getByPlaceholderText(/describe your research interests/i), {
        target: { value: 'Web development and AI' },
      });

      const submitButton = screen.getByRole('button', { name: /complete registration/i });
      fireEvent.click(submitButton);

      // Verify loading state
      expect(screen.getByText(/creating account/i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Registration Validation Chain', () => {
    it('should validate required fields', async () => {
      render(<RegisterPage />);

      // Try to submit empty form
      const submitButton = screen.getByRole('button', { name: /complete registration/i });
      fireEvent.click(submitButton);

      // Verify form validation (HTML5 required attribute)
      const emailInput = screen.getByPlaceholderText(/student@braude.ac.il/i);
      expect(emailInput).toBeInvalid();
    });

    it('should validate password match', async () => {
      render(<RegisterPage />);

      // Fill with mismatched passwords and all required fields
      fireEvent.change(screen.getByPlaceholderText(/student@braude.ac.il/i), {
        target: { value: 'test@braude.ac.il' },
      });
      fireEvent.change(screen.getByPlaceholderText(/minimum 6 characters/i), {
        target: { value: 'Password123!' },
      });
      fireEvent.change(screen.getByPlaceholderText(/re-enter password/i), {
        target: { value: 'DifferentPassword!' },
      });
      fireEvent.change(screen.getByPlaceholderText(/john/i), {
        target: { value: 'Test' },
      });
      fireEvent.change(screen.getByPlaceholderText(/doe/i), {
        target: { value: 'User' },
      });
      fireEvent.change(screen.getByPlaceholderText(/e\.g\., 312345678/i), {
        target: { value: '316123456' },
      });
      fireEvent.change(screen.getByPlaceholderText(/050-1234567/i), {
        target: { value: '050-1234567' },
      });
      
      // Fill department and academic year
      const departmentSelect = screen.getByDisplayValue('Select Department');
      fireEvent.change(departmentSelect, { target: { value: 'Computer Science' } });
      
      const yearSelect = screen.getByDisplayValue('Select Year');
      fireEvent.change(yearSelect, { target: { value: '4th Year' } });
      
      // Fill skills and interests
      fireEvent.change(screen.getByPlaceholderText(/react, python/i), {
        target: { value: 'React, Node.js' },
      });
      fireEvent.change(screen.getByPlaceholderText(/describe your research interests/i), {
        target: { value: 'Web development and AI' },
      });

      const submitButton = screen.getByRole('button', { name: /complete registration/i });
      fireEvent.click(submitButton);

      // Verify password mismatch error
      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });
    });

    it('should validate email format', async () => {
      render(<RegisterPage />);

      // Fill with invalid email
      const emailInput = screen.getByPlaceholderText(/student@braude.ac.il/i);
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

      // Try to submit
      const submitButton = screen.getByRole('button', { name: /complete registration/i });
      fireEvent.click(submitButton);

      // Verify email validation (HTML5)
      expect(emailInput).toBeInvalid();
    });
  });

  describe('Duplicate Email Handling', () => {
    it('should show error for existing email', async () => {
      // Suppress expected console.error during this test
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Mock duplicate email error
      (createUserWithEmailAndPassword as jest.Mock).mockRejectedValue({
        code: 'auth/email-already-in-use',
        message: 'Email already in use',
      });

      render(<RegisterPage />);

      // Fill form with all required fields
      fireEvent.change(screen.getByPlaceholderText(/student@braude.ac.il/i), {
        target: { value: 'existing@braude.ac.il' },
      });
      fireEvent.change(screen.getByPlaceholderText(/minimum 6 characters/i), {
        target: { value: 'Password123!' },
      });
      fireEvent.change(screen.getByPlaceholderText(/re-enter password/i), {
        target: { value: 'Password123!' },
      });
      fireEvent.change(screen.getByPlaceholderText(/john/i), {
        target: { value: 'Test' },
      });
      fireEvent.change(screen.getByPlaceholderText(/doe/i), {
        target: { value: 'User' },
      });
      fireEvent.change(screen.getByPlaceholderText(/e\.g\., 312345678/i), {
        target: { value: '316123456' },
      });
      fireEvent.change(screen.getByPlaceholderText(/050-1234567/i), {
        target: { value: '050-1234567' },
      });
      
      // Fill department and academic year
      const departmentSelect = screen.getByDisplayValue('Select Department');
      fireEvent.change(departmentSelect, { target: { value: 'Computer Science' } });
      
      const yearSelect = screen.getByDisplayValue('Select Year');
      fireEvent.change(yearSelect, { target: { value: '4th Year' } });
      
      // Fill skills and interests
      fireEvent.change(screen.getByPlaceholderText(/react, python/i), {
        target: { value: 'React, Node.js' },
      });
      fireEvent.change(screen.getByPlaceholderText(/describe your research interests/i), {
        target: { value: 'Web development and AI' },
      });

      const submitButton = screen.getByRole('button', { name: /complete registration/i });
      fireEvent.click(submitButton);

      // Verify duplicate email error message
      await waitFor(() => {
        expect(screen.getByText(/this email is already registered/i)).toBeInTheDocument();
      }, { timeout: 3000 });
      
      // Restore console.error
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Form Navigation', () => {
    it('should have link to login page', () => {
      render(<RegisterPage />);

      const loginLink = screen.getByRole('link', { name: /login here/i });
      expect(loginLink).toHaveAttribute('href', '/login');
    });

    it('should have link back to home', () => {
      render(<RegisterPage />);

      const homeLink = screen.getByRole('link', { name: /back to home/i });
      expect(homeLink).toHaveAttribute('href', '/');
    });
  });
});

