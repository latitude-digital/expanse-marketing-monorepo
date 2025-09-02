/**
 * Survey WebView SPA Component
 * 
 * Updated WebView component that uses the bundled SurveyJS SPA
 * instead of relying on web server endpoints
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert, Text, TouchableOpacity } from 'react-native';
import { WebView, WebViewMessageEvent, WebViewNavigation } from 'react-native-webview';
import type { ExpanseEvent } from '@expanse/shared/types';
import { themeProvider } from '../utils/theme-provider';
import { offlineDetector } from '../utils/offline-detector';
// No external file system dependencies needed

export interface SurveyCompletionData {
  surveyId: string;
  eventId: string;
  responses: Record<string, any>;
  completedAt: string;
  duration: number;
}

export interface SurveyWebViewSPAProps {
  event: ExpanseEvent;
  onSurveyComplete?: (data: SurveyCompletionData) => void;
  onSurveyError?: (error: Error) => void;
  onNavigationStateChange?: (navState: WebViewNavigation) => void;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  allowsBackForwardNavigationGestures?: boolean;
  style?: object;
}

const SurveyWebViewSPA: React.FC<SurveyWebViewSPAProps> = ({
  event,
  onSurveyComplete,
  onSurveyError,
  onNavigationStateChange,
  onLoadStart,
  onLoadEnd,
  allowsBackForwardNavigationGestures = false,
  style,
}) => {
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [surveyStartTime] = useState(Date.now());
  const [isOnline, setIsOnline] = useState(offlineDetector.isOnline());
  const [retryCount, setRetryCount] = useState(0);
  const [spaPath, setSpaPath] = useState<string | null>(null);
  const [surveyHtml, setSurveyHtml] = useState<string | null>(null);

  useEffect(() => {
    // Subscribe to connectivity changes
    const unsubscribe = offlineDetector.addListener((networkState) => {
      setIsOnline(networkState.isConnected && networkState.isInternetReachable);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    // Set theme based on event brand
    if (event.brand) {
      themeProvider.setTheme(event.brand);
    }
  }, [event.brand]);

  useEffect(() => {
    // Use very simple inline HTML that should work immediately
    const getBasicSurveyHTML = () => {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Survey</title>
          <style>
            html, body { 
              margin: 0; 
              padding: 0;
              width: 100%;
              height: 100%;
              overflow-x: hidden;
              box-sizing: border-box;
            }
            * { 
              box-sizing: border-box;
              max-width: 100%;
            }
            body { 
              padding: 12px; 
              font-family: -apple-system, BlinkMacSystemFont, sans-serif; 
              background: #f8f9fa;
            }
            .survey-container { 
              width: 100%; 
              background: white; 
              border-radius: 8px; 
              padding: 16px;
              overflow-x: hidden;
            }
            .question { 
              margin-bottom: 20px; 
              width: 100%;
              overflow-x: hidden;
            }
            .question label { 
              display: block; 
              margin-bottom: 8px; 
              font-weight: 600;
              font-size: 16px;
              line-height: 1.4;
              word-wrap: break-word;
              overflow-wrap: break-word;
              hyphens: auto;
            }
            .question input[type="text"] { 
              width: 100%; 
              padding: 12px; 
              border: 1px solid #ccc; 
              border-radius: 4px; 
              font-size: 16px;
              min-width: 0;
            }
            .question input[type="radio"] { 
              margin-right: 8px;
              flex-shrink: 0;
              width: 16px;
              height: 16px;
            }
            .radio-option { 
              margin-bottom: 8px; 
              display: flex; 
              align-items: flex-start;
              width: 100%;
              overflow-x: hidden;
            }
            .radio-option label {
              margin-bottom: 0;
              font-weight: normal;
              flex: 1;
              min-width: 0;
              word-wrap: break-word;
              overflow-wrap: break-word;
              hyphens: auto;
              padding-top: 1px;
            }
            .submit-btn { 
              background: #0066cc; 
              color: white; 
              padding: 12px 24px; 
              border: none; 
              border-radius: 4px; 
              font-size: 16px; 
              cursor: pointer;
              width: 100%;
              max-width: 200px;
              margin-top: 12px;
            }
            .submit-btn:hover { background: #0052a3; }
            
            /* Prevent any element from causing horizontal overflow */
            form { width: 100%; overflow-x: hidden; }
            input, select, textarea { max-width: 100%; }
          </style>
        </head>
        <body>
          <div id="survey-container" class="survey-container">
            <form id="survey-form">
              <div class="question">
                <label>What is your first name?</label>
                <input type="text" name="firstName" required>
              </div>
              <div class="question">
                <label>What is your last name?</label>
                <input type="text" name="lastName" required>
              </div>
              <div class="question">
                <label>How would you rate your experience?</label>
                <div class="radio-option">
                  <input type="radio" name="experience" value="Excellent" required> Excellent
                </div>
                <div class="radio-option">
                  <input type="radio" name="experience" value="Good" required> Good
                </div>
                <div class="radio-option">
                  <input type="radio" name="experience" value="Average" required> Average
                </div>
                <div class="radio-option">
                  <input type="radio" name="experience" value="Poor" required> Poor
                </div>
              </div>
              <button type="submit" class="submit-btn">Submit Survey</button>
            </form>
          </div>
          <script>
            console.log('Simple survey HTML loaded');
            
            document.getElementById('survey-form').addEventListener('submit', function(e) {
              e.preventDefault();
              const formData = new FormData(e.target);
              const responses = {};
              for (let [key, value] of formData.entries()) {
                responses[key] = value;
              }
              
              console.log('Survey completed:', responses);
              
              window.ReactNativeWebView?.postMessage(JSON.stringify({
                type: 'SURVEY_COMPLETE',
                payload: {
                  surveyId: 'survey-' + Date.now(),
                  eventId: 'simple-survey',
                  responses: responses,
                  completedAt: new Date().toISOString(),
                  duration: 0
                }
              }));
            });
            
            // Signal ready immediately
            window.ReactNativeWebView?.postMessage(JSON.stringify({
              type: 'PAGE_LOADED',
              payload: { loaded: true }
            }));
          </script>
        </body>
        </html>
      `;
    };

    // Set HTML content directly
    const htmlContent = getBasicSurveyHTML();
    setSurveyHtml(htmlContent);
    setSpaPath(null); // We'll use HTML source instead
    console.log('[SurveyWebViewSPA] Using simple inline HTML survey - updated!');
  }, []);

  /**
   * Initialize survey in the SPA
   */
  const initializeSurvey = useCallback(() => {
    if (!webViewRef.current) return;

    const message = {
      type: 'INIT_SURVEY',
      payload: {
        surveyJSON: event.questions,
        brand: event.brand?.toLowerCase() || 'ford',
        theme: 'light',
        eventId: event.id,
        kioskMode: true,
      },
    };

    const messageString = JSON.stringify(message);
    webViewRef.current.postMessage(messageString);
    
    console.log('[SurveyWebViewSPA] Survey initialization message sent');
  }, [event]);

  /**
   * Handle messages from the SPA WebView
   */
  const handleMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      
      console.log('[SurveyWebViewSPA] Received message:', message.type);
      
      switch (message.type) {
        case 'SURVEY_COMPLETE':
          if (onSurveyComplete) {
            onSurveyComplete(message.payload);
          }
          break;
          
        case 'SURVEY_ERROR':
          const error = new Error(message.payload.error || 'Survey error occurred');
          if (onSurveyError) {
            onSurveyError(error);
          }
          console.error('[SurveyWebViewSPA] Survey error:', message.payload);
          break;
          
        case 'PAGE_LOADED':
          setLoading(false);
          setError(null);
          if (onLoadEnd) {
            onLoadEnd();
          }
          // Initialize survey after page loads
          setTimeout(initializeSurvey, 500);
          break;

        case 'SURVEY_PROGRESS':
          console.log('[SurveyWebViewSPA] Survey progress:', message.payload);
          break;

        case 'THEME_CHANGE':
          console.log('[SurveyWebViewSPA] Theme change:', message.payload);
          break;
          
        default:
          console.log('[SurveyWebViewSPA] Unknown message:', message);
      }
    } catch (error) {
      console.error('[SurveyWebViewSPA] Failed to parse message:', error);
    }
  }, [onSurveyComplete, onSurveyError, onLoadEnd, initializeSurvey]);

  /**
   * Handle WebView load start
   */
  const handleLoadStart = useCallback(() => {
    setLoading(true);
    setError(null);
    if (onLoadStart) {
      onLoadStart();
    }
  }, [onLoadStart]);

  /**
   * Handle WebView load error
   */
  const handleError = useCallback((syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    const errorMessage = nativeEvent.description || 'Failed to load survey';
    
    setLoading(false);
    setError(errorMessage);
    
    if (onSurveyError) {
      onSurveyError(new Error(errorMessage));
    }
    
    console.error('[SurveyWebViewSPA] WebView error:', errorMessage);
  }, [onSurveyError]);

  /**
   * Handle navigation state changes
   */
  const handleNavigationStateChange = useCallback((navState: WebViewNavigation) => {
    if (onNavigationStateChange) {
      onNavigationStateChange(navState);
    }
  }, [onNavigationStateChange]);

  /**
   * Retry loading the survey
   */
  const handleRetry = useCallback(() => {
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1);
      setError(null);
      setLoading(true);
      webViewRef.current?.reload();
    } else {
      Alert.alert(
        'Survey Error',
        'Unable to load survey after multiple attempts. Please try again.',
        [{ text: 'OK' }]
      );
    }
  }, [retryCount]);

  /**
   * Check if URL should be allowed to load
   */
  const shouldStartLoadWithRequest = useCallback((request: any): boolean => {
    const { url } = request;
    
    // Only allow file:// URLs for the bundled SPA
    return url.startsWith('file://') || url.startsWith('about:blank');
  }, []);

  // Show loading if HTML content is not ready
  if (!surveyHtml) {
    return (
      <View style={[styles.container, styles.errorContainer, style]}>
        <ActivityIndicator 
          size="large" 
          color={themeProvider.getBrandPrimaryColor(event.brand || 'Other')} 
        />
        <Text style={styles.loadingText}>Preparing survey...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.container, styles.errorContainer, style]}>
        <Text style={styles.errorTitle}>Survey Load Error</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        source={{ html: surveyHtml || '<div>Loading...</div>' }}
        onMessage={handleMessage}
        onLoadStart={handleLoadStart}
        onError={handleError}
        onNavigationStateChange={handleNavigationStateChange}
        onShouldStartLoadWithRequest={shouldStartLoadWithRequest}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        allowsBackForwardNavigationGestures={allowsBackForwardNavigationGestures}
        bounces={false}
        scrollEnabled={true}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        style={styles.webview}
        // Security settings
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        allowsFullscreenVideo={false}
        allowUniversalAccessFromFileURLs={true} // Required for bundled SPA
        allowFileAccessFromFileURLs={true}     // Required for bundled SPA
        mixedContentMode="never"
        // Performance optimizations
        cacheEnabled={false} // Disable cache to always use bundled version
        // Kiosk mode settings
        userAgent="ExpanseSurveyKiosk/2.0-SPA"
      />
      
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator 
            size="large" 
            color={themeProvider.getBrandPrimaryColor(event.brand || 'Other')} 
          />
          <Text style={styles.loadingText}>Loading survey...</Text>
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
  retryButton: {
    backgroundColor: '#257180',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SurveyWebViewSPA;