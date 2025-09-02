/**
 * Environment Configuration Tests
 * Tests for environment variable handling and validation
 */

import { environment, validateEnvironment, getApiEndpoint, getSurveyWebViewUrl } from '../environment';

describe('Environment Configuration', () => {
  describe('environment object', () => {
    it('should have all required properties', () => {
      expect(environment).toHaveProperty('nodeEnv');
      expect(environment).toHaveProperty('apiUrl');
      expect(environment).toHaveProperty('webAppUrl');
      expect(environment).toHaveProperty('firebase');
      expect(environment).toHaveProperty('ford');
      expect(environment).toHaveProperty('lincoln');
      expect(environment).toHaveProperty('app');
      expect(environment).toHaveProperty('database');
      expect(environment).toHaveProperty('sync');
    });

    it('should have firebase configuration properties', () => {
      expect(environment.firebase).toHaveProperty('apiKey');
      expect(environment.firebase).toHaveProperty('authDomain');
      expect(environment.firebase).toHaveProperty('projectId');
      expect(environment.firebase).toHaveProperty('storageBucket');
      expect(environment.firebase).toHaveProperty('messagingSenderId');
      expect(environment.firebase).toHaveProperty('appId');
    });

    it('should have ford and lincoln API configurations', () => {
      expect(environment.ford).toHaveProperty('apiBaseUrl');
      expect(environment.ford).toHaveProperty('apiKey');
      expect(environment.lincoln).toHaveProperty('apiBaseUrl');
      expect(environment.lincoln).toHaveProperty('apiKey');
    });

    it('should have app configuration with correct types', () => {
      expect(environment.app.environment).toMatch(/^(development|staging|production)$/);
      expect(typeof environment.app.debugMode).toBe('boolean');
      expect(typeof environment.app.enableLogging).toBe('boolean');
    });

    it('should have sync configuration with numbers', () => {
      expect(typeof environment.sync.intervalMs).toBe('number');
      expect(typeof environment.sync.maxRetryAttempts).toBe('number');
      expect(typeof environment.sync.offlineStorageLimitMB).toBe('number');
    });
  });

  describe('validateEnvironment', () => {
    it('should return validation results', () => {
      const result = validateEnvironment();
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
      expect(typeof result.isValid).toBe('boolean');
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('should validate in development environment', () => {
      // In development, validation should be more lenient
      const result = validateEnvironment();
      // Should at least have basic configuration
      expect(result.errors.length).toBeLessThan(5);
    });
  });

  describe('getApiEndpoint', () => {
    it('should construct API endpoints correctly', () => {
      const endpoint = getApiEndpoint('/api/events');
      expect(endpoint).toContain('/api/events');
      expect(endpoint).toMatch(/^https?:\/\//);
    });

    it('should handle endpoints with and without leading slash', () => {
      const endpoint1 = getApiEndpoint('/api/events');
      const endpoint2 = getApiEndpoint('api/events');
      
      // Both should work and produce valid URLs
      expect(endpoint1).toMatch(/\/api\/events$/);
      expect(endpoint2).toMatch(/\/api\/events$/);
    });

    it('should use environment API URL', () => {
      const endpoint = getApiEndpoint('/test');
      expect(endpoint).toContain(environment.apiUrl);
    });
  });

  describe('getSurveyWebViewUrl', () => {
    const testEventId = 'test-event-123';

    it('should generate valid survey WebView URL', () => {
      const url = getSurveyWebViewUrl(testEventId);
      
      expect(url).toContain(environment.webAppUrl);
      expect(url).toContain('/survey');
      expect(url).toContain(`eventId=${testEventId}`);
      expect(url).toContain('mode=kiosk');
      expect(url).toContain('hideHeader=true');
      expect(url).toContain('hideFooter=true');
      expect(url).toContain('autoStart=true');
    });

    it('should include additional parameters', () => {
      const additionalParams = {
        customParam: 'value',
        testMode: 'true',
      };
      
      const url = getSurveyWebViewUrl(testEventId, additionalParams);
      
      expect(url).toContain('customParam=value');
      expect(url).toContain('testMode=true');
    });

    it('should generate URLs that can be parsed', () => {
      const url = getSurveyWebViewUrl(testEventId);
      const urlObj = new URL(url);
      
      expect(urlObj.pathname).toBe('/survey');
      expect(urlObj.searchParams.get('eventId')).toBe(testEventId);
      expect(urlObj.searchParams.get('mode')).toBe('kiosk');
      expect(urlObj.searchParams.get('hideHeader')).toBe('true');
    });
  });
});