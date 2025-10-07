/**
 * Environment Configuration
 * Centralized configuration management using expo-constants
 */

import Constants from 'expo-constants';

interface EnvironmentConfig {
  nodeEnv: string;
  apiUrl: string;
  webAppUrl: string;
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
  ford: {
    apiBaseUrl: string;
    apiKey: string;
  };
  lincoln: {
    apiBaseUrl: string;
    apiKey: string;
  };
  app: {
    environment: 'development' | 'staging' | 'production';
    debugMode: boolean;
    enableLogging: boolean;
  };
  database: {
    encryptionKey: string;
  };
  sync: {
    intervalMs: number;
    maxRetryAttempts: number;
    offlineStorageLimitMB: number;
  };
}

/**
 * Get environment variable with fallback and validation
 */
function getEnvVar(key: string, defaultValue?: string): string {
  const value = Constants.expoConfig?.extra?.[key] || process.env[key] || defaultValue;
  
  if (!value) {
    if (__DEV__) {
      console.warn(`Environment variable ${key} is not set`);
    }
    return '';
  }
  
  return value;
}

/**
 * Get boolean environment variable
 */
function getBooleanEnvVar(key: string, defaultValue: boolean = false): boolean {
  const value = getEnvVar(key);
  if (!value) return defaultValue;
  
  return value.toLowerCase() === 'true' || value === '1';
}

/**
 * Get number environment variable
 */
function getNumberEnvVar(key: string, defaultValue: number): number {
  const value = getEnvVar(key);
  if (!value) return defaultValue;
  
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Environment configuration object
 */
export const environment: EnvironmentConfig = {
  nodeEnv: getEnvVar('NODE_ENV', 'development'),
  
  // API Configuration
  apiUrl: getEnvVar('EXPO_PUBLIC_API_URL', 'http://localhost:3000'),
  webAppUrl: getEnvVar('EXPO_PUBLIC_WEB_APP_URL', 'http://localhost:8002'),
  
  // Firebase Configuration
  firebase: {
    apiKey: getEnvVar('EXPO_PUBLIC_FIREBASE_API_KEY'),
    authDomain: getEnvVar('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
    projectId: getEnvVar('EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
    storageBucket: getEnvVar('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: getEnvVar('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
    appId: getEnvVar('EXPO_PUBLIC_FIREBASE_APP_ID'),
  },
  
  // Ford API Configuration
  ford: {
    apiBaseUrl: getEnvVar('EXPO_PUBLIC_FORD_API_BASE_URL', 'https://api.ford.com'),
    apiKey: getEnvVar('EXPO_PUBLIC_FORD_API_KEY'),
  },
  
  // Lincoln API Configuration
  lincoln: {
    apiBaseUrl: getEnvVar('EXPO_PUBLIC_LINCOLN_API_BASE_URL', 'https://api.lincoln.com'),
    apiKey: getEnvVar('EXPO_PUBLIC_LINCOLN_API_KEY'),
  },
  
  // App Configuration
  app: {
    environment: (getEnvVar('EXPO_PUBLIC_APP_ENV', 'development') as any),
    debugMode: getBooleanEnvVar('EXPO_PUBLIC_DEBUG_MODE', __DEV__),
    enableLogging: getBooleanEnvVar('EXPO_PUBLIC_ENABLE_LOGGING', __DEV__),
  },
  
  // Database Configuration
  database: {
    encryptionKey: getEnvVar('EXPO_PUBLIC_DB_ENCRYPTION_KEY', 'default-dev-key-change-in-prod'),
  },
  
  // Sync Configuration
  sync: {
    intervalMs: getNumberEnvVar('EXPO_PUBLIC_SYNC_INTERVAL_MS', 30000),
    maxRetryAttempts: getNumberEnvVar('EXPO_PUBLIC_MAX_RETRY_ATTEMPTS', 3),
    offlineStorageLimitMB: getNumberEnvVar('EXPO_PUBLIC_OFFLINE_STORAGE_LIMIT_MB', 100),
  },
};

/**
 * Validate required environment variables
 */
export function validateEnvironment(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check Firebase configuration for production
  if (environment.app.environment === 'production') {
    if (!environment.firebase.apiKey) errors.push('Firebase API key is required for production');
    if (!environment.firebase.projectId) errors.push('Firebase project ID is required for production');
    if (!environment.firebase.appId) errors.push('Firebase app ID is required for production');
  }
  
  // Check API URLs
  if (!environment.apiUrl) errors.push('API URL is required');
  if (!environment.webAppUrl) errors.push('Web app URL is required');
  
  // Check database encryption key for production
  if (environment.app.environment === 'production' && 
      (!environment.database.encryptionKey || environment.database.encryptionKey === 'default-dev-key-change-in-prod')) {
    errors.push('Database encryption key must be set for production');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get API endpoint for specific functionality
 */
export function getApiEndpoint(endpoint: string): string {
  return `${environment.apiUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
}

/**
 * Get WebView URL for survey execution
 */
export function getSurveyWebViewUrl(eventId: string, additionalParams: Record<string, string> = {}): string {
  const params = new URLSearchParams({
    mode: 'kiosk',
    hideHeader: 'true',
    hideFooter: 'true',
    autoStart: 'true',
    ...additionalParams,
  });
  
  return `${environment.webAppUrl}/survey?eventId=${eventId}&${params.toString()}`;
}

// Export types for external use
export type { EnvironmentConfig };

// Log configuration in development
if (__DEV__ && environment.app.enableLogging) {
  console.log('Environment Configuration Loaded:', {
    nodeEnv: environment.nodeEnv,
    appEnv: environment.app.environment,
    apiUrl: environment.apiUrl,
    webAppUrl: environment.webAppUrl,
    debugMode: environment.app.debugMode,
  });
}