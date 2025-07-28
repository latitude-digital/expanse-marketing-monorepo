import * as admin from 'firebase-admin';
import { 
  setCloudFrontCookies, 
  checkSurveyLimit, 
  validateSurveyLimit 
} from '../index';

// Initialize test environment for offline testing
const test = require('firebase-functions-test')();

// Mock Firebase Admin
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
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
    }))
  }))
}));

describe('Firebase Functions', () => {
  let mockFirestore: any;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup Firestore mock
    mockFirestore = {
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
      }))
    };
    
    (admin.firestore as unknown as jest.Mock).mockReturnValue(mockFirestore);
  });

  afterAll(() => {
    test.cleanup();
  });

  describe('setCloudFrontCookies', () => {
    const mockData = {};
    const mockContext = {
      auth: {
        uid: 'test-user-123',
        token: { email: 'test@example.com' }
      }
    };

    it('should return CloudFront cookies for authenticated users', async () => {
      const wrapped = test.wrap(setCloudFrontCookies);
      const result = await wrapped(mockData, mockContext);

      expect(result).toHaveProperty('cookies');
      expect(result).toHaveProperty('expires');
      expect(result.cookies).toHaveProperty('CloudFront-Policy');
      expect(result.cookies).toHaveProperty('CloudFront-Signature');
      expect(result.cookies).toHaveProperty('CloudFront-Key-Pair-Id');
    });

    it('should throw error for unauthenticated users', async () => {
      const wrapped = test.wrap(setCloudFrontCookies);
      const unauthenticatedContext = { auth: null };

      await expect(
        wrapped(mockData, unauthenticatedContext)
      ).rejects.toThrow('unauthenticated');
    });
  });

  describe('checkSurveyLimit', () => {
    const mockData = {
      surveyId: 'test-survey-123',
      deviceId: 'test-device-456'
    };
    const mockContext = {
      auth: {
        uid: 'test-user-123',
        token: { email: 'test@example.com' }
      }
    };

    it('should return survey limit information', async () => {
      // Mock survey responses query
      const mockSnapshot = { size: 0 };
      const mockQuery = {
        where: jest.fn(() => ({
          get: jest.fn().mockResolvedValue(mockSnapshot)
        })),
        get: jest.fn().mockResolvedValue(mockSnapshot)
      };
      
      mockFirestore.collection.mockReturnValue({
        where: jest.fn(() => mockQuery)
      });

      // Mock survey document
      const mockSurveyDoc = {
        data: jest.fn().mockReturnValue({ maxResponses: 1 })
      };
      mockFirestore.collection.mockReturnValue({
        where: jest.fn(() => mockQuery),
        doc: jest.fn(() => ({
          get: jest.fn().mockResolvedValue(mockSurveyDoc)
        }))
      });

      const wrapped = test.wrap(checkSurveyLimit);
      const result = await wrapped(mockData, mockContext);

      expect(result).toEqual({
        canSubmit: true,
        responseCount: 0,
        maxResponses: 1,
        remaining: 1
      });
    });

    it('should require survey ID', async () => {
      const wrapped = test.wrap(checkSurveyLimit);
      const invalidData = { deviceId: 'test-device' };

      await expect(
        wrapped(invalidData, mockContext)
      ).rejects.toThrow('invalid-argument');
    });

    it('should require authentication', async () => {
      const wrapped = test.wrap(checkSurveyLimit);
      const unauthenticatedContext = { auth: null };

      await expect(
        wrapped(mockData, unauthenticatedContext)
      ).rejects.toThrow('unauthenticated');
    });
  });

  describe('validateSurveyLimit', () => {
    const mockData = {
      surveyId: 'test-survey-123',
      deviceId: 'test-device-456',
      responseData: { answer1: 'test answer' }
    };
    const mockContext = {
      auth: {
        uid: 'test-user-123',
        token: { email: 'test@example.com' }
      }
    };

    it('should validate and store survey response', async () => {
      // Mock survey limit check (user can submit)
      const mockSnapshot = { size: 0 };
      const mockQuery = {
        where: jest.fn(() => ({
          get: jest.fn().mockResolvedValue(mockSnapshot)
        })),
        get: jest.fn().mockResolvedValue(mockSnapshot)
      };
      
      // Mock survey document
      const mockSurveyDoc = {
        data: jest.fn().mockReturnValue({ maxResponses: 1 })
      };

      // Mock response storage
      const mockAddResult = { id: 'new-response-123' };

      mockFirestore.collection.mockImplementation((collectionName: string) => {
        if (collectionName === 'surveyResponses') {
          return {
            where: jest.fn(() => mockQuery),
            add: jest.fn().mockResolvedValue(mockAddResult)
          };
        } else if (collectionName === 'surveys') {
          return {
            doc: jest.fn(() => ({
              get: jest.fn().mockResolvedValue(mockSurveyDoc)
            }))
          };
        }
        return mockQuery;
      });

      const wrapped = test.wrap(validateSurveyLimit);
      const result = await wrapped(mockData, mockContext);

      expect(result).toEqual({
        success: true,
        responseId: 'new-response-123',
        message: 'Survey response submitted successfully'
      });
    });

    it('should reject when survey limit exceeded', async () => {
      // Mock survey responses (limit exceeded)
      const mockSnapshot = { size: 1 };
      const mockQuery = {
        where: jest.fn(() => ({
          get: jest.fn().mockResolvedValue(mockSnapshot)
        })),
        get: jest.fn().mockResolvedValue(mockSnapshot)
      };
      
      // Mock survey document (max 1 response)
      const mockSurveyDoc = {
        data: jest.fn().mockReturnValue({ maxResponses: 1 })
      };

      mockFirestore.collection.mockImplementation((collectionName: string) => {
        if (collectionName === 'surveyResponses') {
          return {
            where: jest.fn(() => mockQuery)
          };
        } else if (collectionName === 'surveys') {
          return {
            doc: jest.fn(() => ({
              get: jest.fn().mockResolvedValue(mockSurveyDoc)
            }))
          };
        }
        return mockQuery;
      });

      const wrapped = test.wrap(validateSurveyLimit);

      await expect(
        wrapped(mockData, mockContext)
      ).rejects.toThrow('permission-denied');
    });

    it('should require survey ID and response data', async () => {
      const wrapped = test.wrap(validateSurveyLimit);
      const invalidData = { deviceId: 'test-device' };

      await expect(
        wrapped(invalidData, mockContext)
      ).rejects.toThrow('invalid-argument');
    });

    it('should require authentication', async () => {
      const wrapped = test.wrap(validateSurveyLimit);
      const unauthenticatedContext = { auth: null };

      await expect(
        wrapped(mockData, unauthenticatedContext)
      ).rejects.toThrow('unauthenticated');
    });
  });
});