import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SurveyWebView from '../../src/components/SurveyWebView';
import type { MeridianEvent as ExpanseEvent } from '@meridian-event-tech/shared/types';

// Mock dependencies
jest.mock('react-native-webview', () => ({
  WebView: 'WebView',
}));

jest.mock('../../src/config/environment', () => ({
  environment: {
    webApp: {
      baseUrl: 'http://localhost:8002',
    },
  },
}));

jest.mock('../../src/utils/theme-provider', () => ({
  themeProvider: {
    setTheme: jest.fn(),
    getBrandCSSClass: jest.fn().mockReturnValue('ford_light'),
    getBrandFontFamily: jest.fn().mockReturnValue('FordF1, Arial, sans-serif'),
    getBrandPrimaryColor: jest.fn().mockReturnValue('#257180'),
  },
}));

jest.mock('../../src/utils/offline-detector', () => ({
  offlineDetector: {
    isOnline: jest.fn().mockReturnValue(true),
    addListener: jest.fn().mockReturnValue(() => {}),
  },
}));

const mockEvent: ExpanseEvent = {
  id: 'test-event-1',
  name: 'Ford Test Drive Event',
  brand: 'Ford',
  startDate: new Date(),
  endDate: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours later
  disabled: undefined,
  questions: {},
  theme: {},
  thanks: 'Experience the latest Ford vehicles'
};

