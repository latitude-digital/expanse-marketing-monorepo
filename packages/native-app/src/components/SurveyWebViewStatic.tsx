import React, { useEffect, useState, useRef } from 'react';
import { View, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import StaticServer from '@dr.pogodin/react-native-static-server';
import RNFS from '@dr.pogodin/react-native-fs';
import { Asset } from 'expo-asset';
import { Brand } from '@expanse/shared';

interface SurveyWebViewStaticProps {
  surveyJson: any;
  brand?: Brand;
  eventId: string;
  responseId?: string;
  existingAnswers?: Record<string, any>;
  theme?: any;
  onComplete?: (data: any) => void;
  onProgress?: (data: any) => void;
  onError?: (error: string) => void;
}

export const SurveyWebViewStatic: React.FC<SurveyWebViewStaticProps> = ({
  surveyJson,
  brand = 'FORD',
  eventId,
  responseId,
  existingAnswers,
  theme,
  onComplete,
  onProgress,
  onError,
}) => {
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);
  const serverRef = useRef<StaticServer | null>(null);

  useEffect(() => {
    setupStaticServer();

    return () => {
      // Cleanup server on unmount
      if (serverRef.current) {
        serverRef.current.stop();
      }
    };
  }, []);

  const setupStaticServer = async () => {
    try {
      console.log('[SurveyWebViewStatic] Setting up static server...');

      // Create a directory for our survey files
      const surveyDir = `${RNFS.DocumentDirectoryPath}/survey`;
      
      // Ensure directory exists
      const dirExists = await RNFS.exists(surveyDir);
      if (!dirExists) {
        await RNFS.mkdir(surveyDir);
      }

      // Load the bundled survey HTML
      const surveyAsset = Asset.fromModule(require('../../assets/survey/offline-survey.html'));
      await surveyAsset.downloadAsync();

      if (!surveyAsset.localUri) {
        throw new Error('Failed to load survey bundle');
      }

      // Copy the survey bundle to our directory
      const surveyPath = `${surveyDir}/index.html`;
      await RNFS.copyFile(surveyAsset.localUri.replace('file://', ''), surveyPath);

      console.log('[SurveyWebViewStatic] Survey copied to:', surveyPath);

      // Start the static server
      serverRef.current = new StaticServer(8080, surveyDir, {
        localOnly: true,
        keepAlive: true,
      });

      const url = await serverRef.current.start();
      console.log('[SurveyWebViewStatic] Server started at:', url);
      
      setServerUrl(url);
      setLoading(false);

    } catch (error) {
      console.error('[SurveyWebViewStatic] Failed to setup server:', error);
      onError?.(`Failed to setup offline survey: ${error}`);
      setLoading(false);
    }
  };

  const handleMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      console.log('[SurveyWebViewStatic] Message from WebView:', message.type);

      switch (message.type) {
        case 'PAGE_LOADED':
          // Send survey configuration
          const initMessage = {
            type: 'SURVEY_INIT',
            payload: {
              surveyJson,
              brand,
              eventId,
              responseId,
              answers: existingAnswers,
              theme,
              locale: 'en',
            },
          };
          
          webViewRef.current?.postMessage(JSON.stringify(initMessage));
          break;

        case 'SURVEY_READY':
          console.log('[SurveyWebViewStatic] Survey ready');
          setLoading(false);
          break;

        case 'SURVEY_COMPLETED':
          console.log('[SurveyWebViewStatic] Survey completed:', message.payload);
          onComplete?.(message.payload);
          break;

        case 'SAVE_PROGRESS':
          console.log('[SurveyWebViewStatic] Progress saved:', message.payload);
          onProgress?.(message.payload);
          break;

        case 'SURVEY_ERROR':
          console.error('[SurveyWebViewStatic] Survey error:', message.payload);
          onError?.(message.payload.error);
          break;

        case 'CONSOLE_LOG':
          console.log('[WebView]', message.payload.message, message.payload.data);
          break;

        default:
          console.log('[SurveyWebViewStatic] Unhandled message:', message);
      }
    } catch (error) {
      console.error('[SurveyWebViewStatic] Error handling message:', error);
    }
  };

  if (!serverUrl) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" />
        </View>
      )}
      <WebView
        ref={webViewRef}
        source={{ uri: serverUrl }}
        style={styles.webView}
        onMessage={handleMessage}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('[SurveyWebViewStatic] WebView error:', nativeEvent);
          onError?.(`WebView error: ${nativeEvent.description}`);
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('[SurveyWebViewStatic] HTTP error:', nativeEvent);
          onError?.(`HTTP error: ${nativeEvent.statusCode}`);
        }}
        // iOS specific
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        // Android specific
        mixedContentMode="compatibility"
        domStorageEnabled={true}
        // Security
        javaScriptEnabled={true}
        originWhitelist={['http://localhost:*', 'http://127.0.0.1:*']}
        // Debugging
        webviewDebuggingEnabled={__DEV__}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
});