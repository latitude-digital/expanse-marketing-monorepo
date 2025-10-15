import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService } from '../services/firebase';
import { getFirestore, collection, doc, getDoc } from '@react-native-firebase/firestore';

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
        // Get custom claims for admin status
        const idTokenResult = await user.getIdTokenResult();
        const customClaims = idTokenResult.claims;
        
        // Fetch user document from Firestore to get tags
        let userTags: string[] = [];
        try {
          const db = getFirestore();
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            userTags = userData?.tags || [];
          }
        } catch (error) {
          console.error('Error fetching user tags:', error);
        }
        
        setCurrentUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          isAdmin: customClaims.admin === true,
          tags: userTags,
        });
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('👤 [AuthContext] signIn called with email:', email);

    try {
      console.log('👤 [AuthContext] Calling authService.signIn...');
      const userCredential = await authService.signIn(email, password);
      console.log('👤 [AuthContext] authService.signIn returned successfully');

      // Get custom claims for admin status
      console.log('👤 [AuthContext] Fetching ID token and custom claims...');
      const idTokenResult = await userCredential.user.getIdTokenResult();
      const customClaims = idTokenResult.claims;
      console.log('👤 [AuthContext] Custom claims:', JSON.stringify({
        admin: customClaims.admin,
        // Add other claims if needed
      }));

      // Fetch user document from Firestore to get tags
      let userTags: string[] = [];
      try {
        console.log('👤 [AuthContext] Fetching user document from Firestore...');
        const db = getFirestore();
        console.log('👤 [AuthContext] Firestore instance obtained');
        const userDocRef = doc(db, 'users', userCredential.user.uid);
        console.log('👤 [AuthContext] Fetching doc at path: users/' + userCredential.user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          console.log('👤 [AuthContext] User document found');
          const userData = userDoc.data();
          userTags = userData?.tags || [];
          console.log('👤 [AuthContext] User tags:', userTags);
        } else {
          console.log('👤 [AuthContext] ⚠️ User document does not exist in Firestore');
        }
      } catch (error) {
        console.error('👤 [AuthContext] ❌ Error fetching user tags:', error);
      }

      console.log('👤 [AuthContext] Setting current user...');
      setCurrentUser({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName,
        isAdmin: customClaims.admin === true,
        tags: userTags,
      });
      console.log('👤 [AuthContext] ✅ Sign in complete!');
    } catch (error) {
      console.error('👤 [AuthContext] ❌ Sign in failed:', error);
      throw error;
    }
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