import auth from '@react-native-firebase/auth';

// Auth service functions
export const authService = {
  signIn: async (email: string, password: string) => {
    try {
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      return userCredential;
    } catch (error: any) {
      throw transformAuthError(error);
    }
  },

  signOut: async () => {
    try {
      await auth().signOut();
    } catch (error: any) {
      throw transformAuthError(error);
    }
  },

  sendPasswordReset: async (email: string) => {
    try {
      await auth().sendPasswordResetEmail(email);
    } catch (error: any) {
      throw transformAuthError(error);
    }
  },

  getCurrentUser: () => {
    return auth().currentUser;
  },

  onAuthStateChanged: (callback: (user: any) => void) => {
    return auth().onAuthStateChanged(callback);
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