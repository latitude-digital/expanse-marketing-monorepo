/**
 * User service for managing user data and roles
 */

import { doc, getDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import db from './firestore';

export interface UserData {
  uid: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin';
  isTestAccount?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

class UserService {
  private static instance: UserService;
  private userCache = new Map<string, UserData>();

  private constructor() {}

  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  async getUserData(user: User): Promise<UserData | null> {
    if (!user.uid) {
      console.warn('getUserData called with no user UID');
      return null;
    }

    // Check cache first
    if (this.userCache.has(user.uid)) {
      console.log(`User data from cache for ${user.uid}`);
      return this.userCache.get(user.uid)!;
    }

    try {
      console.log(`Fetching user document for ${user.uid} from Firestore`);
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data() as UserData;
        console.log(`User document found for ${user.uid}:`, userData);
        
        // Ensure all required fields are present
        const completeUserData: UserData = {
          uid: user.uid,
          email: userData.email || user.email || '',
          displayName: userData.displayName || user.displayName || '',
          role: userData.role || 'user',
          isTestAccount: userData.isTestAccount,
          createdAt: userData.createdAt,
          updatedAt: userData.updatedAt
        };
        
        // Cache the result
        this.userCache.set(user.uid, completeUserData);
        
        return completeUserData;
      } else {
        console.warn(`User document not found for UID: ${user.uid}, creating default user data`);
        // Return default user data if no document exists
        const defaultUserData: UserData = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || '',
          role: 'user' // Default to user role
        };
        
        // Cache the default data so we don't keep refetching
        this.userCache.set(user.uid, defaultUserData);
        
        return defaultUserData;
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      
      // Return null but don't cache the error so we can retry
      return null;
    }
  }

  async isAdmin(user: User): Promise<boolean> {
    const userData = await this.getUserData(user);
    return userData?.role === 'admin' || false;
  }

  clearUserCache(uid?: string): void {
    if (uid) {
      this.userCache.delete(uid);
    } else {
      this.userCache.clear();
    }
  }
}

export const userService = UserService.getInstance();
export default userService;