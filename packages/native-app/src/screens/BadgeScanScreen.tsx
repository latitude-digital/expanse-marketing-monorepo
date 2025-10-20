import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import { useAudioPlayer } from 'expo-audio';
import LottieView from 'lottie-react-native';
import * as Device from 'expo-device';
import type { MeridianEvent } from '@meridian-event-tech/shared/types';
import { surveysService, activationsService } from '../services/firestore';

interface BadgeScanScreenProps {
  event: MeridianEvent;
}

const SCAN_ANIMATION_DURATION = 250;

export const BadgeScanScreen: React.FC<BadgeScanScreenProps> = ({ event }) => {
  const router = useRouter();
  const badgeScanConfig = event.customConfig?.badgeScan;
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [cameraType, setCameraType] = useState<CameraType>('back');
  const [flashMode, setFlashMode] = useState<'off' | 'torch'>('off');
  const [shouldUseManualEntry, setShouldUseManualEntry] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualValue, setManualValue] = useState('0');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [autoFocusMode, setAutoFocusMode] = useState<'on' | 'off'>('off');
  const cameraRef = useRef<CameraView | null>(null);
  const audioPlayer = useAudioPlayer(require('../assets/sounds/scan-success.wav'));
  const focusBounds = useRef<{ width: number; height: number }>({ width: 0, height: 0 });
  const scanAnimation = useRef(new Animated.Value(0)).current;

  // Track last scanned barcode to prevent duplicate processing
  // Camera fires onBarcodeScanned continuously (~30-60fps) while barcode is visible
  // This ref provides synchronous debouncing without React closure issues
  const lastScanRef = useRef<{
    value: string | null;
    timestamp: number;
  }>({ value: null, timestamp: 0 });

  const SCAN_COOLDOWN_MS = 2000; // 2 seconds before allowing same barcode again

  const isPermissionDenied = cameraPermission?.status === 'denied';

  const badgeVendorLabel = useMemo(() => badgeScanConfig?.vendor ?? 'Badge Scan', [badgeScanConfig?.vendor]);

  useEffect(() => {
    let mounted = true;

    const checkCameraAvailability = async () => {
      try {
        // Force manual entry on simulators
        const isSimulator = !Device.isDevice;
        console.log('[BadgeScanScreen] 🔍 Is simulator:', isSimulator);

        if (isSimulator) {
          console.log('[BadgeScanScreen] 📱 Running on simulator - using manual entry mode');
          if (mounted) {
            setShouldUseManualEntry(true);
          }
          return;
        }

        const available = await CameraView.isAvailableAsync();
        console.log('[BadgeScanScreen] 📷 Camera availability check:', available);
        if (mounted) {
          // Use manual entry if camera is NOT available
          setShouldUseManualEntry(!available);
        }
      } catch (error) {
        console.warn('[BadgeScanScreen] ❌ Unable to determine camera availability', error);
        if (mounted) {
          // On error, assume camera IS available, so don't use manual entry
          setShouldUseManualEntry(false);
        }
      }
    };

    checkCameraAvailability();

    return () => {
      mounted = false;
    };
  }, []);


  useEffect(() => {
    console.log('[BadgeScanScreen] 🔐 Camera permission status:', cameraPermission?.status);
    console.log('[BadgeScanScreen] 🔐 Camera permission granted:', cameraPermission?.granted);

    if (!cameraPermission) {
      console.log('[BadgeScanScreen] 🔐 Requesting camera permission...');
      requestCameraPermission().catch((error) => {
        console.warn('[BadgeScanScreen] ❌ Failed to request camera permission', error);
      });
    }
  }, [cameraPermission, requestCameraPermission]);

  const playSuccessFeedback = useCallback(async () => {
    try {
      audioPlayer.replay();
    } catch (error) {
      console.warn('[BadgeScanScreen] Unable to play scan success sound', error);
    }

    Animated.sequence([
      Animated.timing(scanAnimation, {
        toValue: 1,
        duration: SCAN_ANIMATION_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(scanAnimation, {
        toValue: 0,
        duration: SCAN_ANIMATION_DURATION,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scanAnimation, audioPlayer]);

  const goToSurvey = useCallback(
    (options?: {
      scanValue?: string;
      scanTime?: string;
      preFillData?: string;
      originalActivationPath?: string;
    }) => {
      router.replace({
        pathname: `/survey/[id]`,
        params: {
          id: event.id,
          eventData: JSON.stringify(event),
          ...(options?.scanValue ? { scanValue: options.scanValue } : {}),
          ...(options?.scanTime ? { scanTime: options.scanTime } : {}),
          ...(options?.preFillData ? { preFillData: options.preFillData } : {}),
          ...(options?.originalActivationPath ? { originalActivationPath: options.originalActivationPath } : {}),
        },
      });
    },
    [event, router]
  );

  const handleScanValue = useCallback(
    async (value: string) => {
      if (!value) {
        return;
      }

      // Set processing state for UI feedback (also disables camera callback)
      setIsProcessing(true);

      try {
        await playSuccessFeedback();

        // Check if this badge has already completed a survey in Firestore
        console.log('[BadgeScanScreen] 🔍 Checking Firestore for existing survey with badge:', value);

        try {
          const existingSurvey = await surveysService.checkBadgeAlreadyScanned(value, event.id);

          if (existingSurvey) {
            console.log('[BadgeScanScreen] ⚠️  DUPLICATE DETECTED - Badge has already completed a survey for this event');
            console.log('[BadgeScanScreen] 📄 Existing survey path:', existingSurvey.path);
            console.log('[BadgeScanScreen] 🚨 Showing duplicate alert and will navigate back on dismiss');
            // Show alert and navigate back (no need to reset processing - we're leaving the screen)
            Alert.alert(
              'Survey Already Completed',
              'This badge has already completed a survey for this event.',
              [
                {
                  text: 'OK',
                  onPress: () => {
                    router.dismissTo(`/event/${event.id}`);
                  },
                },
              ]
            );
            return;
          }

          console.log('[BadgeScanScreen] ✅ No existing survey found, proceeding with new survey');
        } catch (firestoreError) {
          console.warn('[BadgeScanScreen] ⚠️  Error checking Firestore for existing survey (offline?):', firestoreError);
          console.log('[BadgeScanScreen] 📴 Continuing anyway - duplicates will be handled on sync');
          // Continue anyway when offline - we'll handle duplicates on sync
        }

        // NEW: Check for activation surveys
        let preFillData = null;
        let originalActivationPath = null;

        // Log event activation configuration
        console.log('[ACTIVATIONS] Event:', event.name);
        console.log('[ACTIVATIONS] Has activations configured:', !!(event.customConfig?.activations && event.customConfig.activations.length > 0));
        if (event.customConfig?.activations && event.customConfig.activations.length > 0) {
          console.log('[ACTIVATIONS] Number of activation event IDs:', event.customConfig.activations.length);
          console.log('[ACTIVATIONS] Activation event IDs being queried:', JSON.stringify(event.customConfig.activations));
        }

        if (event.customConfig?.activations && event.customConfig.activations.length > 0) {
          console.log('[ACTIVATIONS] Checking activation events for badge value:', value);

          try {
            const activationResult = await activationsService.findOriginalActivationSurvey(
              value,
              event.customConfig.activations
            );

            if (activationResult) {
              console.log('[ACTIVATIONS] ✅ Found activation survey!');
              console.log('[ACTIVATIONS] Original activation path:', activationResult.path);
              console.log('[ACTIVATIONS] Event ID it came from:', activationResult.path.split('/')[1]);
              console.log('[ACTIVATIONS] Number of answers in pre-fill data:', Object.keys(activationResult.data || {}).length);
              console.log('[ACTIVATIONS] Pre-fill data keys:', JSON.stringify(Object.keys(activationResult.data || {})));
              preFillData = activationResult.data;
              originalActivationPath = activationResult.path;
            } else {
              console.log('[ACTIVATIONS] ❌ No activation survey found for badge value:', value);
              console.log('[ACTIVATIONS] Proceeding as new survey without pre-fill data');
            }
          } catch (error) {
            console.error('[ACTIVATIONS] ⚠️ Error checking activation surveys');
            console.error('[ACTIVATIONS] Error type:', error instanceof Error ? error.name : typeof error);
            console.error('[ACTIVATIONS] Error message:', error instanceof Error ? error.message : String(error));
            console.error('[ACTIVATIONS] Full error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
            // Continue as normal survey on error
          }
        } else {
          console.log('[ACTIVATIONS] No activation events configured for this event, skipping activation check');
        }

        console.log('[BadgeScanScreen] 🎯 All checks passed, proceeding to survey...');
        const timestamp = new Date().toISOString();

        setTimeout(() => {
          goToSurvey({
            scanValue: value,
            scanTime: timestamp,
            preFillData: preFillData ? JSON.stringify(preFillData) : undefined,
            originalActivationPath: originalActivationPath || undefined
          });
        }, SCAN_ANIMATION_DURATION);
      } catch (error) {
        console.error('[BadgeScanScreen] ❌ ERROR in handleScanValue:', error);
        setErrorMessage('Unable to process scan result. Please try again.');
        // Reset processing state so user can try again
        console.log('[BadgeScanScreen] 🔓 Resetting isProcessing=false (user can retry)');
        setIsProcessing(false);
        // Reset last scan so same barcode can be retried
        console.log('[BadgeScanScreen] 🔄 Resetting lastScanRef (user can retry same barcode)');
        lastScanRef.current = { value: null, timestamp: 0 };
      }
    },
    [goToSurvey, playSuccessFeedback, event, router]
  );

  const handleBarcodeScanned = useCallback(
    ({ data }: { data: string }) => {
      const now = Date.now();
      const timeSinceLastScan = now - lastScanRef.current.timestamp;

      // Prevent duplicate processing:
      // 1. Same barcode within cooldown period → ignore
      // 2. Different barcode → always process (user switching badges)
      if (lastScanRef.current.value === data && timeSinceLastScan < SCAN_COOLDOWN_MS) {
        return;
      }

      // Update last scan IMMEDIATELY (synchronous, no closure issues)
      lastScanRef.current = { value: data, timestamp: now };

      handleScanValue(data);
    },
    [handleScanValue]
  );

  const handleTapToFocus = useCallback(() => {
    setAutoFocusMode('on');
    setTimeout(() => setAutoFocusMode('off'), 300);
  }, []);

  const toggleFlash = useCallback(() => {
    setFlashMode((prev) => (prev === 'off' ? 'torch' : 'off'));
  }, []);

  const toggleCamera = useCallback(() => {
    setCameraType((prev) => (prev === 'back' ? 'front' : 'back'));
  }, []);

  const handleOpenSettings = useCallback(async () => {
    if (Platform.OS === 'ios') {
      await Linking.openURL('app-settings:');
    } else {
      await Linking.openSettings();
    }
  }, []);

  const renderPermissionPrompt = () => (
    <View style={styles.permissionContainer}>
      <Text style={styles.permissionTitle}>Camera Access Needed</Text>
      <Text style={styles.permissionText}>
        We need camera access to scan QR codes and driver's licenses. Please enable camera permissions in Settings.
      </Text>
      <TouchableOpacity
        style={styles.permissionButton}
        onPress={handleOpenSettings}
        testID="open-settings-button"
      >
        <Text style={styles.permissionButtonText}>Open Settings</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.permissionButton, { marginTop: 12, backgroundColor: '#666' }]}
        onPress={() => router.back()}
        testID="cancel-permission-button"
      >
        <Text style={styles.permissionButtonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );

  const renderMissingConfig = () => (
    <View style={styles.permissionContainer}>
      <Text style={styles.permissionTitle}>Badge Scanning Not Configured</Text>
      <Text style={styles.permissionText}>
        This event does not have badge scanning configured. You can continue directly to the survey.
      </Text>
      <TouchableOpacity
        style={styles.permissionButton}
        onPress={() => goToSurvey()}
        testID="open-survey-button"
      >
        <Text style={styles.permissionButtonText}>Open Survey</Text>
      </TouchableOpacity>
    </View>
  );

  const renderManualEntry = () => (
    <View style={styles.manualEntryContainer}>
      <Text style={styles.manualEntryTitle}>Simulator Mode</Text>
      <Text style={styles.manualEntrySubtitle}>Enter a badge value manually.</Text>
      <TextInput
        style={styles.manualInput}
        value={manualValue}
        onChangeText={setManualValue}
        placeholder="Enter badge value"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="default"
        testID="manual-badge-input"
      />
      <TouchableOpacity
        style={[styles.permissionButton, { marginTop: 12 }]}
        onPress={() => handleScanValue(manualValue.trim())}
        disabled={!manualValue || isProcessing}
        testID="use-value-button"
      >
        <Text style={styles.permissionButtonText}>Use Value</Text>
      </TouchableOpacity>
    </View>
  );

  if (!badgeScanConfig) {
    return (
      <SafeAreaView style={styles.container}>
        {renderMissingConfig()}
      </SafeAreaView>
    );
  }

  if (cameraPermission && isPermissionDenied) {
    return (
      <SafeAreaView style={styles.container}>
        {renderPermissionPrompt()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerButton}
          accessibilityLabel="Cancel scanning"
          testID="cancel-button"
        >
          <Text style={styles.headerButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      {errorMessage && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      {(() => {
        console.log('[BadgeScanScreen] 🎬 Render decision - shouldUseManualEntry:', shouldUseManualEntry);
        console.log('[BadgeScanScreen] 🎬 Render decision - cameraPermission:', cameraPermission?.status);
        console.log('[BadgeScanScreen] 🎬 Render decision - granted:', cameraPermission?.granted);

        if (shouldUseManualEntry === true) {
          console.log('[BadgeScanScreen] 🎬 Rendering: Manual Entry');
          return renderManualEntry();
        }

        return (
          <View style={styles.cameraContainer}>
            {!cameraPermission || !cameraPermission.granted ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#FFFFFF" />
                <Text style={styles.loaderText}>Requesting camera permission...</Text>
              </View>
            ) : (() => {
              console.log('[BadgeScanScreen] 🎬 Rendering: Camera View');
              return (
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing={cameraType}
              enableTorch={flashMode === 'torch'}
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
              onBarcodeScanned={isProcessing ? undefined : handleBarcodeScanned}
              onTouchEnd={handleTapToFocus}
              autofocus={autoFocusMode}
              onLayout={(event) => {
                focusBounds.current = {
                  width: event.nativeEvent.layout.width,
                  height: event.nativeEvent.layout.height,
                };
              }}
            >
              <View style={styles.overlay}>
                <View style={styles.squareReticleContainer}>
                  <LottieView
                    source={require('../../assets/animations/square-loading.lottie')}
                    autoPlay
                    loop
                    style={styles.squareReticle}
                  />
                </View>
              </View>
            </CameraView>
              );
            })()}

          <View style={styles.controls}>
            <TouchableOpacity
              style={[styles.controlButton, flashMode === 'torch' && styles.controlButtonActive]}
              onPress={toggleFlash}
              accessibilityLabel="Toggle flash"
              testID="toggle-flash-button"
            >
              <Text style={styles.controlButtonText}>{flashMode === 'torch' ? 'Flash Off' : 'Flash On'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={toggleCamera}
              accessibilityLabel="Switch camera"
              testID="flip-camera-button"
            >
              <Text style={styles.controlButtonText}>Flip Camera</Text>
            </TouchableOpacity>
            {isProcessing && (
              <View style={styles.processingIndicator}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.processingText}>Processing...</Text>
              </View>
            )}
          </View>
        </View>
        );
      })()}
    </SafeAreaView>
  );
};

export default BadgeScanScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#000000',
  },
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  headerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  squareReticleContainer: {
    width: Math.min(Dimensions.get('window').width * 0.7, 300),
    aspectRatio: 1, // Makes it square
    justifyContent: 'center',
    alignItems: 'center',
  },
  squareReticle: {
    width: '100%',
    height: '100%',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#000000',
  },
  controlButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#00B4D8',
  },
  controlButtonActive: {
    backgroundColor: '#00B4D8',
  },
  controlButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loaderText: {
    color: '#FFFFFF',
    marginTop: 12,
    fontSize: 14,
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#000000',
  },
  permissionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    color: '#CCCCCC',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 20,
  },
  permissionButton: {
    marginTop: 20,
    backgroundColor: '#00B4D8',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#000000',
    fontWeight: '700',
    fontSize: 15,
  },
  manualEntryContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  manualEntryTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  manualEntrySubtitle: {
    color: '#CCCCCC',
    fontSize: 14,
    marginBottom: 16,
  },
  manualInput: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  errorBanner: {
    backgroundColor: '#B00020',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  errorText: {
    color: '#FFFFFF',
    textAlign: 'center',
  },
  processingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  processingText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
});
