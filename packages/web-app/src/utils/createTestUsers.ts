/**
 * Utility to create test users using Firebase Auth
 * This should only be used in development/staging environments
 */

import { createUserWithEmailAndPassword, updateProfile, User } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import authService from '../services/authService';
import db from '../services/db';

interface TestUser {
  email: string;
  password: string;
  displayName: string;
  role: 'user' | 'admin';
}

const TEST_USERS: TestUser[] = [
  {
    email: 'testuser@expanse.demo',
    password: 'TestUser123!@#',
    displayName: 'Test User',
    role: 'user'
  },
  {
    email: 'testadmin@expanse.demo', 
    password: 'TestAdmin123!@#',
    displayName: 'Test Admin',
    role: 'admin'
  }
];

export async function createTestUsers(): Promise<void> {
  console.log('🚀 Creating test users...\n');

  for (const userData of TEST_USERS) {
    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(
        authService.getAuthInstance(),
        userData.email,
        userData.password
      );
      const user = userCredential.user;

      // Update display name
      await updateProfile(user, {
        displayName: userData.displayName
      });

      console.log(`✅ Created user: ${userData.email} (UID: ${user.uid})`);

      // Create Firestore user document
      await createUserDocument(user, userData.role);
      console.log(`  ✓ Created Firestore document for ${userData.email}`);

    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`ℹ️  User ${userData.email} already exists`);
      } else {
        console.error(`❌ Error creating ${userData.email}:`, error.message);
      }
    }
  }

  console.log('\n✨ Test users ready!\n');
  console.log('Test Credentials:');
  console.log('================');
  TEST_USERS.forEach(user => {
    console.log(`\n${user.role.toUpperCase()}:`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Password: ${user.password}`);
  });
  console.log('\n⚠️  These are test accounts for development only!');
}

async function createUserDocument(user: User, role: string): Promise<void> {
  const userDoc = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || '',
    role: role,
    isTestAccount: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  await setDoc(doc(db, 'users', user.uid), userDoc, { merge: true });
}

// Export for use in browser console during development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).createTestUsers = createTestUsers;
  console.log('💡 Test user creation available: Run createTestUsers() in console');
}