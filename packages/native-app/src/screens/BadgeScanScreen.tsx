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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import { Audio } from 'expo-av';
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
  const [isCameraAvailable, setIsCameraAvailable] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualValue, setManualValue] = useState('0');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [autoFocusMode, setAutoFocusMode] = useState<'on' | 'off'>('off');
  const cameraRef = useRef<CameraView | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const focusBounds = useRef<{ width: number; height: number }>({ width: 0, height: 0 });
  const scanAnimation = useRef(new Animated.Value(0)).current;

  const isPermissionDenied = cameraPermission?.status === 'denied';

  const badgeVendorLabel = useMemo(() => badgeScanConfig?.vendor ?? 'Badge Scan', [badgeScanConfig?.vendor]);

  useEffect(() => {
    let mounted = true;

    const checkCameraAvailability = async () => {
      try {
        const available = await CameraView.isAvailableAsync();
        if (mounted) {
          setIsCameraAvailable(available);
        }
      } catch (error) {
        console.warn('[BadgeScanScreen] Unable to determine camera availability', error);
        if (mounted) {
          setIsCameraAvailable(false);
        }
      }
    };

    checkCameraAvailability();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadSound = async () => {
      try {
        const sound = new Audio.Sound();
        await sound.loadAsync(require('../assets/sounds/scan-success.wav'));
        if (mounted) {
          soundRef.current = sound;
        } else {
          await sound.unloadAsync();
        }
      } catch (error) {
        console.warn('[BadgeScanScreen] Failed to load scan success sound', error);
      }
    };

    loadSound();

    return () => {
      mounted = false;
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  useEffect(() => {
    if (!cameraPermission) {
      requestCameraPermission().catch((error) => {
        console.warn('[BadgeScanScreen] Failed to request camera permission', error);
      });
    }
  }, [cameraPermission, requestCameraPermission]);

  const playSuccessFeedback = useCallback(async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.replayAsync();
      }
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
  }, [scanAnimation]);

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

      try {
        setIsProcessing(true);
        await playSuccessFeedback();

        // Check if this badge has already completed a survey in Firestore
        console.log('[BadgeScanScreen] Checking if badge has already completed a survey:', value);

        try {
          const existingSurvey = await surveysService.checkBadgeAlreadyScanned(value, event.id);

          if (existingSurvey) {
            console.log('[BadgeScanScreen] Badge has already completed a survey for this event');
            console.log('[BadgeScanScreen] Existing survey path:', existingSurvey.path);
            setIsProcessing(false);
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
        } catch (firestoreError) {
          console.warn('[BadgeScanScreen] Error checking Firestore for existing survey (offline?):', firestoreError);
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

        console.log('[BadgeScanScreen] Proceeding to survey...');
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
        console.warn('[BadgeScanScreen] Error handling scan result', error);
        setErrorMessage('Unable to process scan result. Please try again.');
        setIsProcessing(false);
      }
    },
    [goToSurvey, playSuccessFeedback, event, router]
  );

  const handleBarcodeScanned = useCallback(
    ({ data }: { data: string }) => {
      if (isProcessing) {
        return;
      }
      handleScanValue(data);
    },
    [handleScanValue, isProcessing]
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

  const renderPermissionPrompt = () => (
    <View style={styles.permissionContainer}>
      <Text style={styles.permissionTitle}>Camera Access Needed</Text>
      <Text style={styles.permissionText}>
        We need camera access to scan attendee badges. Please enable camera permissions in settings.
      </Text>
      <TouchableOpacity
        style={styles.permissionButton}
        onPress={() => requestCameraPermission()}
        testID="grant-permission-button"
      >
        <Text style={styles.permissionButtonText}>Grant Permission</Text>
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
        <Text style={styles.headerTitle}>{badgeVendorLabel}</Text>
        <TouchableOpacity
          onPress={() => goToSurvey()}
          style={styles.headerButton}
          accessibilityLabel="Skip scanning and open survey"
          testID="skip-to-survey-button"
        >
          <Text style={styles.headerButtonText}>Survey</Text>
        </TouchableOpacity>
      </View>

      {errorMessage && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      {isCameraAvailable === false ? (
        renderManualEntry()
      ) : (
        <View style={styles.cameraContainer}>
          {!cameraPermission || !cameraPermission.granted ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.loaderText}>Requesting camera permission...</Text>
            </View>
          ) : (
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing={cameraType}
              enableTorch={flashMode === 'torch'}
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
              onBarcodeScanned={handleBarcodeScanned}
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
                <View style={styles.overlaySide} />
                <View style={styles.overlayCenter}>
                  <View style={styles.overlaySpacer} />
                  <View style={styles.reticle}>
                    <Animated.View
                      style={[
                        styles.reticleHighlight,
                        {
                          opacity: scanAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 0.5],
                          }),
                        },
                      ]}
                    />
                    <Text style={styles.reticleText}>Align QR code within frame</Text>
                  </View>
                  <View style={styles.overlaySpacer} />
                </View>
                <View style={styles.overlaySide} />
              </View>
            </CameraView>
          )}

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
      )}
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
    justifyContent: 'space-between',
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
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
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
    flexDirection: 'row',
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  overlayCenter: {
    flex: 3,
    flexDirection: 'column',
  },
  overlaySpacer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  reticle: {
    flex: 2,
    borderWidth: 2,
    borderColor: '#00B4D8',
    marginHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  reticleText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  reticleHighlight: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#00B4D8',
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
