#!/usr/bin/env node

/**
 * Script to create test users for authentication testing
 * Usage: node scripts/create-test-users.js
 */

const admin = require('firebase-admin');
const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin SDK
// Note: This requires GOOGLE_APPLICATION_CREDENTIALS environment variable to be set
// or running with appropriate service account credentials
const app = initializeApp({
  projectId: 'latitude-lead-system',
});

const auth = getAuth(app);
const db = getFirestore(app);

// Test users to create
const testUsers = [
  {
    email: 'testuser@expanse.demo',
    password: 'TestUser123!@#',
    displayName: 'Test User',
    role: 'user',
    customClaims: {
      role: 'user',
      isTestAccount: true
    }
  },
  {
    email: 'testadmin@expanse.demo',
    password: 'TestAdmin123!@#',
    displayName: 'Test Admin',
    role: 'admin',
    customClaims: {
      role: 'admin',
      isTestAccount: true,
      admin: true
    }
  }
];

async function createTestUsers() {
  console.log('🚀 Creating test users for Expanse Marketing...\n');

  for (const userData of testUsers) {
    try {
      // Check if user already exists
      let user;
      try {
        user = await auth.getUserByEmail(userData.email);
        console.log(`✓ User ${userData.email} already exists (UID: ${user.uid})`);
        
        // Update custom claims if needed
        await auth.setCustomUserClaims(user.uid, userData.customClaims);
        console.log(`  ✓ Updated custom claims for ${userData.email}`);
      } catch (error) {
        if (error.code === 'auth/user-not-found') {
          // Create new user
          user = await auth.createUser({
            email: userData.email,
            password: userData.password,
            displayName: userData.displayName,
            emailVerified: true // Mark as verified for testing
          });
          console.log(`✅ Created user ${userData.email} (UID: ${user.uid})`);
          
          // Set custom claims
          await auth.setCustomUserClaims(user.uid, userData.customClaims);
          console.log(`  ✓ Set custom claims for ${userData.email}`);
        } else {
          throw error;
        }
      }

      // Create or update Firestore user document
      const userDoc = {
        uid: user.uid,
        email: userData.email,
        displayName: userData.displayName,
        role: userData.role,
        isTestAccount: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('users').doc(user.uid).set(userDoc, { merge: true });
      console.log(`  ✓ Created/updated Firestore document for ${userData.email}`);

    } catch (error) {
      console.error(`❌ Error creating user ${userData.email}:`, error.message);
    }
  }

  console.log('\n✨ Test user creation complete!\n');
  console.log('Test Credentials:');
  console.log('================');
  testUsers.forEach(user => {
    console.log(`\n${user.role.toUpperCase()}:`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Password: ${user.password}`);
  });
  console.log('\n⚠️  Note: These are test accounts for development/staging only.');
  console.log('Never use these credentials in production!\n');

  process.exit(0);
}

// Run the script
createTestUsers().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});