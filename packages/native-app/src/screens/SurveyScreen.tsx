import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { router, useLocalSearchParams } from 'expo-router';
import type { MeridianEvent as ExpanseEvent } from '@meridian-event-tech/shared/types';
import { OfflineSurveyWebView, SurveyCompletionData } from '../components/OfflineSurveyWebView';
import { themeProvider } from '../utils/theme-provider';
import { offlineDetector } from '../utils/offline-detector';
import { DatabaseService } from '../services/database';
import { surveySyncService } from '../services/survey-sync';
// COMMENTED OUT - Asset caching disabled
// import { replaceAssetUrlsInValue } from '../utils/asset-urls';
import type { CachedMeridianEvent } from '../services/event-cache';

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
  const params = useLocalSearchParams();
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isOnline, setIsOnline] = useState(offlineDetector.isOnline());

  // Extract route params for activation pre-fill
  const preFillDataParam = params.preFillData as string | undefined;
  const originalActivationPathParam = params.originalActivationPath as string | undefined;
  const scanValueParam = params.scanValue as string | undefined;
  const scanTimeParam = params.scanTime as string | undefined;

  // Get event from route params if not provided via props
  const eventFromRoute = (route.params as any)?.event;
  const displayEvent = event || eventFromRoute;

  // COMMENTED OUT - Asset caching disabled
  /*
  const assetMap = useMemo(() => {
    if (!displayEvent) {
      return {};
    }
    const map = (displayEvent as CachedMeridianEvent | undefined)?.assetMap;
    if (!map) {
      return {};
    }
    return map;
  }, [displayEvent]);

  const preparedEvent = useMemo(() => {
    if (!displayEvent) {
      return undefined;
    }

    const entries = Object.entries(assetMap);
    if (!entries.length) {
      return displayEvent;
    }

    return {
      ...displayEvent,
      questions: replaceAssetUrlsInValue(displayEvent.questions, assetMap),
      surveyJSON: replaceAssetUrlsInValue(displayEvent.surveyJSON, assetMap),
      surveyJSModel: replaceAssetUrlsInValue(displayEvent.surveyJSModel, assetMap),
      theme: replaceAssetUrlsInValue(displayEvent.theme, assetMap),
      surveyJSTheme: replaceAssetUrlsInValue(displayEvent.surveyJSTheme, assetMap),
      customConfig: replaceAssetUrlsInValue(displayEvent.customConfig, assetMap),
      thanks: replaceAssetUrlsInValue(displayEvent.thanks, assetMap),
    } as ExpanseEvent;
  }, [displayEvent, assetMap]);

  const surveyEvent = preparedEvent || displayEvent;
  */

  const surveyEvent = displayEvent;

  // Parse pre-fill data from activation survey if present
  const preFillAnswers = useMemo(() => {
    if (preFillDataParam && typeof preFillDataParam === 'string') {
      try {
        const parsed = JSON.parse(preFillDataParam);
        console.log('[ACTIVATIONS] 🔄 Activation pre-fill data received');
        console.log('[ACTIVATIONS] 📋 Number of fields being pre-filled:', Object.keys(parsed).length);
        console.log('[ACTIVATIONS] 🔑 Pre-fill field keys:', Object.keys(parsed).join(', '));
        if (originalActivationPathParam) {
          console.log('[ACTIVATIONS] 📍 Original activation path:', originalActivationPathParam);
        }
        return parsed;
      } catch (error) {
        console.error('[ACTIVATIONS] ❌ Failed to parse preFillData:', error);
        return null;
      }
    }
    return null;
  }, [preFillDataParam, originalActivationPathParam]);

  // Merge pre-fill data with initial answers (initial answers take precedence)
  const mergedInitialAnswers = useMemo(() => {
    if (preFillAnswers && initialAnswers) {
      return { ...preFillAnswers, ...initialAnswers };
    }
    return preFillAnswers || initialAnswers;
  }, [preFillAnswers, initialAnswers]);

  // Create scan metadata from route params if not provided via props
  const effectiveScanMetadata = useMemo(() => {
    if (scanMetadata) {
      return scanMetadata;
    }
    if (scanValueParam && scanTimeParam) {
      return {
        value: scanValueParam,
        time: scanTimeParam,
        response: null,
      };
    }
    return undefined;
  }, [scanMetadata, scanValueParam, scanTimeParam]);

  useEffect(() => {
    // Subscribe to connectivity changes
    const unsubscribe = offlineDetector.addListener((networkState) => {
      setIsOnline(networkState.isConnected && networkState.isInternetReachable);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    // Set theme based on event brand
    if (surveyEvent?.brand) {
      themeProvider.setTheme(surveyEvent.brand);
    }
  }, [surveyEvent?.brand]);

  useEffect(() => {
    // Log activation pre-fill status
    if (preFillAnswers && originalActivationPathParam) {
      console.log('[ACTIVATIONS] ✨ Pre-filling survey with activation data');
      console.log('[ACTIVATIONS] 📍 Original activation path:', originalActivationPathParam);
      console.log('[ACTIVATIONS] 📋 Pre-fill answer count:', Object.keys(preFillAnswers).length);
      console.log('[ACTIVATIONS] 🎯 Event ID:', surveyEvent?.id);
    }
  }, [preFillAnswers, originalActivationPathParam, surveyEvent?.id]);

  if (!surveyEvent) {
    return (
      <SafeAreaView style={styles.loadingFallback}>
        <ActivityIndicator size="large" color="#257180" />
        <Text style={styles.loadingFallbackText}>Preparing survey...</Text>
      </SafeAreaView>
    );
  }

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
    setShowExitConfirm(true);
  }, []);

  /**
   * Exit survey and return to event splash screen
   */
  const handleExitSurvey = useCallback(() => {
    // Dismiss back to the event splash screen
    if (surveyEvent?.id) {
      router.dismissTo(`/event/${surveyEvent.id}`);
    } else if (router.canGoBack()) {
      router.back();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('EventList' as never);
    }
  }, [navigation, surveyEvent?.id]);

  /**
   * Handle survey completion
   */
  const handleSurveyComplete = useCallback(async (data: SurveyCompletionData) => {
    console.log('[SurveyScreen] 📩 Received completion data from WebView');
    console.log('[SurveyScreen] Answer keys received:', Object.keys(data.answers));
    console.log('[SurveyScreen] data.answers.end_time:', data.answers.end_time);
    console.log('[SurveyScreen] data.answers._checkedIn:', data.answers._checkedIn);
    console.log('[SurveyScreen] data.answers._preSurveyID:', data.answers._preSurveyID);

    // Enrich with native-only metadata (_eventId, scan data, and activation data)
    // DO NOT override values from the WebView - it already set all the defaults
    const enrichedAnswers = {
      ...data.answers,
      _eventId: data.eventId,
      ...(effectiveScanMetadata
        ? {
            _scanValue: effectiveScanMetadata.value,
            _scanTime: effectiveScanMetadata.time,
            _scanResponse: effectiveScanMetadata.response,
          }
        : {}),
      // Include _originalActivation field if this is a linked activation survey
      ...(originalActivationPathParam
        ? { _originalActivation: originalActivationPathParam }
        : {}),
    };

    // Log activation survey submission
    if (originalActivationPathParam) {
      console.log('[ACTIVATIONS] 📤 Submitting activation survey');
      console.log('[ACTIVATIONS] 📍 _originalActivation path being saved:', originalActivationPathParam);
      console.log('[ACTIVATIONS] 🎯 Event ID being saved to:', data.eventId);
      console.log('[ACTIVATIONS] 📋 Total answer fields in submission:', Object.keys(enrichedAnswers).length);
    }

    console.log('[SurveyScreen] 📦 Enriched answer keys:', Object.keys(enrichedAnswers));
    console.log('[SurveyScreen] enrichedAnswers.end_time:', enrichedAnswers.end_time);
    console.log('[SurveyScreen] enrichedAnswers._checkedIn:', enrichedAnswers._checkedIn);

    const enrichedData: SurveyCompletionData = {
      ...data,
      answers: enrichedAnswers,
    };

    try {
      const dbService = DatabaseService.createEncrypted();
      const operations = await dbService.getOperations();

      // STEP 1: Save to Firestore using device_survey_guid as document ID
      // This returns immediately, even offline, and uses the UUID from the survey data
      console.log('[SurveyScreen] 💾 Saving survey to Firestore...');
      const firestoreId = await surveySyncService.saveSurvey(enrichedData);
      console.log('[SurveyScreen] ✅ Survey queued to Firestore with ID:', firestoreId);
      console.log('[SurveyScreen] ℹ️  Using device_survey_guid as document ID for consistency');

      // STEP 2: Save to local database with same device_survey_guid as ID
      // This ensures the same UUID is used everywhere (Firestore, local DB)
      await operations.createSurveyResponse({
        id: firestoreId, // This is the device_survey_guid
        event_id: enrichedData.eventId,
        data: JSON.stringify(enrichedData.answers),
        sync_status: 'synced', // Already queued to Firestore
      });

      console.log('[SurveyScreen] ✅ Survey backed up to local database with same ID');

      // STEP 3: Call completion callback if provided
      if (onSurveyComplete) {
        onSurveyComplete(enrichedData);
      }

      // STEP 4: Wait 5 seconds, then go back to event splash screen
      console.log('[SurveyScreen] ✅ Survey complete, waiting 5 seconds before returning to event splash screen');
      setTimeout(() => {
        console.log('[SurveyScreen] ⏰ 5 seconds elapsed, going back to event splash screen');
        handleExitSurvey();
      }, 5000);

    } catch (error) {
      console.error('[SurveyScreen] ❌ Failed to save survey:', error);
      Alert.alert(
        'Save Error',
        'Survey completed but failed to save. Please try again.',
        [
          { text: 'OK', onPress: handleExitSurvey }
        ]
      );
    }
  }, [onSurveyComplete, effectiveScanMetadata, originalActivationPathParam, handleExitSurvey, surveyEvent?.id]);

  /**
   * Handle survey error
   */
  const handleSurveyError = useCallback((error: Error) => {
    console.error('Survey error:', error);
    Alert.alert(
      'Survey Error',
      `An error occurred while loading the survey: ${error.message}`,
      [
        { text: 'Retry', onPress: () => (navigation as any).replace('Survey', { event: surveyEvent }) },
        { text: 'Exit', onPress: handleExitSurvey }
      ]
    );
  }, [navigation, surveyEvent, handleExitSurvey]);

  /**
   * Handle confirmed exit
   */
  const handleConfirmedExit = useCallback(() => {
    setShowExitConfirm(false);
    
    if (onSurveyAbandoned && surveyEvent) {
      onSurveyAbandoned(surveyEvent);
    }
    
    handleExitSurvey();
  }, [surveyEvent, onSurveyAbandoned, handleExitSurvey]);

  /**
   * Handle cancel exit
   */
  const handleCancelExit = useCallback(() => {
    setShowExitConfirm(false);
  }, []);

  const brandColor = themeProvider.getBrandPrimaryColor(surveyEvent?.brand || 'Other');

  return (
    <SafeAreaView style={styles.container}>
      {/* Survey Header */}
      <View style={[styles.header, { borderBottomColor: brandColor }]}>
        <View style={styles.headerContent}>
          <Text style={styles.eventTitle} numberOfLines={1}>
            {surveyEvent?.eventName || surveyEvent?.name || 'Survey'}
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
            event={surveyEvent}
            existingAnswers={mergedInitialAnswers}
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

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingFallback: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingFallbackText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666666',
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
});

export default SurveyScreen;
