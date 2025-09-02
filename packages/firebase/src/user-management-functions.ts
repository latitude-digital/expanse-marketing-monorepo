import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";

/**
 * List all users from Firebase Auth
 * Requires admin claim on the calling user
 */
export const listUsersImpl = (app: admin.app.App) => {
  return onCall({ cors: true }, async (request) => {
    try {
      // Check if the calling user is an admin
      if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated');
      }

      const callerToken = await admin.auth(app).getUser(request.auth.uid);
      const customClaims = callerToken.customClaims || {};
      
      if (!customClaims.admin) {
        throw new HttpsError('permission-denied', 'User must be an admin');
      }

      // List all users
      const listUsersResult = await admin.auth(app).listUsers(1000);
      
      const users = listUsersResult.users.map(user => ({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        isAdmin: user.customClaims?.admin || false,
        tags: user.customClaims?.tags || [],
        createdAt: user.metadata.creationTime,
        lastLogin: user.metadata.lastSignInTime,
      }));

      logger.info(`Listed ${users.length} users for admin ${request.auth.uid}`);
      
      return { users };
    } catch (error: any) {
      logger.error('Error listing users:', error);
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError('internal', 'Failed to list users');
    }
  });
};

/**
 * Set or remove admin claim for a user
 * Requires admin claim on the calling user
 */
export const setAdminClaimImpl = (app: admin.app.App) => {
  return onCall({ cors: true }, async (request) => {
    try {
      // Check if the calling user is an admin
      if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated');
      }

      const callerToken = await admin.auth(app).getUser(request.auth.uid);
      const customClaims = callerToken.customClaims || {};
      
      if (!customClaims.admin) {
        throw new HttpsError('permission-denied', 'User must be an admin');
      }

      const { userId, admin: isAdmin } = request.data;
      
      if (!userId) {
        throw new HttpsError('invalid-argument', 'userId is required');
      }

      // Get current user's custom claims
      const user = await admin.auth(app).getUser(userId);
      const currentClaims = user.customClaims || {};
      
      // Update the admin claim
      await admin.auth(app).setCustomUserClaims(userId, {
        ...currentClaims,
        admin: isAdmin
      });

      logger.info(`Admin claim ${isAdmin ? 'added to' : 'removed from'} user ${userId} by admin ${request.auth.uid}`);
      
      return { success: true };
    } catch (error: any) {
      logger.error('Error setting admin claim:', error);
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError('internal', 'Failed to set admin claim');
    }
  });
};

/**
 * Delete a user from Firebase Auth
 * Requires admin claim on the calling user
 */
export const deleteUserImpl = (app: admin.app.App) => {
  return onCall({ cors: true }, async (request) => {
    try {
      // Check if the calling user is an admin
      if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated');
      }

      const callerToken = await admin.auth(app).getUser(request.auth.uid);
      const customClaims = callerToken.customClaims || {};
      
      if (!customClaims.admin) {
        throw new HttpsError('permission-denied', 'User must be an admin');
      }

      const { userId } = request.data;
      
      if (!userId) {
        throw new HttpsError('invalid-argument', 'userId is required');
      }

      // Prevent self-deletion
      if (userId === request.auth.uid) {
        throw new HttpsError('invalid-argument', 'Cannot delete your own account');
      }

      // Delete the user
      await admin.auth(app).deleteUser(userId);

      logger.info(`User ${userId} deleted by admin ${request.auth.uid}`);
      
      return { success: true };
    } catch (error: any) {
      logger.error('Error deleting user:', error);
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError('internal', 'Failed to delete user');
    }
  });
};

/**
 * Update user tags custom claim
 * Requires admin claim on the calling user
 */
export const updateUserTagsImpl = (app: admin.app.App) => {
  return onCall({ cors: true }, async (request) => {
    try {
      // Check if the calling user is an admin
      if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated');
      }

      const callerToken = await admin.auth(app).getUser(request.auth.uid);
      const customClaims = callerToken.customClaims || {};
      
      if (!customClaims.admin) {
        throw new HttpsError('permission-denied', 'User must be an admin');
      }

      const { userId, tags } = request.data;
      
      if (!userId) {
        throw new HttpsError('invalid-argument', 'userId is required');
      }

      // Get current user's custom claims
      const user = await admin.auth(app).getUser(userId);
      const currentClaims = user.customClaims || {};
      
      // Update the tags claim
      await admin.auth(app).setCustomUserClaims(userId, {
        ...currentClaims,
        tags: tags || []
      });

      logger.info(`Tags updated for user ${userId} by admin ${request.auth.uid}`);
      
      return { success: true };
    } catch (error: any) {
      logger.error('Error updating user tags:', error);
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError('internal', 'Failed to update user tags');
    }
  });
};