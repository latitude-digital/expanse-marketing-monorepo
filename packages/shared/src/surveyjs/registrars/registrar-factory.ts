/**
 * Factory for creating appropriate question registrars
 */

import { IQuestionRegistrar, Environment } from '../types';
import { FrontendRegistrar } from './frontend-registrar';
import { BackendRegistrar } from './backend-registrar';

export class RegistrarFactory {
  private static frontendRegistrar: IQuestionRegistrar | null = null;
  private static backendRegistrar: IQuestionRegistrar | null = null;

  /**
   * Get the appropriate registrar for the environment
   */
  static getRegistrar(environment?: Environment): IQuestionRegistrar {
    // Auto-detect environment if not specified
    const env = environment || this.detectEnvironment();

    if (env === 'frontend') {
      if (!this.frontendRegistrar) {
        this.frontendRegistrar = new FrontendRegistrar();
      }
      return this.frontendRegistrar;
    } else {
      if (!this.backendRegistrar) {
        this.backendRegistrar = new BackendRegistrar();
      }
      return this.backendRegistrar;
    }
  }

  /**
   * Detect the current environment
   */
  private static detectEnvironment(): Environment {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      return 'frontend';
    }
    
    // Check for Node.js environment indicators
    if (typeof process !== 'undefined' && process.versions && process.versions.node) {
      return 'backend';
    }

    // Default to backend for safety
    console.warn('[RegistrarFactory] Could not detect environment, defaulting to backend');
    return 'backend';
  }

  /**
   * Clear cached registrars (useful for testing)
   */
  static clearCache(): void {
    this.frontendRegistrar = null;
    this.backendRegistrar = null;
  }
}