import { onCall } from "firebase-functions/v2/https";
import * as admin from 'firebase-admin';

/**
 * Get list of users from Firebase Auth
 * This lists the actual Firebase Auth users, not Firestore user documents
 */
export const getUsersListImpl = (app: admin.app.App) => 
  onCall({ cors: true }, async (request) => {
    try {
      // Check if user is authenticated and is an admin
      if (!request.auth) {
        console.warn('WARNING: Unauthenticated access to admin function getUsersList');
        // TODO: In production, uncomment this line to require authentication
        // throw new HttpsError('unauthenticated', 'User must be authenticated to access this function');
      } else if (!request.auth.token.admin) {
        // For now, allow any authenticated user to access admin functions
        // In production, you should set admin custom claims on specific users
        console.warn('User accessing admin function without admin claim:', request.auth.uid);
      }

      // Get users from Firebase Auth
      const auth = admin.auth(app);
      const listUsersResult = await auth.listUsers(1000); // Get up to 1000 users
      
      const users = listUsersResult.users.map(userRecord => ({
        id: userRecord.uid,
        email: userRecord.email || '',
        displayName: userRecord.displayName || '',
        phoneNumber: userRecord.phoneNumber || '',
        disabled: userRecord.disabled,
        emailVerified: userRecord.emailVerified,
        createdAt: userRecord.metadata.creationTime,
        lastLogin: userRecord.metadata.lastSignInTime,
        customClaims: userRecord.customClaims || {},
        isAdmin: userRecord.customClaims?.admin === true
      }));

      // Sort by email
      users.sort((a, b) => a.email.localeCompare(b.email));

      return { 
        success: true, 
        users,
        count: users.length
      };
    } catch (error) {
      console.error('Error fetching users:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch users');
    }
  });