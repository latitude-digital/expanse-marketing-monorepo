import {
  getAuth,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged as firebaseOnAuthStateChanged,
} from '@react-native-firebase/auth';
import type { FirebaseAuthTypes } from '@react-native-firebase/auth';

// Log Firebase Auth initialization
const auth = getAuth();
console.log('🔥 [AUTH INIT] Firebase Auth initialized on import');
console.log('🔥 [AUTH INIT] Firebase App Name:', auth.app.name);
console.log('🔥 [AUTH INIT] Project ID:', auth.app.options.projectId);
console.log('🔥 [AUTH INIT] API Key:', auth.app.options.apiKey?.substring(0, 10) + '...');

// Auth service functions
export const authService = {
  signIn: async (email: string, password: string) => {
    try {
      console.log('🔐 [AUTH] Starting sign in process...');
      console.log('🔐 [AUTH] Email:', email);

      const auth = getAuth();
      console.log('🔐 [AUTH] Auth instance obtained');
      console.log('🔐 [AUTH] Current user before sign in:', auth.currentUser?.uid || 'null');
      console.log('🔐 [AUTH] Auth app name:', auth.app.name);
      console.log('🔐 [AUTH] Auth app options:', JSON.stringify({
        projectId: auth.app.options.projectId,
        apiKey: auth.app.options.apiKey?.substring(0, 10) + '...',
      }));

      console.log('🔐 [AUTH] Attempting signInWithEmailAndPassword...');
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      console.log('🔐 [AUTH] ✅ Sign in successful!');
      console.log('🔐 [AUTH] User ID:', userCredential.user.uid);
      console.log('🔐 [AUTH] User email:', userCredential.user.email);

      return userCredential;
    } catch (error: any) {
      console.error('🔐 [AUTH] ❌ Sign in error caught');
      console.error('🔐 [AUTH] Error code:', error.code);
      console.error('🔐 [AUTH] Error message:', error.message);
      console.error('🔐 [AUTH] Full error:', JSON.stringify(error, null, 2));
      throw transformAuthError(error);
    }
  },

  signOut: async () => {
    try {
      const auth = getAuth();
      await firebaseSignOut(auth);
    } catch (error: any) {
      throw transformAuthError(error);
    }
  },

  sendPasswordReset: async (email: string) => {
    try {
      const auth = getAuth();
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      throw transformAuthError(error);
    }
  },

  getCurrentUser: () => {
    const auth = getAuth();
    return auth.currentUser;
  },

  onAuthStateChanged: (callback: (user: FirebaseAuthTypes.User | null) => void) => {
    const auth = getAuth();
    return firebaseOnAuthStateChanged(auth, callback);
  }
};

// Transform Firebase auth errors to user-friendly messages
function transformAuthError(error: any): Error {
  const errorMessage = getSecureErrorMessage(error.code);
  
  const transformedError = new Error(errorMessage);
  (transformedError as any).code = error.code;
  (transformedError as any).originalMessage = error.message;
  
  return transformedError;
}

function getSecureErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/invalid-email':
    case 'auth/user-disabled':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid credentials. Please check your email and password.';
    
    case 'auth/email-already-in-use':
      return 'This email is already registered.';
    
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again.';
    
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled. Please contact support.';
    
    case 'auth/expired-action-code':
      return 'This password reset link has expired. Please request a new one.';
    
    case 'auth/invalid-action-code':
      return 'This password reset link is invalid. Please request a new one.';
    
    default:
      return 'An error occurred. Please try again.';
  }
}