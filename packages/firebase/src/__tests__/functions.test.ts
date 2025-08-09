import { staging, prod } from '../index';

// Mock Sentry to avoid initialization during tests
jest.mock('@sentry/node', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
}));

jest.mock('@sentry/profiling-node', () => ({
  nodeProfilingIntegration: jest.fn(),
}));

// Initialize test environment for offline testing
const test = require('firebase-functions-test')();

// Mock Firebase Admin
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(() => ({
    firestore: jest.fn()
  })),
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      where: jest.fn(() => ({
        where: jest.fn(() => ({
          get: jest.fn()
        })),
        get: jest.fn()
      })),
      doc: jest.fn(() => ({
        get: jest.fn()
      })),
      add: jest.fn()
    })),
    FieldValue: {
      serverTimestamp: jest.fn()
    }
  }))
}));

// Mock the getFirestore function from firebase-admin/firestore
jest.mock('firebase-admin/firestore', () => ({
  getFirestore: jest.fn((app, database) => ({
    collection: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({ size: 0 }),
      doc: jest.fn(() => ({
        get: jest.fn().mockResolvedValue({ 
          data: () => ({ maxResponses: 1 }) 
        })
      })),
      add: jest.fn().mockResolvedValue({ id: 'test-id' })
    }))
  }))
}));

describe('Firebase Functions - Namespaces', () => {
  describe('Namespace Structure', () => {
    it('should export staging namespace with all functions', () => {
      expect(staging).toBeDefined();
      expect(staging.setCloudFrontCookies).toBeDefined();
      expect(staging.checkSurveyLimit).toBeDefined();
      expect(staging.validateSurveyLimit).toBeDefined();
    });

    it('should export prod namespace with all functions', () => {
      expect(prod).toBeDefined();
      expect(prod.setCloudFrontCookies).toBeDefined();
      expect(prod.checkSurveyLimit).toBeDefined();
      expect(prod.validateSurveyLimit).toBeDefined();
    });
  });

  describe('CloudFront Cookie Function', () => {
    it('should require authentication', async () => {
      const wrapped = test.wrap(staging.setCloudFrontCookies);
      
      try {
        // Call without auth
        await wrapped({ data: {} });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.code).toBe('unauthenticated');
      }
    });

    it('should return cookies when authenticated', async () => {
      const wrapped = test.wrap(staging.setCloudFrontCookies);
      
      // Mock successful response
      const result = await wrapped(
        { data: {}, auth: { uid: 'test-user', token: {} } }
      );

      expect(result).toBeDefined();
      expect(result).toHaveProperty('cookies');
      expect(result).toHaveProperty('expires');
      expect(result.cookies).toHaveProperty('CloudFront-Policy');
      expect(result.cookies).toHaveProperty('CloudFront-Signature');
      expect(result.cookies).toHaveProperty('CloudFront-Key-Pair-Id');
    });
  });

  describe('Survey Limit Check Function', () => {
    it('should require authentication', async () => {
      const wrapped = test.wrap(staging.checkSurveyLimit);
      
      try {
        await wrapped({ data: { surveyId: 'test-survey' } });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.code).toBe('unauthenticated');
      }
    });

    it('should require surveyId parameter', async () => {
      const wrapped = test.wrap(staging.checkSurveyLimit);
      
      try {
        await wrapped({ 
          data: {}, 
          auth: { uid: 'test-user', token: {} } 
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.code).toBe('invalid-argument');
        expect(error.message).toContain('Survey ID is required');
      }
    });

    it('should return limit status when valid', async () => {
      const wrapped = test.wrap(staging.checkSurveyLimit);
      
      const result = await wrapped({ 
        data: { surveyId: 'test-survey' }, 
        auth: { uid: 'test-user', token: {} } 
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty('canSubmit');
      expect(result).toHaveProperty('responseCount');
      expect(result).toHaveProperty('maxResponses');
      expect(result).toHaveProperty('remaining');
      expect(result.canSubmit).toBe(true);
      expect(result.responseCount).toBe(0);
      expect(result.maxResponses).toBe(1);
      expect(result.remaining).toBe(1);
    });
  });

  describe('Survey Validation Function', () => {
    it('should require authentication', async () => {
      const wrapped = test.wrap(staging.validateSurveyLimit);
      
      try {
        await wrapped({ 
          data: { surveyId: 'test-survey', responseData: {} } 
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.code).toBe('unauthenticated');
      }
    });

    it('should require surveyId and responseData', async () => {
      const wrapped = test.wrap(staging.validateSurveyLimit);
      
      try {
        await wrapped({ 
          data: { surveyId: 'test-survey' }, 
          auth: { uid: 'test-user', token: {} } 
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.code).toBe('invalid-argument');
        expect(error.message).toContain('Survey ID and response data are required');
      }
    });

    it('should store response when valid', async () => {
      const wrapped = test.wrap(staging.validateSurveyLimit);
      
      const result = await wrapped({ 
        data: { 
          surveyId: 'test-survey',
          responseData: { answer: 'test' }
        }, 
        auth: { 
          uid: 'test-user', 
          token: { email: 'test@example.com' } 
        } 
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('responseId');
      expect(result).toHaveProperty('message');
      expect(result.success).toBe(true);
      expect(result.responseId).toBe('test-id');
      expect(result.message).toBe('Survey response submitted successfully');
    });
  });
});

// Clean up
afterAll(() => {
  test.cleanup();
});