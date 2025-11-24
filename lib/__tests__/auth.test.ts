// Unit tests for Auth Module
import { signUp, signIn, signOut, getUserProfile, onAuthChange } from '../auth';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// Mock Firebase modules
jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
}));

jest.mock('../firebase', () => ({
  auth: {},
  db: {},
  storage: {},
}));

describe('Auth Module - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock doc to return a document reference object
    (doc as jest.Mock).mockReturnValue({ id: 'mock-doc-ref' });
  });

  // ============================================
  // SIGN UP TESTS
  // ============================================
  describe('signUp', () => {
    const mockEmail = 'test@braude.ac.il';
    const mockPassword = 'password123';
    const mockUserData = {
      name: 'Test User',
      role: 'student',
      department: 'Computer Science',
    };

    // Verifies successful user account creation with Firebase Auth and Firestore document creation
    it('should successfully create user account and Firestore document', async () => {
      const mockUser = { uid: 'test-uid' };
      const mockUserCredential = { user: mockUser };

      (createUserWithEmailAndPassword as jest.Mock).mockResolvedValue(mockUserCredential);
      (setDoc as jest.Mock).mockResolvedValue(undefined);

      const result = await signUp(mockEmail, mockPassword, mockUserData);

      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith({}, mockEmail, mockPassword);
      expect(setDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          userId: 'test-uid',
          email: mockEmail,
          name: mockUserData.name,
          role: mockUserData.role,
          department: mockUserData.department,
          createdAt: expect.any(Date),
        })
      );
    });

    // Tests error handling when email is already registered
    it('should handle auth/email-already-in-use error', async () => {
      const mockError = {
        code: 'auth/email-already-in-use',
        message: 'Email already in use',
      };

      (createUserWithEmailAndPassword as jest.Mock).mockRejectedValue(mockError);

      const result = await signUp(mockEmail, mockPassword, mockUserData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email already in use');
    });

    // Tests error handling for weak password validation
    it('should handle auth/weak-password error', async () => {
      const mockError = {
        code: 'auth/weak-password',
        message: 'Password is too weak',
      };

      (createUserWithEmailAndPassword as jest.Mock).mockRejectedValue(mockError);

      const result = await signUp(mockEmail, mockPassword, mockUserData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Password is too weak');
    });

    // Tests error handling for invalid email format during signup
    it('should handle auth/invalid-email error', async () => {
      const mockError = {
        code: 'auth/invalid-email',
        message: 'Invalid email format',
      };

      (createUserWithEmailAndPassword as jest.Mock).mockRejectedValue(mockError);

      const result = await signUp('invalid-email', mockPassword, mockUserData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email format');
    });

    // Tests error handling for unknown/generic errors during signup
    it('should handle generic errors', async () => {
      const mockError = {
        message: 'Unknown error occurred',
      };

      (createUserWithEmailAndPassword as jest.Mock).mockRejectedValue(mockError);

      const result = await signUp(mockEmail, mockPassword, mockUserData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown error occurred');
    });

    // Verifies Firestore user document contains correct data structure with all required fields
    it('should create user document with correct structure', async () => {
      const mockUser = { uid: 'test-uid-123' };
      const mockUserCredential = { user: mockUser };

      (createUserWithEmailAndPassword as jest.Mock).mockResolvedValue(mockUserCredential);
      (setDoc as jest.Mock).mockResolvedValue(undefined);

      await signUp(mockEmail, mockPassword, mockUserData);

      expect(setDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          userId: 'test-uid-123',
          email: mockEmail,
          name: mockUserData.name,
          role: mockUserData.role,
          department: mockUserData.department,
          createdAt: expect.any(Date),
        })
      );
    });

    // Tests that signup handles optional department field with default empty string
    it('should handle missing department in userData', async () => {
      const mockUser = { uid: 'test-uid' };
      const mockUserCredential = { user: mockUser };
      const userDataWithoutDept = {
        name: 'Test User',
        role: 'student',
      };

      (createUserWithEmailAndPassword as jest.Mock).mockResolvedValue(mockUserCredential);
      (setDoc as jest.Mock).mockResolvedValue(undefined);

      const result = await signUp(mockEmail, mockPassword, userDataWithoutDept);

      expect(result.success).toBe(true);
      expect(setDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          department: '',
        })
      );
    });
  });

  // ============================================
  // SIGN IN TESTS
  // ============================================
  describe('signIn', () => {
    const mockEmail = 'test@braude.ac.il';
    const mockPassword = 'password123';

    // Verifies successful authentication with valid email and password
    it('should successfully sign in with valid credentials', async () => {
      const mockUser = { uid: 'test-uid', email: mockEmail };
      const mockUserCredential = { user: mockUser };

      (signInWithEmailAndPassword as jest.Mock).mockResolvedValue(mockUserCredential);

      const result = await signIn(mockEmail, mockPassword);

      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith({}, mockEmail, mockPassword);
    });

    // Tests error handling when user account doesn't exist
    it('should handle auth/user-not-found error', async () => {
      const mockError = {
        code: 'auth/user-not-found',
        message: 'User not found',
      };

      (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(mockError);

      const result = await signIn(mockEmail, mockPassword);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });

    // Tests error handling for incorrect password
    it('should handle auth/wrong-password error', async () => {
      const mockError = {
        code: 'auth/wrong-password',
        message: 'Wrong password',
      };

      (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(mockError);

      const result = await signIn(mockEmail, mockPassword);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Wrong password');
    });

    // Tests error handling for invalid email format during signin
    it('should handle auth/invalid-email error', async () => {
      const mockError = {
        code: 'auth/invalid-email',
        message: 'Invalid email format',
      };

      (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(mockError);

      const result = await signIn('invalid-email', mockPassword);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email format');
    });

    // Tests error handling for invalid credentials error
    it('should handle auth/invalid-credential error', async () => {
      const mockError = {
        code: 'auth/invalid-credential',
        message: 'Invalid credentials',
      };

      (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(mockError);

      const result = await signIn(mockEmail, mockPassword);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
    });

    // Verifies signin returns correct response structure on success with user object
    it('should return correct structure on success', async () => {
      const mockUser = { uid: 'test-uid', email: mockEmail, displayName: 'Test User' };
      const mockUserCredential = { user: mockUser };

      (signInWithEmailAndPassword as jest.Mock).mockResolvedValue(mockUserCredential);

      const result = await signIn(mockEmail, mockPassword);

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('user', mockUser);
      expect(result).not.toHaveProperty('error');
    });

    // Verifies signin returns correct error response structure on failure
    it('should return correct structure on failure', async () => {
      const mockError = {
        message: 'Authentication failed',
      };

      (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(mockError);

      const result = await signIn(mockEmail, mockPassword);

      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error', 'Authentication failed');
      expect(result).not.toHaveProperty('user');
    });
  });

  // ============================================
  // SIGN OUT TESTS
  // ============================================
  describe('signOut', () => {
    // Verifies successful user logout with Firebase Auth
    it('should successfully sign out user', async () => {
      (firebaseSignOut as jest.Mock).mockResolvedValue(undefined);

      const result = await signOut();

      expect(result.success).toBe(true);
      expect(firebaseSignOut).toHaveBeenCalledWith({});
    });

    // Tests error handling when signout operation fails
    it('should handle sign out error', async () => {
      const mockError = {
        message: 'Sign out failed',
      };

      (firebaseSignOut as jest.Mock).mockRejectedValue(mockError);

      const result = await signOut();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Sign out failed');
    });

    // Verifies signout returns success response structure without errors
    it('should return correct structure on success', async () => {
      (firebaseSignOut as jest.Mock).mockResolvedValue(undefined);

      const result = await signOut();

      expect(result).toHaveProperty('success', true);
      expect(result).not.toHaveProperty('error');
    });

    // Verifies signout returns correct error response structure on failure
    it('should return correct structure on failure', async () => {
      const mockError = {
        message: 'Network error',
      };

      (firebaseSignOut as jest.Mock).mockRejectedValue(mockError);

      const result = await signOut();

      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error', 'Network error');
    });
  });

  // ============================================
  // GET USER PROFILE TESTS
  // ============================================
  describe('getUserProfile', () => {
    const mockUid = 'test-uid';
    const mockUserData = {
      userId: mockUid,
      email: 'test@braude.ac.il',
      name: 'Test User',
      role: 'student',
      department: 'Computer Science',
      createdAt: new Date(),
    };

    // Verifies successful retrieval of user profile data from Firestore
    it('should successfully fetch user profile', async () => {
      const mockDoc = {
        exists: () => true,
        data: () => mockUserData,
      };

      (getDoc as jest.Mock).mockResolvedValue(mockDoc);

      const result = await getUserProfile(mockUid);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUserData);
      expect(getDoc).toHaveBeenCalledTimes(1);
    });

    // Tests error handling when user document doesn't exist in Firestore
    it('should return error when user does not exist', async () => {
      const mockDoc = {
        exists: () => false,
      };

      (getDoc as jest.Mock).mockResolvedValue(mockDoc);

      const result = await getUserProfile(mockUid);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });

    // Tests error handling for Firestore connection or query errors
    it('should handle Firestore errors', async () => {
      const mockError = {
        message: 'Firestore connection error',
      };

      (getDoc as jest.Mock).mockRejectedValue(mockError);

      const result = await getUserProfile(mockUid);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Firestore connection error');
    });

    // Verifies getUserProfile returns correct success response structure with data
    it('should return correct structure on success', async () => {
      const mockDoc = {
        exists: () => true,
        data: () => mockUserData,
      };

      (getDoc as jest.Mock).mockResolvedValue(mockDoc);

      const result = await getUserProfile(mockUid);

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('data', mockUserData);
      expect(result).not.toHaveProperty('error');
    });

    // Verifies getUserProfile returns correct error response structure on failure
    it('should return correct structure on failure', async () => {
      const mockDoc = {
        exists: () => false,
      };

      (getDoc as jest.Mock).mockResolvedValue(mockDoc);

      const result = await getUserProfile(mockUid);

      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error');
      expect(result).not.toHaveProperty('data');
    });

    // Tests handling of null user data from Firestore document
    it('should handle missing user data gracefully', async () => {
      const mockDoc = {
        exists: () => true,
        data: () => null,
      };

      (getDoc as jest.Mock).mockResolvedValue(mockDoc);

      const result = await getUserProfile(mockUid);

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });
  });

  // ============================================
  // ON AUTH CHANGE TESTS
  // ============================================
  describe('onAuthChange', () => {
    // Verifies auth state listener calls callback with user object when authenticated
    it('should call callback with authenticated user', () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'test@braude.ac.il',
        displayName: 'Test User',
      } as User;
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();

      (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
        callback(mockUser);
        return mockUnsubscribe;
      });

      const unsubscribe = onAuthChange(mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(mockUser);
      expect(onAuthStateChanged).toHaveBeenCalledWith({}, mockCallback);
      expect(unsubscribe).toBe(mockUnsubscribe);
    });

    // Tests auth state listener calls callback with null when user is not authenticated
    it('should call callback with null for logged out user', () => {
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();

      (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
        callback(null);
        return mockUnsubscribe;
      });

      const unsubscribe = onAuthChange(mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(null);
    });

    // Verifies auth listener returns unsubscribe function for cleanup
    it('should return unsubscribe function', () => {
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();

      (onAuthStateChanged as jest.Mock).mockReturnValue(mockUnsubscribe);

      const unsubscribe = onAuthChange(mockCallback);

      expect(typeof unsubscribe).toBe('function');
      expect(unsubscribe).toBe(mockUnsubscribe);
    });

    // Tests that callback receives complete user object with all properties
    it('should pass correct user object to callback', () => {
      const mockUser = {
        uid: 'specific-uid',
        email: 'specific@email.com',
        displayName: 'Specific User',
        emailVerified: true,
      } as User;
      const mockCallback = jest.fn();

      (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });

      onAuthChange(mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          uid: 'specific-uid',
          email: 'specific@email.com',
          displayName: 'Specific User',
          emailVerified: true,
        })
      );
    });

    // Verifies unsubscribe function can be called to stop listening to auth changes
    it('should allow unsubscribe to be called', () => {
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();

      (onAuthStateChanged as jest.Mock).mockReturnValue(mockUnsubscribe);

      const unsubscribe = onAuthChange(mockCallback);
      unsubscribe();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    // Tests that auth listener handles multiple state transitions correctly
    it('should handle multiple auth state changes', () => {
      const mockCallback = jest.fn();
      let authCallback: any;

      (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
        authCallback = callback;
        return jest.fn();
      });

      onAuthChange(mockCallback);

      const mockUser1 = { uid: 'user-1', email: 'user1@email.com' } as User;
      const mockUser2 = { uid: 'user-2', email: 'user2@email.com' } as User;

      authCallback(mockUser1);
      authCallback(null);
      authCallback(mockUser2);

      expect(mockCallback).toHaveBeenCalledTimes(3);
      expect(mockCallback).toHaveBeenNthCalledWith(1, mockUser1);
      expect(mockCallback).toHaveBeenNthCalledWith(2, null);
      expect(mockCallback).toHaveBeenNthCalledWith(3, mockUser2);
    });
  });
});