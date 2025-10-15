import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  BackHandler,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import type { MeridianEvent as ExpanseEvent } from '@meridian-event-tech/shared/types';
import { OfflineSurveyWebView, SurveyCompletionData } from '../components/OfflineSurveyWebView';
import { themeProvider } from '../utils/theme-provider';
import { offlineDetector } from '../utils/offline-detector';
import { DatabaseService } from '../services/database';

interface SurveyScreenProps {
  event?: ExpanseEvent;
  onSurveyComplete?: (data: SurveyCompletionData) => void;
  onSurveyAbandoned?: (event: ExpanseEvent) => void;
  initialAnswers?: Record<string, any>;
  scanMetadata?: {
    value: string;
    time: string;
    response: any;
  };
  isPrefillLoading?: boolean;
}

const SurveyScreen: React.FC<SurveyScreenProps> = ({
  event,
  onSurveyComplete,
  onSurveyAbandoned,
  initialAnswers,
  scanMetadata,
  isPrefillLoading = false,
}) => {
  const navigation = useNavigation();
  const route = useRoute();
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [surveyStartTime] = useState(Date.now());
  const [isOnline, setIsOnline] = useState(offlineDetector.isOnline());
  const [surveyData, setSurveyData] = useState<SurveyCompletionData | null>(null);
  const [showCompletionScreen, setShowCompletionScreen] = useState(false);

  // Get event from route params if not provided via props
  const eventFromRoute = (route.params as any)?.event;
  const displayEvent = event || eventFromRoute;

  useEffect(() => {
    // Subscribe to connectivity changes
    const unsubscribe = offlineDetector.addListener((networkState) => {
      setIsOnline(networkState.isConnected && networkState.isInternetReachable);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    // Set theme based on event brand
    if (displayEvent?.brand) {
      themeProvider.setTheme(displayEvent.brand);
    }
  }, [displayEvent?.brand]);

  /**
   * Handle hardware back button on Android and navigation back
   */
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        handleBackNavigation();
        return true; // Prevent default back behavior
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => subscription?.remove();
    }, [])
  );

  /**
   * Handle back navigation with confirmation
   */
  const handleBackNavigation = useCallback(() => {
    if (showCompletionScreen) {
      // Allow immediate exit after completion
      handleExitSurvey();
      return;
    }

    setShowExitConfirm(true);
  }, [showCompletionScreen]);

  /**
   * Handle survey completion
   */
  const handleSurveyComplete = useCallback(async (data: SurveyCompletionData) => {
    const enrichedAnswers = {
      ...data.answers,
      _eventId: data.eventId,
      ...(scanMetadata
        ? {
            _scanValue: scanMetadata.value,
            _scanTime: scanMetadata.time,
            _scanResponse: scanMetadata.response,
          }
        : {}),
    };

    const enrichedData: SurveyCompletionData = {
      ...data,
      answers: enrichedAnswers,
    };

    setSurveyData(enrichedData);

    try {
      // Store survey response in local database
      const dbService = DatabaseService.createEncrypted();
      const operations = await dbService.getOperations();

      await operations.createSurveyResponse({
        id: `${enrichedData.eventId}_${Date.now()}`,
        event_id: enrichedData.eventId,
        data: JSON.stringify(enrichedData.answers),
        sync_status: 'pending',
      });

      // Show completion screen
      setShowCompletionScreen(true);

      // Call parent completion handler
      if (onSurveyComplete) {
        onSurveyComplete(enrichedData);
      }

      // Auto-exit after 5 seconds for kiosk mode
      setTimeout(() => {
        handleExitSurvey();
      }, 5000);

    } catch (error) {
      console.error('Failed to save survey response:', error);
      Alert.alert(
        'Save Error',
        'Survey completed but failed to save locally. Please try again.',
        [
          { text: 'OK', onPress: handleExitSurvey }
        ]
      );
    }
  }, [onSurveyComplete, scanMetadata, handleExitSurvey]);

  /**
   * Handle survey error
   */
  const handleSurveyError = useCallback((error: Error) => {
    console.error('Survey error:', error);
    Alert.alert(
      'Survey Error',
      `An error occurred while loading the survey: ${error.message}`,
      [
        { text: 'Retry', onPress: () => (navigation as any).replace('Survey', { event: displayEvent }) },
        { text: 'Exit', onPress: handleExitSurvey }
      ]
    );
  }, [displayEvent]);

  /**
   * Handle confirmed exit
   */
  const handleConfirmedExit = useCallback(() => {
    setShowExitConfirm(false);
    
    if (onSurveyAbandoned && displayEvent) {
      onSurveyAbandoned(displayEvent);
    }
    
    handleExitSurvey();
  }, [displayEvent, onSurveyAbandoned]);

  /**
   * Handle cancel exit
   */
  const handleCancelExit = useCallback(() => {
    setShowExitConfirm(false);
  }, []);

  /**
   * Exit survey and return to previous screen
   */
  const handleExitSurvey = useCallback(() => {
    // Clear any stored survey state to ensure privacy
    setSurveyData(null);
    setShowCompletionScreen(false);
    
    // Navigate back to event list or home
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('EventList' as never);
    }
  }, [navigation]);

  /**
   * Calculate survey duration
   */
  const getSurveyDuration = useCallback((): string => {
    const duration = Date.now() - surveyStartTime;
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [surveyStartTime]);

  if (!displayEvent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Event Not Found</Text>
          <Text style={styles.errorText}>Unable to load survey event.</Text>
          <TouchableOpacity style={styles.exitButton} onPress={handleExitSurvey}>
            <Text style={styles.exitButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const brandColor = themeProvider.getBrandPrimaryColor(displayEvent.brand || 'Other');

  return (
    <SafeAreaView style={styles.container}>
      {/* Survey Header */}
      <View style={[styles.header, { borderBottomColor: brandColor }]}>
        <View style={styles.headerContent}>
          <Text style={styles.eventTitle} numberOfLines={1}>
            {displayEvent.eventName || 'Survey'}
          </Text>
          <View style={styles.headerActions}>
            <View style={styles.statusIndicator}>
              <View style={[styles.statusDot, { backgroundColor: isOnline ? '#28A745' : '#FFC107' }]} />
              <Text style={styles.statusText}>
                {isOnline ? 'Online' : 'Offline'}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.exitHeaderButton, { borderColor: brandColor }]}
              onPress={handleBackNavigation}
              testID="survey-exit-button"
              accessible={true}
              accessibilityLabel="Exit survey"
              accessibilityRole="button"
            >
              <Text style={[styles.exitHeaderButtonText, { color: brandColor }]}>
                Exit
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Survey WebView - Offline Bundle */}
      <View style={styles.webviewWrapper}>
        {isPrefillLoading ? (
          <View style={styles.prefillLoader}>
            <ActivityIndicator size="large" color={brandColor} />
            <Text style={styles.prefillLoaderText}>Looking up badge...</Text>
          </View>
        ) : (
          <OfflineSurveyWebView
            event={displayEvent}
            existingAnswers={initialAnswers}
            onSurveyComplete={handleSurveyComplete}
            onSurveyError={handleSurveyError}
            style={styles.webviewContainer}
          />
        )}
      </View>

      {/* Exit Confirmation Modal */}
      <Modal
        visible={showExitConfirm}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelExit}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Exit Survey?</Text>
            <Text style={styles.modalText}>
              Are you sure you want to exit? Your progress will be lost.
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCancelExit}
                testID="survey-continue-button"
                accessible={true}
                accessibilityLabel="Continue survey"
                accessibilityRole="button"
              >
                <Text style={styles.cancelButtonText}>Continue Survey</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton, { backgroundColor: brandColor }]}
                onPress={handleConfirmedExit}
                testID="survey-confirm-exit-button"
                accessible={true}
                accessibilityLabel="Confirm exit survey"
                accessibilityRole="button"
              >
                <Text style={styles.confirmButtonText}>Exit Survey</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Completion Screen Modal */}
      <Modal
        visible={showCompletionScreen}
        transparent={true}
        animationType="fade"
        onRequestClose={handleExitSurvey}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.completionModalContent}>
            <Text style={styles.completionTitle}>Survey Complete!</Text>
            <Text style={styles.completionText}>
              Thank you for your participation. Your responses have been recorded.
            </Text>
            
            {surveyData && (
              <View style={styles.completionStats}>
                <Text style={styles.completionStat}>
                  Duration: {getSurveyDuration()}
                </Text>
                <Text style={styles.completionStat}>
                  Responses: {Object.keys(surveyData.answers).length}
                </Text>
              </View>
            )}
            
            <TouchableOpacity
              style={[styles.completionButton, { backgroundColor: brandColor }]}
              onPress={handleExitSurvey}
            >
              <Text style={styles.completionButtonText}>Continue</Text>
            </TouchableOpacity>
            
            <Text style={styles.autoExitText}>
              This screen will close automatically in a few seconds
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 2,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
    marginRight: 16,
  },
  exitHeaderButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 6,
  },
  exitHeaderButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: 'transparent',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusText: {
    fontSize: 11,
    color: '#666666',
    fontWeight: '500',
  },
  webviewWrapper: {
    flex: 1,
    position: 'relative',
  },
  webviewContainer: {
    flex: 1,
  },
  prefillLoader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  prefillLoaderText: {
    marginTop: 12,
    fontSize: 16,
    color: '#333333',
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
  },
  exitButton: {
    backgroundColor: '#257180',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  exitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    margin: 32,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#DEE2E6',
  },
  cancelButtonText: {
    color: '#495057',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#DC3545',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  completionModalContent: {
    backgroundColor: '#FFFFFF',
    margin: 32,
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  completionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#28A745',
    marginBottom: 16,
    textAlign: 'center',
  },
  completionText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  completionStats: {
    marginBottom: 24,
    alignItems: 'center',
  },
  completionStat: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 4,
  },
  completionButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginBottom: 16,
  },
  completionButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  autoExitText: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
  },
});

export default SurveyScreen;
