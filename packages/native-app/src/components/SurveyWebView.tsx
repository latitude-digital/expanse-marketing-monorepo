import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert, Text, TouchableOpacity } from 'react-native';
import { WebView, WebViewMessageEvent, WebViewNavigation } from 'react-native-webview';
import type { ExpanseEvent } from '@expanse/shared/types';
import { environment } from '../config/environment';
import { themeProvider } from '../utils/theme-provider';
import { offlineDetector } from '../utils/offline-detector';

export interface SurveyCompletionData {
  surveyId: string;
  eventId: string;
  responses: Record<string, any>;
  completedAt: string;
  duration: number;
}

export interface SurveyWebViewProps {
  event: ExpanseEvent;
  onSurveyComplete?: (data: SurveyCompletionData) => void;
  onSurveyError?: (error: Error) => void;
  onNavigationStateChange?: (navState: WebViewNavigation) => void;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  allowsBackForwardNavigationGestures?: boolean;
  style?: object;
}

const SurveyWebView: React.FC<SurveyWebViewProps> = ({
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

  /**
   * Generate survey URL with proper parameters
   */
  const getSurveyHTML = useCallback((): string => {
    const surveyJson = JSON.stringify(event.questions);
    const brandColor = event.brand === 'Ford' ? '#0066CC' : 
                       event.brand === 'Lincoln' ? '#8B1538' : '#666666';
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Survey</title>
    <script src="https://unpkg.com/survey-core@1.9.131/survey.core.min.js"></script>
    <script src="https://unpkg.com/survey-js-ui@1.9.131/survey-js-ui.min.js"></script>
    <link href="https://unpkg.com/survey-core@1.9.131/defaultV2.min.css" type="text/css" rel="stylesheet">
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background-color: #f8f9fa;
        }
        .sv_main { 
            background-color: white; 
            border-radius: 8px; 
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .sv-btn { background-color: ${brandColor} !important; }
        .sv-btn:hover { background-color: ${brandColor}dd !important; }
        .sv_progress_bar > span { background-color: ${brandColor} !important; }
        .sv_q_radiogroup_control_item input[type=radio]:checked + label:before { 
            background-color: ${brandColor} !important; 
        }
        .sv_q_rating_item.sv_q_rating_item_active { background-color: ${brandColor} !important; }
    </style>
</head>
<body>
    <div id="surveyContainer"></div>
    <script>
        const surveyJson = ${surveyJson};
        
        const survey = new Survey.Model(surveyJson);
        
        survey.onComplete.add(function (result) {
            const completionData = {
                surveyId: 'survey-' + Date.now(),
                eventId: '${event.id}',
                responses: result.data,
                completedAt: new Date().toISOString(),
                duration: Date.now() - ${Date.now()}
            };
            
            // Send completion data to React Native
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'survey_complete',
                    data: completionData
                }));
            }
        });
        
        survey.render(document.getElementById("surveyContainer"));
    </script>
