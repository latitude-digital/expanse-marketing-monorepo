import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from 'firebase/auth';
import authService from '../services/authService';
import userService, { UserData } from '../services/userService';
import { ensureCloudFrontAccess, resetCloudFrontAccess } from '../services/cloudFrontAuth';

interface AuthContextType {
  currentUser: User | null;
  userData: UserData | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  confirmPasswordReset: (code: string, newPassword: string) => Promise<void>;
  ensureCloudFrontAccess: () => Promise<void>;
  resetCloudFrontAccess: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Debug logging for loading state
  console.log('AuthProvider render - loading:', loading, 'currentUser:', currentUser?.email || 'none');

  useEffect(() => {
    let mounted = true;
    let loadingTimeout: NodeJS.Timeout | null = null;
    
    // Fallback: ensure loading is set to false after maximum 5 seconds to prevent indefinite loading
    const setupLoadingTimeout = () => {
      if (loadingTimeout) clearTimeout(loadingTimeout);
      loadingTimeout = setTimeout(() => {
        if (mounted) {
          console.warn('Auth loading timeout reached after 5s, forcing loading to false');
          setLoading(false);
        }
      }, 5000);
    };
    
    setupLoadingTimeout();
    
    console.log('AuthProvider: Setting up auth state listener');
    
    // Check if there's already a current user immediately
    const currentFirebaseUser = authService.getCurrentUser();
    if (currentFirebaseUser) {
      console.log('AuthProvider: Found existing authenticated user:', currentFirebaseUser.email);
      setCurrentUser(currentFirebaseUser);
      // Load user data async but don't block
      userService.getUserData(currentFirebaseUser).then(userData => {
        if (mounted && userData) {
          setUserData(userData);
          setIsAdmin(userData.role === 'admin');
        }
      }).catch(error => {
        console.error('Error loading user data for existing user:', error);
      }).finally(() => {
        if (mounted) setLoading(false);
      });
    }
    
    try {
      const unsubscribe = authService.onAuthStateChanged(async (user) => {
      try {
        if (!mounted) return;
        
        console.log('Auth state changed:', user?.email || 'No user');
        setCurrentUser(user);
        
        if (user) {
          // Fetch user data and role information
          try {
            console.log('Fetching user data for:', user.email);
            const userInfo = await userService.getUserData(user);
            
            if (!mounted) return;
            
            if (userInfo) {
              console.log('User data loaded:', userInfo);
              setUserData(userInfo);
              setIsAdmin(userInfo.role === 'admin');
            } else {
              console.warn('No user data found, using defaults');
              // Create default user data if none exists
              const defaultUserData: UserData = {
                uid: user.uid,
                email: user.email || '',
                displayName: user.displayName || '',
                role: 'user'
              };
              setUserData(defaultUserData);
              setIsAdmin(false);
            }
          } catch (error) {
            console.error('Error fetching user data:', error);
            if (!mounted) return;
            
            // On error, still set basic user info to unblock authentication
            const fallbackUserData: UserData = {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || '',
              role: 'user'
            };
            setUserData(fallbackUserData);
            setIsAdmin(false);
          }
        } else {
          console.log('No authenticated user');
          if (!mounted) return;
          setUserData(null);
          setIsAdmin(false);
          userService.clearUserCache(); // Clear cache when user signs out
        }
      } catch (error) {
        console.error('Error in auth state change handler:', error);
        // Ensure we don't get stuck in loading state even if there's an unexpected error
        if (mounted) {
          setUserData(null);
          setIsAdmin(false);
        }
      } finally {
        // Always clear the timeout and set loading to false
        if (loadingTimeout) clearTimeout(loadingTimeout);
        if (mounted) {
          console.log('Setting loading to false');
          setLoading(false);
        }
      }
      });

      return () => {
        mounted = false;
        if (loadingTimeout) clearTimeout(loadingTimeout);
        unsubscribe();
      };
    } catch (error) {
      console.error('Failed to set up auth state listener:', error);
      // If auth service setup fails, ensure we don't stay in loading state
      if (mounted) {
        setLoading(false);
      }
      
      return () => {
        mounted = false;
        if (loadingTimeout) clearTimeout(loadingTimeout);
      };
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    const userCredential = await authService.signIn(email, password);
    setCurrentUser(userCredential.user);
    
    // AUTH-009: CloudFront cookies are already handled in authService.signIn,
    // but we provide additional context-level access if needed
  };

  const signOut = async () => {
    // AUTH-009: CloudFront cookies are already reset in authService.signOut
    await authService.signOut();
    setCurrentUser(null);
  };

  const sendPasswordReset = async (email: string) => {
    await authService.sendPasswordReset(email);
  };

  const confirmPasswordReset = async (code: string, newPassword: string) => {
    await authService.confirmPasswordReset(code, newPassword);
  };

  const value: AuthContextType = {
    currentUser,
    userData,
    isAdmin,
    loading,
    signIn,
    signOut,
    sendPasswordReset,
    confirmPasswordReset,
    ensureCloudFrontAccess,
    resetCloudFrontAccess,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;