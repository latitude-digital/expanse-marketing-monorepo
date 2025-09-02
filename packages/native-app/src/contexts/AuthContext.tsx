import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService } from '../services/firebase';

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  isAdmin?: boolean;
  tags?: string[];
}

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged(async (user) => {
      if (user) {
        // Get custom claims for admin status and user tags
        const idTokenResult = await user.getIdTokenResult();
        const customClaims = idTokenResult.claims;
        
        setCurrentUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          isAdmin: customClaims.admin === true,
          tags: customClaims.tags || [],
        });
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    const userCredential = await authService.signIn(email, password);
    
    // Get custom claims for admin status and user tags
    const idTokenResult = await userCredential.user.getIdTokenResult();
    const customClaims = idTokenResult.claims;
    
    setCurrentUser({
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      displayName: userCredential.user.displayName,
      isAdmin: customClaims.admin === true,
      tags: customClaims.tags || [],
    });
  };

  const signOut = async () => {
    await authService.signOut();
    setCurrentUser(null);
  };

  const sendPasswordReset = async (email: string) => {
    await authService.sendPasswordReset(email);
  };

  const value: AuthContextType = {
    currentUser,
    loading,
    signIn,
    signOut,
    sendPasswordReset,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;