</body>
</html>`;
  }, [event.questions, event.id, event.brand]);

  /**
   * Inject custom CSS and JavaScript for mobile optimization
   */
  const getInjectedJavaScript = useCallback((): string => {
    const brandCssClass = themeProvider.getBrandCSSClass(event.brand || 'Other');
    
    return `
      (function() {
        // Mobile optimization styles
        const mobileStyles = \`
          body {
            margin: 0;
            padding: 0;
            font-size: 16px;
            -webkit-text-size-adjust: 100%;
            -webkit-user-select: none;
            user-select: none;
          }
          
          .sv_main {
            padding: 12px !important;
          }
          
          .sv_qstn {
            margin-bottom: 20px !important;
          }
          
          .sv_qcbc label {
            min-height: 44px !important;
            padding: 12px !important;
            display: flex !important;
            align-items: center !important;
          }
          
          input[type="text"], input[type="email"], input[type="tel"], 
          input[type="number"], textarea, select {
            min-height: 44px !important;
            font-size: 16px !important;
            padding: 12px !important;
            border-radius: 8px !important;
          }
          
          button {
            min-height: 44px !important;
            font-size: 16px !important;
            padding: 12px 24px !important;
            border-radius: 8px !important;
          }
          
          .sv_complete_btn {
            background-color: var(--semantic-color-fill-onlight-interactive) !important;
            border-color: var(--semantic-color-fill-onlight-interactive) !important;
          }
          
          /* Disable zoom on input focus */
          input, select, textarea {
            font-size: 16px !important;
          }
          
          /* Brand-specific styling */
          #fd-nxt {
            font-family: ${themeProvider.getBrandFontFamily(event.brand || 'Other')} !important;
          }
        \`;
        
        // Inject mobile styles
        const styleSheet = document.createElement('style');
        styleSheet.textContent = mobileStyles;
        document.head.appendChild(styleSheet);
        
        // Apply brand CSS class to wrapper
        const wrapper = document.getElementById('fd-nxt');
        if (wrapper) {
          wrapper.className = '${brandCssClass}';
        } else {
          document.body.classList.add('${brandCssClass}');
        }
        
        // Survey completion detection
        let surveyStartTime = ${surveyStartTime};
        
        // Listen for SurveyJS completion
        if (window.Survey && window.Survey.SurveyModel) {
          const checkForSurvey = () => {
            const surveyElement = document.querySelector('.sv_main');
            if (surveyElement && window.survey) {
              window.survey.onComplete.add((sender, options) => {
                const completionData = {
                  surveyId: sender.id || 'unknown',
                  eventId: '${event.id}',
                  responses: sender.data,
                  completedAt: new Date().toISOString(),
                  duration: Date.now() - surveyStartTime,
                };
                
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'survey_complete',
                  data: completionData
                }));
              });
              
              // Track survey errors
              sender.onError.add((sender, options) => {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'survey_error',
                  error: options.error
                }));
              });
            } else {
              setTimeout(checkForSurvey, 1000);
            }
          };
          
          checkForSurvey();
        }
        
        // Page load completion signal
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'page_loaded',
          url: window.location.href
        }));
        
        // Prevent right-click context menu
        document.addEventListener('contextmenu', (e) => {
          e.preventDefault();
        });
        
        // Prevent text selection
        document.addEventListener('selectstart', (e) => {
          e.preventDefault();
        });
        
        // Handle keyboard shortcuts
        document.addEventListener('keydown', (e) => {
          // Disable F5, Ctrl+R, Cmd+R refresh
          if (e.key === 'F5' || (e.ctrlKey && e.key === 'r') || (e.metaKey && e.key === 'r')) {
            e.preventDefault();
          }
          
          // Disable developer tools
          if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
            e.preventDefault();
          }
        });
        
        true; // Required for injected script
      })();
    `;
  }, [event, surveyStartTime]);

  /**
   * Handle messages from WebView
   */
  const handleMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      
      switch (message.type) {
        case 'survey_complete':
          if (onSurveyComplete) {
            onSurveyComplete(message.data);
          }
          break;
          
        case 'survey_error':
          const error = new Error(message.error || 'Survey error occurred');
          if (onSurveyError) {
            onSurveyError(error);
          }
          break;
          
        case 'page_loaded':
          setLoading(false);
          setError(null);
          if (onLoadEnd) {
            onLoadEnd();
          }
          break;
          
        default:
          console.log('Unknown WebView message:', message);
      }
    } catch (error) {
      console.error('Failed to parse WebView message:', error);
    }
  }, [onSurveyComplete, onSurveyError, onLoadEnd]);

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
        'Connection Error',
        'Unable to load survey after multiple attempts. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
    }
  }, [retryCount]);

  /**
   * Check if URL should be allowed to load
   */
  const shouldStartLoadWithRequest = useCallback((request: any): boolean => {
    const { url } = request;
    const webAppUrl = environment.webAppUrl;
    
    // Only allow navigation within web app domain
    return url.startsWith(webAppUrl) || url.startsWith('about:blank');
  }, []);

  if (!isOnline) {
    return (
      <View style={[styles.container, styles.errorContainer, style]}>
        <Text style={styles.errorTitle}>No Internet Connection</Text>
        <Text style={styles.errorText}>
          Survey requires an internet connection to load. Please check your connection and try again.
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
        source={{ html: getSurveyHTML() }}
        onMessage={handleMessage}
        onLoadStart={handleLoadStart}
        onError={handleError}
        onNavigationStateChange={handleNavigationStateChange}
        onShouldStartLoadWithRequest={shouldStartLoadWithRequest}
        injectedJavaScript={getInjectedJavaScript()}
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
        allowUniversalAccessFromFileURLs={false}
        allowFileAccessFromFileURLs={false}
        mixedContentMode="never"
        // Performance optimizations
        cacheEnabled={true}
        cacheMode="LOAD_DEFAULT"
        // Kiosk mode settings
        userAgent="ExpanseSurveyKiosk/1.0"
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
    backgroundColor: '#0066CC',
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

export default SurveyWebView;