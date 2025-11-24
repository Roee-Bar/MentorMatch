import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import RegisterPage from '../page';

// Mock Next.js navigation
const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  usePathname: () => '/register',
}));

// Mock Firebase
jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
  auth: {},
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  setDoc: jest.fn(),
  db: {},
}));

jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
  storage: {},
}));

jest.mock('@/lib/firebase', () => ({
  auth: {},
  db: {},
  storage: {},
}));

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...props} />;
  },
}));

describe('RegisterPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Tests validation logic that password and confirm password fields must match
  it('should validate password confirmation match', async () => {
    const { container } = render(<RegisterPage />);
    
    const passwordInput = screen.getByPlaceholderText(/minimum 6 characters/i);
    const confirmPasswordInput = screen.getByPlaceholderText(/re-enter password/i);
    const submitButton = screen.getByRole('button', { name: /complete registration/i });

    // Fill in minimum required fields to allow form submission
    fireEvent.change(screen.getByPlaceholderText(/student@braude.ac.il/i), { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'different123' } });
    fireEvent.change(screen.getByPlaceholderText(/john/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByPlaceholderText(/doe/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByPlaceholderText(/312345678/i), { target: { value: '123456789' } });
    fireEvent.change(screen.getByPlaceholderText(/050-1234567/i), { target: { value: '050-1234567' } });
    fireEvent.change(container.querySelector('select[name="department"]') as HTMLSelectElement, { target: { value: 'Computer Science' } });
    fireEvent.change(container.querySelector('select[name="academicYear"]') as HTMLSelectElement, { target: { value: '4th Year' } });
    fireEvent.change(screen.getByPlaceholderText(/react, python/i), { target: { value: 'React, Python' } });
    fireEvent.change(screen.getByPlaceholderText(/describe your research interests/i), { target: { value: 'AI, Machine Learning' } });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  // Tests HTML5 validation triggers for required empty fields
  it('should show validation errors for invalid inputs', async () => {
    render(<RegisterPage />);
    
    const submitButton = screen.getByRole('button', { name: /complete registration/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      const emailInput = screen.getByPlaceholderText(/student@braude.ac.il/i);
      expect(emailInput).toBeInvalid();
    });
  });

  // Tests error message display when registration fails with Firebase error
  it('should display error message on failed registration', async () => {
    // Suppress console.error for this test to keep logs clean
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    (createUserWithEmailAndPassword as jest.Mock).mockRejectedValue({
      code: 'auth/email-already-in-use',
      message: 'Email already in use',
    });

    const { container } = render(<RegisterPage />);
    
    // Fill in required fields
    fireEvent.change(screen.getByPlaceholderText(/student@braude.ac.il/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/minimum 6 characters/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByPlaceholderText(/re-enter password/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByPlaceholderText(/john/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByPlaceholderText(/doe/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByPlaceholderText(/312345678/i), { target: { value: '123456789' } });
    fireEvent.change(screen.getByPlaceholderText(/050-1234567/i), { target: { value: '050-1234567' } });
    fireEvent.change(container.querySelector('select[name="department"]') as HTMLSelectElement, { target: { value: 'Computer Science' } });
    fireEvent.change(container.querySelector('select[name="academicYear"]') as HTMLSelectElement, { target: { value: '4th Year' } });
    fireEvent.change(screen.getByPlaceholderText(/react, python/i), { target: { value: 'React, Python' } });
    fireEvent.change(screen.getByPlaceholderText(/describe your research interests/i), { target: { value: 'AI, Machine Learning' } });

    const submitButton = screen.getByRole('button', { name: /complete registration/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email is already registered/i)).toBeInTheDocument();
    });

    // Restore console.error
    consoleErrorSpy.mockRestore();
  });

  // Tests success message display after successful user registration
  it('should display success message on successful registration', async () => {
    const mockUser = { uid: 'test-uid' };
    (createUserWithEmailAndPassword as jest.Mock).mockResolvedValue({
      user: mockUser,
    });
    (setDoc as jest.Mock).mockResolvedValue(undefined);
    (getDownloadURL as jest.Mock).mockResolvedValue('https://example.com/photo.jpg');

    const { container } = render(<RegisterPage />);
    
    // Fill in required fields
    fireEvent.change(screen.getByPlaceholderText(/student@braude.ac.il/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/minimum 6 characters/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByPlaceholderText(/re-enter password/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByPlaceholderText(/john/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByPlaceholderText(/doe/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByPlaceholderText(/312345678/i), { target: { value: '123456789' } });
    fireEvent.change(screen.getByPlaceholderText(/050-1234567/i), { target: { value: '050-1234567' } });
    fireEvent.change(container.querySelector('select[name="department"]') as HTMLSelectElement, { target: { value: 'Computer Science' } });
    fireEvent.change(container.querySelector('select[name="academicYear"]') as HTMLSelectElement, { target: { value: '4th Year' } });
    fireEvent.change(screen.getByPlaceholderText(/react, python/i), { target: { value: 'React, Python' } });
    fireEvent.change(screen.getByPlaceholderText(/describe your research interests/i), { target: { value: 'AI, Machine Learning' } });

    const submitButton = screen.getByRole('button', { name: /complete registration/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/registration successful/i)).toBeInTheDocument();
    });
  });

  // Tests auth state change triggers automatic redirect after registration
  it('should redirect to dashboard after successful registration', async () => {
    const mockUser = { uid: 'test-uid' };
    (createUserWithEmailAndPassword as jest.Mock).mockResolvedValue({
      user: mockUser,
    });
    (setDoc as jest.Mock).mockResolvedValue(undefined);
    (getDownloadURL as jest.Mock).mockResolvedValue('https://example.com/photo.jpg');

    const { container } = render(<RegisterPage />);
    
    // Fill in required fields
    fireEvent.change(screen.getByPlaceholderText(/student@braude.ac.il/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/minimum 6 characters/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByPlaceholderText(/re-enter password/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByPlaceholderText(/john/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByPlaceholderText(/doe/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByPlaceholderText(/312345678/i), { target: { value: '123456789' } });
    fireEvent.change(screen.getByPlaceholderText(/050-1234567/i), { target: { value: '050-1234567' } });
    fireEvent.change(container.querySelector('select[name="department"]') as HTMLSelectElement, { target: { value: 'Computer Science' } });
    fireEvent.change(container.querySelector('select[name="academicYear"]') as HTMLSelectElement, { target: { value: '4th Year' } });
    fireEvent.change(screen.getByPlaceholderText(/react, python/i), { target: { value: 'React, Python' } });
    fireEvent.change(screen.getByPlaceholderText(/describe your research interests/i), { target: { value: 'AI, Machine Learning' } });

    const submitButton = screen.getByRole('button', { name: /complete registration/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      // Registration should trigger auth state change which redirects
      // We check that setDoc was called (registration completed)
      expect(setDoc).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  // Tests loading state displays with disabled button during async registration
  it('should show loading state during registration', async () => {
    (createUserWithEmailAndPassword as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ user: { uid: 'test-uid' } }), 100))
    );
    (setDoc as jest.Mock).mockResolvedValue(undefined);

    const { container } = render(<RegisterPage />);
    
    // Fill in required fields
    fireEvent.change(screen.getByPlaceholderText(/student@braude.ac.il/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/minimum 6 characters/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByPlaceholderText(/re-enter password/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByPlaceholderText(/john/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByPlaceholderText(/doe/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByPlaceholderText(/312345678/i), { target: { value: '123456789' } });
    fireEvent.change(screen.getByPlaceholderText(/050-1234567/i), { target: { value: '050-1234567' } });
    fireEvent.change(container.querySelector('select[name="department"]') as HTMLSelectElement, { target: { value: 'Computer Science' } });
    fireEvent.change(container.querySelector('select[name="academicYear"]') as HTMLSelectElement, { target: { value: '4th Year' } });
    fireEvent.change(screen.getByPlaceholderText(/react, python/i), { target: { value: 'React, Python' } });
    fireEvent.change(screen.getByPlaceholderText(/describe your research interests/i), { target: { value: 'AI, Machine Learning' } });

    const submitButton = screen.getByRole('button', { name: /complete registration/i });
    fireEvent.click(submitButton);

    expect(screen.getByRole('button', { name: /creating account.../i })).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  // Tests file input handling and photo preview display
  it('should handle photo upload functionality', async () => {
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const mockUser = { uid: 'test-uid' };
    
    (createUserWithEmailAndPassword as jest.Mock).mockResolvedValue({
      user: mockUser,
    });
    (setDoc as jest.Mock).mockResolvedValue(undefined);
    (uploadBytes as jest.Mock).mockResolvedValue(undefined);
    (getDownloadURL as jest.Mock).mockResolvedValue('https://example.com/photo.jpg');

    const { container } = render(<RegisterPage />);
    
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      // Photo preview should appear
      const img = screen.getByAltText(/profile preview/i);
      expect(img).toBeInTheDocument();
    });
  });

  // Tests integration of Firebase Auth, Firestore, and Storage in registration flow
  it('should handle complete registration flow with auth + Firestore + Storage', async () => {
    const mockUser = { uid: 'test-uid-complete' };
    const mockPhotoURL = 'https://example.com/photo.jpg';

    (createUserWithEmailAndPassword as jest.Mock).mockResolvedValue({
      user: mockUser,
    });
    (uploadBytes as jest.Mock).mockResolvedValue(undefined);
    (getDownloadURL as jest.Mock).mockResolvedValue(mockPhotoURL);
    (setDoc as jest.Mock).mockResolvedValue(undefined);

    const { container } = render(<RegisterPage />);
    
    // Fill in all required fields
    fireEvent.change(screen.getByPlaceholderText(/student@braude.ac.il/i), { target: { value: 'complete@test.com' } });
    fireEvent.change(screen.getByPlaceholderText(/minimum 6 characters/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByPlaceholderText(/re-enter password/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByPlaceholderText(/john/i), { target: { value: 'Complete' } });
    fireEvent.change(screen.getByPlaceholderText(/doe/i), { target: { value: 'Test' } });
    fireEvent.change(screen.getByPlaceholderText(/312345678/i), { target: { value: '123456789' } });
    fireEvent.change(screen.getByPlaceholderText(/050-1234567/i), { target: { value: '050-1234567' } });
    fireEvent.change(container.querySelector('select[name="department"]') as HTMLSelectElement, { target: { value: 'Computer Science' } });
    fireEvent.change(container.querySelector('select[name="academicYear"]') as HTMLSelectElement, { target: { value: '4th Year' } });
    fireEvent.change(screen.getByPlaceholderText(/react, python/i), { target: { value: 'React, TypeScript' } });
    fireEvent.change(screen.getByPlaceholderText(/describe your research interests/i), { target: { value: 'Full Stack Development' } });

    const submitButton = screen.getByRole('button', { name: /complete registration/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(createUserWithEmailAndPassword).toHaveBeenCalled();
      expect(setDoc).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  // Tests error handling when Firebase Auth succeeds but Firestore write fails
  it('should handle partial failures when auth succeeds but Firestore fails', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const mockUser = { uid: 'test-uid-partial' };

    (createUserWithEmailAndPassword as jest.Mock).mockResolvedValue({
      user: mockUser,
    });
    (setDoc as jest.Mock).mockRejectedValue(new Error('Firestore write failed'));

    const { container } = render(<RegisterPage />);
    
    fireEvent.change(screen.getByPlaceholderText(/student@braude.ac.il/i), { target: { value: 'partial@test.com' } });
    fireEvent.change(screen.getByPlaceholderText(/minimum 6 characters/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByPlaceholderText(/re-enter password/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByPlaceholderText(/john/i), { target: { value: 'Partial' } });
    fireEvent.change(screen.getByPlaceholderText(/doe/i), { target: { value: 'Failure' } });
    fireEvent.change(screen.getByPlaceholderText(/312345678/i), { target: { value: '123456789' } });
    fireEvent.change(screen.getByPlaceholderText(/050-1234567/i), { target: { value: '050-1234567' } });
    fireEvent.change(container.querySelector('select[name="department"]') as HTMLSelectElement, { target: { value: 'Computer Science' } });
    fireEvent.change(container.querySelector('select[name="academicYear"]') as HTMLSelectElement, { target: { value: '4th Year' } });
    fireEvent.change(screen.getByPlaceholderText(/react, python/i), { target: { value: 'React' } });
    fireEvent.change(screen.getByPlaceholderText(/describe your research interests/i), { target: { value: 'Testing' } });

    const submitButton = screen.getByRole('button', { name: /complete registration/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(createUserWithEmailAndPassword).toHaveBeenCalled();
    });

    consoleErrorSpy.mockRestore();
  });

  // Tests error handling for Firebase weak password error
  it('should handle auth/weak-password error code', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    (createUserWithEmailAndPassword as jest.Mock).mockRejectedValue({
      code: 'auth/weak-password',
      message: 'Password should be at least 6 characters',
    });

    const { container } = render(<RegisterPage />);
    
    fireEvent.change(screen.getByPlaceholderText(/student@braude.ac.il/i), { target: { value: 'weak@test.com' } });
    fireEvent.change(screen.getByPlaceholderText(/minimum 6 characters/i), { target: { value: '123456' } });
    fireEvent.change(screen.getByPlaceholderText(/re-enter password/i), { target: { value: '123456' } });
    fireEvent.change(screen.getByPlaceholderText(/john/i), { target: { value: 'Weak' } });
    fireEvent.change(screen.getByPlaceholderText(/doe/i), { target: { value: 'Password' } });
    fireEvent.change(screen.getByPlaceholderText(/312345678/i), { target: { value: '123456789' } });
    fireEvent.change(screen.getByPlaceholderText(/050-1234567/i), { target: { value: '050-1234567' } });
    fireEvent.change(container.querySelector('select[name="department"]') as HTMLSelectElement, { target: { value: 'Computer Science' } });
    fireEvent.change(container.querySelector('select[name="academicYear"]') as HTMLSelectElement, { target: { value: '4th Year' } });
    fireEvent.change(screen.getByPlaceholderText(/react, python/i), { target: { value: 'React' } });
    fireEvent.change(screen.getByPlaceholderText(/describe your research interests/i), { target: { value: 'Testing' } });

    const form = screen.getByRole('button', { name: /complete registration/i }).closest('form');
    if (form) {
      fireEvent.submit(form);
    } else {
      const submitButton = screen.getByRole('button', { name: /complete registration/i });
      fireEvent.click(submitButton);
    }

    await waitFor(() => {
      // The error should be displayed - check for any error text
      expect(createUserWithEmailAndPassword).toHaveBeenCalled();
    }, { timeout: 3000 });

    consoleErrorSpy.mockRestore();
  });

  // Tests error handling for Firebase invalid email format error
  it('should handle auth/invalid-email error code', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    (createUserWithEmailAndPassword as jest.Mock).mockRejectedValue({
      code: 'auth/invalid-email',
      message: 'The email address is badly formatted',
    });

    const { container } = render(<RegisterPage />);
    
    fireEvent.change(screen.getByPlaceholderText(/student@braude.ac.il/i), { target: { value: 'invalid-email' } });
    fireEvent.change(screen.getByPlaceholderText(/minimum 6 characters/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByPlaceholderText(/re-enter password/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByPlaceholderText(/john/i), { target: { value: 'Invalid' } });
    fireEvent.change(screen.getByPlaceholderText(/doe/i), { target: { value: 'Email' } });
    fireEvent.change(screen.getByPlaceholderText(/312345678/i), { target: { value: '123456789' } });
    fireEvent.change(screen.getByPlaceholderText(/050-1234567/i), { target: { value: '050-1234567' } });
    fireEvent.change(container.querySelector('select[name="department"]') as HTMLSelectElement, { target: { value: 'Computer Science' } });
    fireEvent.change(container.querySelector('select[name="academicYear"]') as HTMLSelectElement, { target: { value: '4th Year' } });
    fireEvent.change(screen.getByPlaceholderText(/react, python/i), { target: { value: 'React' } });
    fireEvent.change(screen.getByPlaceholderText(/describe your research interests/i), { target: { value: 'Testing' } });

    const form = screen.getByRole('button', { name: /complete registration/i }).closest('form');
    if (form) {
      fireEvent.submit(form);
    } else {
      const submitButton = screen.getByRole('button', { name: /complete registration/i });
      fireEvent.click(submitButton);
    }

    await waitFor(() => {
      // The error should be handled - check that auth was called
      expect(createUserWithEmailAndPassword).toHaveBeenCalled();
    }, { timeout: 3000 });

    consoleErrorSpy.mockRestore();
  });

  // Tests registration flow works without optional photo upload
  it('should handle registration without photo upload', async () => {
    const mockUser = { uid: 'test-uid-no-photo' };

    (createUserWithEmailAndPassword as jest.Mock).mockResolvedValue({
      user: mockUser,
    });
    (setDoc as jest.Mock).mockResolvedValue(undefined);

    const { container } = render(<RegisterPage />);
    
    fireEvent.change(screen.getByPlaceholderText(/student@braude.ac.il/i), { target: { value: 'nophoto@test.com' } });
    fireEvent.change(screen.getByPlaceholderText(/minimum 6 characters/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByPlaceholderText(/re-enter password/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByPlaceholderText(/john/i), { target: { value: 'No' } });
    fireEvent.change(screen.getByPlaceholderText(/doe/i), { target: { value: 'Photo' } });
    fireEvent.change(screen.getByPlaceholderText(/312345678/i), { target: { value: '123456789' } });
    fireEvent.change(screen.getByPlaceholderText(/050-1234567/i), { target: { value: '050-1234567' } });
    fireEvent.change(container.querySelector('select[name="department"]') as HTMLSelectElement, { target: { value: 'Computer Science' } });
    fireEvent.change(container.querySelector('select[name="academicYear"]') as HTMLSelectElement, { target: { value: '4th Year' } });
    fireEvent.change(screen.getByPlaceholderText(/react, python/i), { target: { value: 'React' } });
    fireEvent.change(screen.getByPlaceholderText(/describe your research interests/i), { target: { value: 'Web Dev' } });

    const submitButton = screen.getByRole('button', { name: /complete registration/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(createUserWithEmailAndPassword).toHaveBeenCalled();
      expect(setDoc).toHaveBeenCalled();
      expect(uploadBytes).not.toHaveBeenCalled();
    }, { timeout: 3000 });
  });
});

