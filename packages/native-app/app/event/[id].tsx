import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { MeridianEvent as ExpanseEvent } from '@meridian-event-tech/shared/types';
import { DatabaseService } from '../../src/services/database';
import { EventCacheService } from '../../src/services/event-cache';
import { useEventSync } from '../../src/contexts/EventSyncContext';
import Icon from '../../src/components/Icon';
import { useDebounceNavigation } from '../../src/hooks/useDebounceNavigation';

// Create singleton instances for event cache
const databaseService = DatabaseService.createEncrypted();
const eventCacheService = new EventCacheService(databaseService);
let dbInitialized = false;

export default function EventSplashScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { navigate } = useDebounceNavigation();
  const { setCurrentEvent, clearCurrentEvent } = useEventSync();

  const [event, setEvent] = useState<ExpanseEvent | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize database and load event from cache
  useEffect(() => {
    let mounted = true;

    const loadEvent = async () => {
      console.log('[EventSplashScreen] Loading event, id:', id);
      try {
        // Initialize database if not already done
        if (!dbInitialized) {
          console.log('[EventSplashScreen] Initializing database...');
          await databaseService.initialize();
          dbInitialized = true;
          console.log('[EventSplashScreen] Database initialized');
        }

        // Load event from cache using event ID
        const cachedEvents = await eventCacheService.getCachedEvents();
        console.log(`[EventSplashScreen] Got ${cachedEvents.length} cached events`);
        const foundEvent = cachedEvents.find((e) => e.id === id);

        if (mounted && foundEvent) {
          console.log('[EventSplashScreen] Loaded event from cache:', id);
          setEvent(foundEvent);
        } else {
          console.log('[EventSplashScreen] Event not found in cache');
        }
      } catch (error) {
        console.warn('[EventSplashScreen] Failed to load event from cache:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadEvent();

    return () => {
      mounted = false;
    };
  }, [id]);

  // Set current event in EventSyncContext when event loads
  useEffect(() => {
    if (event && id) {
      console.log('[EventSplashScreen] 🎯 Setting current event in EventSyncContext:', id);
      setCurrentEvent(id, event);
    }

    return () => {
      console.log('[EventSplashScreen] 🧹 Clearing current event from EventSyncContext');
      clearCurrentEvent();
    };
  }, [event, id, setCurrentEvent, clearCurrentEvent]);

  const handleBack = () => {
    router.replace('/');
  };

  const getBrandColor = (brand?: string): string => {
    switch (brand?.toLowerCase()) {
      case 'ford':
        return '#257180';
      case 'lincoln':
        return '#8B1538';
      default:
        return '#333333';
    }
  };

  // Determine which buttons to show based on event configuration
  const getEventCapabilities = () => {
    if (!event) {
      return { hasBadgeScanning: false, hasCheckIn: false, hasCheckOut: false };
    }

    // Debug: Log the full event object to understand its structure
    console.log('[EventSplashScreen] 🔍 Event ID:', event.id);
    console.log('[EventSplashScreen] 🔍 Event name:', event.name);
    console.log('[EventSplashScreen] 🔍 customConfig:', JSON.stringify(event.customConfig, null, 2));
    console.log('[EventSplashScreen] 🔍 preRegDate:', event.preRegDate);
    console.log('[EventSplashScreen] 🔍 surveyType:', event.surveyType);
    console.log('[EventSplashScreen] 🔍 _preEventID:', event._preEventID);

    // Check if event has badge scanning enabled
    // badgeScan is an object with vendor/config, not a boolean
    const hasBadgeScanning = !!event.customConfig?.badgeScan;

    // Check if event has check-in enabled
    // Per EventListScreen logic: check-in is enabled if preRegDate exists OR surveyType is 'preTD'
    const hasCheckIn = !!(event.preRegDate || event.surveyType === 'preTD');

    // Check if event has check-out enabled
    // Per EventListScreen logic: check-out is enabled if _preEventID exists
    const hasCheckOut = !!event._preEventID;

    console.log('[EventSplashScreen] ✅ Capabilities:');
    console.log('[EventSplashScreen]    - hasBadgeScanning:', hasBadgeScanning);
    console.log('[EventSplashScreen]    - hasCheckIn:', hasCheckIn);
    console.log('[EventSplashScreen]    - hasCheckOut:', hasCheckOut);

    return { hasBadgeScanning, hasCheckIn, hasCheckOut };
  };

  const capabilities = getEventCapabilities();

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#257180" />
          <Text style={styles.loadingText}>Loading event...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Event Not Found</Text>
          <Text style={styles.errorText}>
            We could not load details for this event. Please return to the event list and try
            again.
          </Text>
          <Pressable style={styles.backButton} onPress={handleBack}>
            <Icon name="right-from-bracket" size={16} color="#FFFFFF" />
            <Text style={styles.backButtonText}>Back to Events</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.eventTitle}>{event.name || 'Unnamed Event'}</Text>
        </View>

        {/* Main Action Buttons */}
        <View style={styles.buttonsContainer}>
          {/* Badge scanning events: Show "Scan Badge" and "Survey Without Badge" */}
          {capabilities.hasBadgeScanning && (
            <>
              <Pressable
                style={[styles.mainButton, styles.scanButton]}
                onPress={() => navigate({
                  pathname: '/scan/[id]',
                  params: {
                    id: event.id,
                    eventData: JSON.stringify(event),
                  },
                })}
                testID="scan-badge-button"
                accessible={true}
                accessibilityLabel="Scan Badge"
                accessibilityRole="button"
              >
                <Icon name="qrcode-read" size={48} color="#FFFFFF" />
                <Text style={styles.mainButtonText}>Scan Badge</Text>
              </Pressable>

              <Pressable
                style={[styles.mainButton, styles.surveyButton]}
                onPress={() => navigate({
                  pathname: '/survey/[id]',
                  params: {
                    id: event.id,
                    eventData: JSON.stringify(event),
                  },
                })}
                testID="survey-without-badge-button"
                accessible={true}
                accessibilityLabel="Survey Without Badge"
                accessibilityRole="button"
              >
                <Icon name="clipboard-list-check" size={48} color="#FFFFFF" />
                <Text style={styles.mainButtonText}>Survey Without Badge</Text>
              </Pressable>
            </>
          )}

          {/* Check-in events: Show "Check In" button */}
          {capabilities.hasCheckIn && (
            <Pressable
              style={[styles.mainButton, styles.checkInButton]}
              onPress={() => {
                // TODO: Implement check-in flow
                console.log('[EventSplashScreen] Check-in button pressed - not yet implemented');
              }}
              testID="check-in-button"
              accessible={true}
              accessibilityLabel="Check In"
              accessibilityRole="button"
            >
              <Icon name="door-open" size={48} color="#FFFFFF" />
              <Text style={styles.mainButtonText}>Check In</Text>
            </Pressable>
          )}

          {/* Check-out events: Show "Check Out" button */}
          {capabilities.hasCheckOut && (
            <Pressable
              style={[styles.mainButton, styles.checkOutButton]}
              onPress={() => {
                // TODO: Implement check-out flow
                console.log('[EventSplashScreen] Check-out button pressed - not yet implemented');
              }}
              testID="check-out-button"
              accessible={true}
              accessibilityLabel="Check Out"
              accessibilityRole="button"
            >
              <Icon name="door-closed" size={48} color="#FFFFFF" />
              <Text style={styles.mainButtonText}>Check Out</Text>
            </Pressable>
          )}

          {/* Plain survey events (no badge scanning, check-in, or check-out): Show "Begin Survey" */}
          {!capabilities.hasBadgeScanning && !capabilities.hasCheckIn && !capabilities.hasCheckOut && (
            <Pressable
              style={[styles.mainButton, styles.surveyButton]}
              onPress={() => navigate({
                pathname: '/survey/[id]',
                params: {
                  id: event.id,
                  eventData: JSON.stringify(event),
                },
              })}
              testID="begin-survey-button"
              accessible={true}
              accessibilityLabel="Begin Survey"
              accessibilityRole="button"
            >
              <Icon name="clipboard-list-check" size={48} color="#FFFFFF" />
              <Text style={styles.mainButtonText}>Begin Survey</Text>
            </Pressable>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2E5BF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
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
    lineHeight: 24,
    marginBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  eventTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 12,
  },
  eventBrand: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  buttonsContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 24,
  },
  mainButton: {
    backgroundColor: '#257180',
    paddingVertical: 40,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  scanButton: {
    backgroundColor: '#0A8754',
  },
  surveyButton: {
    backgroundColor: '#257180',
  },
  checkInButton: {
    backgroundColor: '#0A8754', // Green for check-in
  },
  checkOutButton: {
    backgroundColor: '#DC3545', // Red for check-out
  },
  mainButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
  exitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#257180',
    gap: 8,
  },
  exitButtonText: {
    color: '#257180',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#257180',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