describe('SurveyWebView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly when online', () => {
    const { getByTestId } = render(
      <SurveyWebView event={mockEvent} />
    );

    // Should render WebView when online
    expect(() => getByTestId('webview')).not.toThrow();
  });

  it('shows offline error when not connected', () => {
    // Mock offline state
    const mockOfflineDetector = require('../../src/utils/offline-detector');
    mockOfflineDetector.offlineDetector.isOnline.mockReturnValue(false);

    const { getByText } = render(
      <SurveyWebView event={mockEvent} />
    );

    expect(getByText('No Internet Connection')).toBeTruthy();
    expect(getByText('Survey requires an internet connection to load. Please check your connection and try again.')).toBeTruthy();
  });

  it('calls onSurveyComplete when survey is completed', async () => {
    const mockOnSurveyComplete = jest.fn();
    const { getByTestId } = render(
      <SurveyWebView 
        event={mockEvent} 
        onSurveyComplete={mockOnSurveyComplete}
      />
    );

    // Simulate WebView message for survey completion
    const webView = getByTestId('webview');
    const completionData = {
      surveyId: 'test-survey',
      eventId: mockEvent.id,
      responses: { question1: 'answer1' },
      completedAt: new Date().toISOString(),
      duration: 120000,
    };

    const messageEvent = {
      nativeEvent: {
        data: JSON.stringify({
          type: 'survey_complete',
          data: completionData,
        }),
      },
    };

    fireEvent(webView, 'onMessage', messageEvent);

    await waitFor(() => {
      expect(mockOnSurveyComplete).toHaveBeenCalledWith(completionData);
    });
  });

  it('calls onSurveyError when survey error occurs', async () => {
    const mockOnSurveyError = jest.fn();
    const { getByTestId } = render(
      <SurveyWebView 
        event={mockEvent} 
        onSurveyError={mockOnSurveyError}
      />
    );

    // Simulate WebView message for survey error
    const webView = getByTestId('webview');
    const errorMessage = 'Survey failed to load';

    const messageEvent = {
      nativeEvent: {
        data: JSON.stringify({
          type: 'survey_error',
          error: errorMessage,
        }),
      },
    };

    fireEvent(webView, 'onMessage', messageEvent);

    await waitFor(() => {
      expect(mockOnSurveyError).toHaveBeenCalledWith(expect.any(Error));
      expect(mockOnSurveyError.mock.calls[0][0].message).toBe(errorMessage);
    });
  });

  it('sets correct theme based on event brand', () => {
    const mockThemeProvider = require('../../src/utils/theme-provider');
    
    render(<SurveyWebView event={mockEvent} />);

    expect(mockThemeProvider.themeProvider.setTheme).toHaveBeenCalledWith('Ford');
  });

  it('generates correct survey URL', () => {
    const { getByTestId } = render(
      <SurveyWebView event={mockEvent} />
    );

    const webView = getByTestId('webview');
    const expectedUrl = `http://localhost:8002/survey?eventId=${mockEvent.id}&brand=Ford&mode=kiosk&platform=mobile`;
    
    // Check that WebView source contains expected parameters
    expect(webView.props.source.uri).toContain('eventId=test-event-1');
    expect(webView.props.source.uri).toContain('brand=Ford');
    expect(webView.props.source.uri).toContain('mode=kiosk');
    expect(webView.props.source.uri).toContain('platform=mobile');
  });

  it('shows loading indicator initially', () => {
    const { getByText } = render(
      <SurveyWebView event={mockEvent} />
    );

    expect(getByText('Loading survey...')).toBeTruthy();
  });

  it('hides loading indicator when page loads', async () => {
    const { getByTestId, queryByText } = render(
      <SurveyWebView event={mockEvent} />
    );

    // Simulate page load completion message
    const webView = getByTestId('webview');
    const messageEvent = {
      nativeEvent: {
        data: JSON.stringify({
          type: 'page_loaded',
          url: 'http://localhost:8002/survey',
        }),
      },
    };

    fireEvent(webView, 'onMessage', messageEvent);

    await waitFor(() => {
      expect(queryByText('Loading survey...')).toBeFalsy();
    });
  });

  it('shows error state and retry button on load error', async () => {
    const { getByTestId, getByText } = render(
      <SurveyWebView event={mockEvent} />
    );

    // Simulate WebView load error
    const webView = getByTestId('webview');
    const errorEvent = {
      nativeEvent: {
        description: 'Network error',
      },
    };

    fireEvent(webView, 'onError', errorEvent);

    await waitFor(() => {
      expect(getByText('Survey Load Error')).toBeTruthy();
      expect(getByText('Network error')).toBeTruthy();
      expect(getByText('Retry')).toBeTruthy();
    });
  });

  it('handles retry button press', async () => {
    const { getByTestId, getByText } = render(
      <SurveyWebView event={mockEvent} />
    );

    // Trigger error state
    const webView = getByTestId('webview');
    fireEvent(webView, 'onError', {
      nativeEvent: { description: 'Network error' },
    });

    await waitFor(() => {
      expect(getByText('Retry')).toBeTruthy();
    });

    // Press retry button
    fireEvent.press(getByText('Retry'));

    // Should attempt to reload
    expect(webView.props.source).toBeDefined();
  });

  it('calls navigation callbacks correctly', () => {
    const mockOnLoadStart = jest.fn();
    const mockOnLoadEnd = jest.fn();
    const mockOnNavigationStateChange = jest.fn();

    const { getByTestId } = render(
      <SurveyWebView 
        event={mockEvent}
        onLoadStart={mockOnLoadStart}
        onLoadEnd={mockOnLoadEnd}
        onNavigationStateChange={mockOnNavigationStateChange}
      />
    );

    const webView = getByTestId('webview');

    // Simulate load start
    fireEvent(webView, 'onLoadStart');
    expect(mockOnLoadStart).toHaveBeenCalled();

    // Simulate navigation state change
    const navState = { url: 'http://localhost:8002/survey', loading: false };
    fireEvent(webView, 'onNavigationStateChange', navState);
    expect(mockOnNavigationStateChange).toHaveBeenCalledWith(navState);

    // Simulate page loaded message (which triggers onLoadEnd)
    fireEvent(webView, 'onMessage', {
      nativeEvent: {
        data: JSON.stringify({
          type: 'page_loaded',
          url: 'http://localhost:8002/survey',
        }),
      },
    });
    expect(mockOnLoadEnd).toHaveBeenCalled();
  });

  it('injects correct JavaScript for mobile optimization', () => {
    const { getByTestId } = render(
      <SurveyWebView event={mockEvent} />
    );

    const webView = getByTestId('webview');
    const injectedJS = webView.props.injectedJavaScript;

    // Check that injected JavaScript contains mobile optimizations
    expect(injectedJS).toContain('min-height: 44px');
    expect(injectedJS).toContain('font-size: 16px');
    expect(injectedJS).toContain('ford_light');
    expect(injectedJS).toContain('FordF1, Arial, sans-serif');
    expect(injectedJS).toContain('survey_complete');
    expect(injectedJS).toContain('ReactNativeWebView.postMessage');
  });

  it('handles invalid WebView messages gracefully', () => {
    const { getByTestId } = render(
      <SurveyWebView event={mockEvent} />
    );

    const webView = getByTestId('webview');

    // Send invalid JSON message
    const invalidMessageEvent = {
      nativeEvent: {
        data: 'invalid json',
      },
    };

    // Should not throw error
    expect(() => {
      fireEvent(webView, 'onMessage', invalidMessageEvent);
    }).not.toThrow();
  });

  it('applies correct WebView security settings', () => {
    const { getByTestId } = render(
      <SurveyWebView event={mockEvent} />
    );

    const webView = getByTestId('webview');

    // Check security-related props
    expect(webView.props.allowUniversalAccessFromFileURLs).toBe(false);
    expect(webView.props.allowFileAccessFromFileURLs).toBe(false);
    expect(webView.props.mixedContentMode).toBe('never');
    expect(webView.props.javaScriptEnabled).toBe(true);
    expect(webView.props.domStorageEnabled).toBe(true);
  });
});
