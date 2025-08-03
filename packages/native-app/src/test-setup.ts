/**
 * Test Setup
 * Global test configuration and mocks for React Native environment
 */

// Mock expo-constants for testing
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      NODE_ENV: 'test',
      EXPO_PUBLIC_API_URL: 'http://localhost:3000',
      EXPO_PUBLIC_WEB_APP_URL: 'http://localhost:8002',
      EXPO_PUBLIC_APP_ENV: 'development',
      EXPO_PUBLIC_DEBUG_MODE: 'true',
      EXPO_PUBLIC_ENABLE_LOGGING: 'true',
      EXPO_PUBLIC_SYNC_INTERVAL_MS: '30000',
      EXPO_PUBLIC_MAX_RETRY_ATTEMPTS: '3',
      EXPO_PUBLIC_OFFLINE_STORAGE_LIMIT_MB: '100',
      EXPO_PUBLIC_DB_ENCRYPTION_KEY: 'test-key-32-characters-long-123'
    }
  }
}));

// Global test environment variables
(global as any).__DEV__ = true;
global.process = global.process || {};
global.process.env = global.process.env || {};

// Set up default environment variables for tests
global.process.env = {
  ...global.process.env,
  NODE_ENV: 'test',
  EXPO_PUBLIC_API_URL: 'http://localhost:3000',
  EXPO_PUBLIC_WEB_APP_URL: 'http://localhost:8002',
  EXPO_PUBLIC_APP_ENV: 'development',
  EXPO_PUBLIC_DEBUG_MODE: 'true',
  EXPO_PUBLIC_ENABLE_LOGGING: 'true',
};