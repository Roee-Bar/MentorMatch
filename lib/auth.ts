import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

// Sign up a new user
export const signUp = async (
  email: string, 
  password: string, 
  userData: {
    name: string;
    role: 'student' | 'supervisor' | 'admin';
    department?: string;
  }
) => {
  try {
    // Create authentication account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create user document in Firestore with the userId field
    await setDoc(doc(db, 'users', user.uid), {
      userId: user.uid, // This is important for security rules!
      email: email,
      name: userData.name,
      role: userData.role,
      department: userData.department || '',
      createdAt: new Date(),
    });

    console.log('✅ User created successfully:', user.uid);
    return { success: true, user };
  } catch (error: any) {
    console.error('❌ Sign up error:', error.message);
    return { success: false, error: error.message };
  }
};

// Sign in existing user
export const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('✅ User signed in:', userCredential.user.uid);
    return { success: true, user: userCredential.user };
  } catch (error: any) {
    console.error('❌ Sign in error:', error.message);
    return { success: false, error: error.message };
  }
};

// Sign out
export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
    console.log('✅ User signed out');
    return { success: true };
  } catch (error: any) {
    console.error('❌ Sign out error:', error.message);
    return { success: false, error: error.message };
  }
};

// Get user profile data from Firestore
export const getUserProfile = async (uid: string) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return { success: true, data: userDoc.data() };
    } else {
      return { success: false, error: 'User profile not found' };
    }
  } catch (error: any) {
    console.error('❌ Get user profile error:', error.message);
    return { success: false, error: error.message };
  }
};

// Listen to authentication state changes
export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};