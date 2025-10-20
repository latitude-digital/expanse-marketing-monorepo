/**
 * Offline Survey WebView Component
 *
 * Loads a universal survey bundle that includes ALL brand CSS and components.
 * Brand selection happens at runtime based on the SURVEY_INIT message:
 * - Ford: FDS + Ford question types
 * - Lincoln: FDS + Lincoln question types
 * - Other: Standard SurveyJS renderers
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import type {
  WebViewToNativeMessage,
  SurveyConfig,
  SurveyCompletionData,
  SurveyProgressData,
} from '@meridian-event-tech/shared/types';

/**
 * Extended event type with survey fields
 * The native app adds these fields when fetching from Firestore
 */
interface SurveyEvent {
  id: string;
  brand?: 'Ford' | 'Lincoln' | 'Other';
  questions?: any; // SurveyJS JSON
  surveyJSON?: any; // Alternative field name
  surveyJSModel?: any; // Alternative field name
  theme?: any;
  surveyJSTheme?: any; // Alternative field name
  locale?: string;
}

/**
 * Component props
 */
interface OfflineSurveyWebViewProps {
  event: SurveyEvent;
  responseId?: string;
  existingAnswers?: Record<string, any>;
  onSurveyComplete?: (data: SurveyCompletionData) => void;
  onSurveyError?: (error: Error) => void;
  onProgressSave?: (data: SurveyProgressData) => void;
  onPageChanged?: (pageNo: number, totalPages: number) => void;
  style?: any;
}

// Re-export types for convenience
export type { SurveyCompletionData, SurveyProgressData };

/**
 * Survey Bundle Manager
 *
 * The survey HTML bundle is included in the Metro JS bundle (enabling OTA updates)
 * and written to the filesystem at app launch.
 * The WebView loads the HTML from a file:// URL to avoid iOS inline script size limits.
 */
import { Paths, File, Directory } from 'expo-file-system/next';

// Get the file:// URL for the survey bundle
// The bundle is written at app launch by _layout.tsx
function getSurveyFileUrl(): string {
  const surveyDir = new Directory(Paths.document, 'survey');
  const surveyFile = new File(surveyDir, 'index.html');
  return surveyFile.uri;
}

export const OfflineSurveyWebView: React.FC<OfflineSurveyWebViewProps> = ({
  event,
  responseId,
  existingAnswers,
  onSurveyComplete,
  onSurveyError,
  onProgressSave,
  onPageChanged,
  style,
}) => {
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [webViewReady, setWebViewReady] = useState(false);

  // Get the file:// URL for the survey bundle (written at app launch)
  const surveyFileUrl = getSurveyFileUrl();

  /**
   * Initialize survey once WebView is ready
   */
  useEffect(() => {
    if (!webViewReady) return;

    // Handle different survey JSON field names (surveyJSModel, surveyJSON)
    // IMPORTANT: Check surveyJSModel FIRST as it contains the latest survey definition
    let surveyJSONRaw = event.surveyJSModel || event.surveyJSON || { pages: [] };

    // Parse if it's a string
    const surveyJSON = typeof surveyJSONRaw === 'string'
      ? JSON.parse(surveyJSONRaw)
      : surveyJSONRaw;

    // Handle different theme field names (theme, surveyJSTheme)
    let themeRaw = event.theme || event.surveyJSTheme;

    // Parse theme if it's a string
    const theme = themeRaw && typeof themeRaw === 'string'
      ? JSON.parse(themeRaw)
      : themeRaw;

    // Default brand to 'Other' if not specified
    const brand = event.brand || 'Other';

    const surveyConfig: SurveyConfig = {
      surveyJSON,
      brand,
      eventId: event.id,
      responseId,
      answers: existingAnswers,
      theme,
      locale: event.locale,
    };

    // Send initialization message to WebView
    const initMessage = JSON.stringify({
      type: 'SURVEY_INIT',
      payload: surveyConfig,
    });

    // Small delay to ensure WebView is fully loaded
    setTimeout(() => {
      webViewRef.current?.injectJavaScript(`
        window.postMessage(${JSON.stringify(initMessage)}, '*');
        true;
      `);
    }, 500);
  }, [webViewReady, event, responseId, existingAnswers]);

  /**
   * Handle messages from WebView
   */
  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const message: WebViewToNativeMessage = JSON.parse(event.nativeEvent.data);

        switch (message.type) {
          case 'PAGE_LOADED':
            setWebViewReady(true);
            setLoading(false);
            break;

          case 'SURVEY_READY':
            break;

          case 'SURVEY_COMPLETE':
            if (onSurveyComplete) {
              onSurveyComplete(message.payload);
            }
            break;

          case 'SURVEY_ERROR':
            console.error('[OfflineSurveyWebView] Survey error:', message.payload.error);
            setError(message.payload.error);
            if (onSurveyError) {
              onSurveyError(new Error(message.payload.error));
            }
            break;

          case 'PAGE_CHANGED':
            if (onPageChanged) {
              onPageChanged(message.payload.pageNo, message.payload.totalPages);
            }
            break;

          case 'VALUE_CHANGED':
            break;

          case 'SAVE_PROGRESS':
            if (onProgressSave) {
              onProgressSave(message.payload);
            }
            break;

          case 'CONSOLE_LOG':
            console.log('[WebView]', message.payload.message, message.payload.data || '');
            break;

          case 'JAVASCRIPT_ERROR':
            console.error('[OfflineSurveyWebView] JavaScript error in WebView:', message.payload);
            break;

          default:
            break;
        }
      } catch (err) {
        console.error('[OfflineSurveyWebView] Error parsing message:', err);
      }
    },
    [onSurveyComplete, onSurveyError, onProgressSave, onPageChanged]
  );

  /**
   * Handle WebView load error
   */
  const handleError = useCallback(
    (syntheticEvent: any) => {
      const { nativeEvent } = syntheticEvent;
      const errorMessage = nativeEvent.description || 'Failed to load survey';

      console.error('[OfflineSurveyWebView] WebView error:', errorMessage);
      setLoading(false);
      setError(errorMessage);

      if (onSurveyError) {
        onSurveyError(new Error(errorMessage));
      }
    },
    [onSurveyError]
  );

  /**
   * Handle WebView load start
   */
  const handleLoadStart = useCallback(() => {
    setLoading(true);
    setError(null);
  }, []);

  /**
   * Handle WebView load end
   */
  const handleLoadEnd = useCallback(() => {
    // Don't set loading to false here - wait for PAGE_LOADED message
  }, []);

  if (error) {
    return (
      <View style={[styles.container, styles.errorContainer, style]}>
        <Text style={styles.errorTitle}>Survey Load Error</Text>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  const brand = event.brand || 'Other';

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        source={{ uri: surveyFileUrl }}
        onMessage={handleMessage}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        originWhitelist={['*']}
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        bounces={false}
        scrollEnabled={true}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        // iOS-specific props
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        // Performance
        cacheEnabled={true}
        // Kiosk mode
        userAgent="MeridianSurveyKiosk/1.0"
        // Inject error handler to catch JavaScript errors
        injectedJavaScriptBeforeContentLoaded={`
          window.onerror = function(msg, url, line, col, error) {
            window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'JAVASCRIPT_ERROR',
              payload: { message: msg, line: line, col: col, error: error ? error.toString() : null }
            }));
            return false;
          };
          true;
        `}
        style={styles.webview}
      />

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#257180" />
          <Text style={styles.loadingText}>Loading {brand} survey...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 12,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#F8F9FA',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
});

export default OfflineSurveyWebView;
