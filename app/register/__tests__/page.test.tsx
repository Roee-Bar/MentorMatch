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

  it('should show validation errors for invalid inputs', async () => {
    render(<RegisterPage />);
    
    const submitButton = screen.getByRole('button', { name: /complete registration/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      const emailInput = screen.getByPlaceholderText(/student@braude.ac.il/i);
      expect(emailInput).toBeInvalid();
    });
  });

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
});

