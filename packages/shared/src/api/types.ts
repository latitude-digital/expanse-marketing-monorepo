/**
 * API Type Definitions
 * Common types used across API configurations
 */

export type Environment = 'production' | 'staging' | 'local';

export const ENV = {
  PRODUCTION: 'production' as const,
  STAGING: 'staging' as const,
  LOCAL: 'local' as const
} as const;

export type EnvKey = keyof typeof ENV;

export interface ApiConfig {
  baseUrl: string;
  authToken?: string;
}

export interface EndpointConfig {
  path: string;
  version?: string;
}