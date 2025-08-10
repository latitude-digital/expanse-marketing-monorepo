import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  confirmPasswordReset,
  User,
  UserCredential,
  Auth,
  NextOrObserver,
  Unsubscribe
} from 'firebase/auth';
import app, { shouldUseEmulator } from './firebase';
import { connectAuthEmulator } from 'firebase/auth';
import { ensureCloudFrontAccess, resetCloudFrontAccess } from './cloudFrontAuth';

class AuthService {
  private auth: Auth;
  private static instance: AuthService;
  private emulatorConnected = false;

  private constructor() {
    this.auth = getAuth(app);
    this.connectToEmulatorIfNeeded();
  }

  private connectToEmulatorIfNeeded() {
    if (shouldUseEmulator('auth') && !this.emulatorConnected) {
      try {
        connectAuthEmulator(this.auth, 'http://localhost:9099', { disableWarnings: true });
        this.emulatorConnected = true;
        console.log('Connected to Auth emulator at localhost:9099');
      } catch (error) {
        console.error('Failed to connect to Auth emulator:', error);
      }
    }
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async signIn(email: string, password: string): Promise<UserCredential> {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      
      // AUTH-009: Ensure CloudFront cookies are set up after successful login
      try {
        await ensureCloudFrontAccess();
        console.log('CloudFront access ensured after sign-in');
      } catch (cloudFrontError) {
        console.error('Failed to ensure CloudFront access after sign-in:', cloudFrontError);
        // Don't fail the login if CloudFront cookies fail - log and continue
      }
      
      return userCredential;
    } catch (error: any) {
      throw this.transformAuthError(error);
    }
  }

  async signOut(): Promise<void> {
    try {
      // AUTH-009: Reset CloudFront cookies before signing out
      resetCloudFrontAccess();
      await signOut(this.auth);
    } catch (error: any) {
      throw this.transformAuthError(error);
    }
  }

  async sendPasswordReset(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(this.auth, email);
    } catch (error: any) {
      throw this.transformAuthError(error);
    }
  }

  async confirmPasswordReset(code: string, newPassword: string): Promise<void> {
    try {
      await confirmPasswordReset(this.auth, code, newPassword);
    } catch (error: any) {
      throw this.transformAuthError(error);
    }
  }

  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }

  onAuthStateChanged(observer: NextOrObserver<User>): Unsubscribe {
    return onAuthStateChanged(this.auth, observer);
  }

  private transformAuthError(error: any): Error {
    const errorMessage = this.getSecureErrorMessage(error.code);
    
    const transformedError = new Error(errorMessage);
    (transformedError as any).code = error.code;
    (transformedError as any).originalMessage = error.message;
    
    return transformedError;
  }

  private getSecureErrorMessage(errorCode: string): string {
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

  async waitForAuth(): Promise<User | null> {
    return new Promise((resolve) => {
      const unsubscribe = this.onAuthStateChanged((user) => {
        unsubscribe();
        resolve(user);
      });
    });
  }

  getAuthInstance(): Auth {
    return this.auth;
  }
}

export const authService = AuthService.getInstance();
export default authService;