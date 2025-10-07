import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock Firebase modules for testing
jest.mock('./services/firebase', () => ({
  __esModule: true,
  default: {},
  shouldUseEmulator: jest.fn(() => false)
}));

jest.mock('./services/functions', () => ({
  __esModule: true,
  default: {}
}));

jest.mock('./services/firestore', () => ({
  __esModule: true,
  default: {},
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn()
}));

// Create a test query client
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

// Custom render function that includes providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  initialRoute?: string;
}

const customRender = (
  ui: ReactElement,
  {
    queryClient = createTestQueryClient(),
    initialRoute = '/',
    ...renderOptions
  }: CustomRenderOptions = {}
) => {
  // Set initial route
  window.history.pushState({}, 'Test page', initialRoute);

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
};

// Mock user data for testing
export const mockUser = {
  uid: 'test-user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  emailVerified: true
};

// Mock survey data
export const mockSurvey = {
  id: 'test-survey-123',
  title: 'Test Survey',
  description: 'A test survey for unit testing',
  questions: [
    {
      id: 'q1',
      type: 'text',
      title: 'What is your name?',
      isRequired: true
    },
    {
      id: 'q2',
      type: 'rating',
      title: 'How satisfied are you?',
      rateMax: 5,
      isRequired: false
    }
  ],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  active: true
};

// Mock Firebase Auth
export const mockAuth = {
  currentUser: mockUser,
  signInWithEmailAndPassword: jest.fn().mockResolvedValue({ user: mockUser }),
  signOut: jest.fn().mockResolvedValue(undefined),
  onAuthStateChanged: jest.fn((callback) => {
    callback(mockUser);
    return jest.fn(); // unsubscribe function
  })
};

// Mock Firebase Functions
export const mockFunctions = {
  checkSurveyLimit: jest.fn().mockResolvedValue({
    data: { canSubmit: true, responseCount: 0, maxResponses: 1, remaining: 1 }
  }),
  validateSurveyLimit: jest.fn().mockResolvedValue({
    data: { success: true, responseId: 'test-response-123' }
  }),
  setCloudFrontCookies: jest.fn().mockResolvedValue({
    data: {
      cookies: {
        'CloudFront-Policy': 'mock-policy',
        'CloudFront-Signature': 'mock-signature',
        'CloudFront-Key-Pair-Id': 'mock-key-id'
      },
      expires: Date.now() + 86400000
    }
  })
};

// Mock window.matchMedia for responsive tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() { return null; }
  disconnect() { return null; }
  unobserve() { return null; }
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() { return null; }
  disconnect() { return null; }
  unobserve() { return null; }
};

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };
// @ts-nocheck
