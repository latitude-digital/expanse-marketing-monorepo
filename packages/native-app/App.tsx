import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';

// Screens
import EventListScreen from './src/screens/EventListScreen';
import SurveyScreen from './src/screens/SurveyScreen';

// Components
import SyncStatusIndicator from './src/components/SyncStatusIndicator';

// Services
import { DatabaseService } from './src/services/database';
import { EventCacheService } from './src/services/event-cache';
import { createSyncManager, SyncMetrics } from './src/services/sync-manager';

// Utils
import { themeProvider } from './src/utils/theme-provider';
import { offlineDetector } from './src/utils/offline-detector';

// Types
import type { MeridianEvent as ExpanseEvent } from '@meridian-event-tech/shared/types';
import type { SurveyCompletionData } from './src/components/SurveyWebView';
import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

// Get environment from app config
const appEnv = Constants.expoConfig?.extra?.EXPO_PUBLIC_APP_ENV || 'development';
const sentryDsn = Constants.expoConfig?.extra?.EXPO_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: sentryDsn || 'https://0e402abb7a52a273ef643deea1148e4c@o4506238718967808.ingest.us.sentry.io/4510212003463168',

  // Set environment to separate staging and production
  environment: appEnv,

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay - different sample rates for staging vs production
  replaysSessionSampleRate: appEnv === 'production' ? 0.1 : 0.5,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration()],

  // Enable debug mode in development and staging
  debug: appEnv !== 'production',

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

export type RootStackParamList = {
  EventList: undefined;
  EventDetail: { event: ExpanseEvent };
  Survey: { event: ExpanseEvent };
};

const Stack = createStackNavigator<RootStackParamList>();

export default Sentry.wrap(function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [events, setEvents] = useState<ExpanseEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [dbService] = useState(() => DatabaseService.createEncrypted());
  const [eventCache] = useState(() => new EventCacheService(dbService));
  const [syncManager] = useState(() => createSyncManager(dbService));

  useEffect(() => {
    initializeApp();
  }, []);

  /**
   * Initialize the application
   */
  const initializeApp = async () => {
    try {
      // Initialize database
      await dbService.initialize();
      
      // Check if database is properly set up
      const isDbReady = await dbService.isInitialized();
      if (!isDbReady) {
        throw new Error('Database initialization failed');
      }

      // Load cached events
      await loadEvents();

      // Set up connectivity monitoring
      offlineDetector.addListener(async (networkState) => {
        if (networkState.isConnected && networkState.isInternetReachable) {
          // Connection restored, refresh events if cache is stale
          const isExpired = await eventCache.isCacheExpired();
          if (isExpired) {
            await loadEvents();
          }
        }
      });

      setIsInitialized(true);
    } catch (error) {
      console.error('App initialization failed:', error);
      // Could show error screen here, but for now just set initialized to allow basic functionality
      setIsInitialized(true);
    }
  };

  /**
   * Load events from cache or API
   */
  const loadEvents = async () => {
    setLoading(true);
    try {
      // First, load from cache for immediate display
      const cachedEvents = await eventCache.getCachedEvents();
      setEvents(cachedEvents);

      // If online and cache is expired, fetch fresh data
      if (offlineDetector.isOnline()) {
        const isExpired = await eventCache.isCacheExpired();
        if (isExpired || cachedEvents.length === 0) {
          await refreshEventsFromAPI();
        }
      }
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refresh events from API and update cache
   */
  const refreshEventsFromAPI = async () => {
    try {
      // This would typically fetch from your API
      // For now, we'll simulate with mock data
      const mockEvents: ExpanseEvent[] = [
        {
          id: 'ford-event-1',
          name: 'Ford F-150 Lightning Experience',
          brand: 'Ford',
          startDate: new Date(),
          endDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          questions: { pages: [] },
          theme: { cssVariables: {} },
        },
        {
          id: 'lincoln-event-1',
          name: 'Lincoln Aviator Luxury Test Drive',
          brand: 'Lincoln',
          startDate: new Date(Date.now() + 86400000), // Tomorrow
          endDate: new Date(Date.now() + 2 * 86400000), // Day after tomorrow
          questions: { pages: [] },
          theme: { cssVariables: {} },
        },
        {
          id: 'other-event-1',
          name: 'General Automotive Survey',
          brand: 'Other',
          startDate: new Date(Date.now() - 86400000), // Yesterday
          endDate: new Date(Date.now() - 43200000), // 12 hours ago
          questions: { pages: [] },
          theme: { cssVariables: {} },
        },
      ];

      // Cache the events
      for (const event of mockEvents) {
        await eventCache.cacheEvent(event);
      }

      setEvents(mockEvents);
    } catch (error) {
      console.error('Failed to refresh events from API:', error);
      throw error;
    }
  };

  /**
   * Handle survey completion
   */
  const handleSurveyComplete = async (data: SurveyCompletionData) => {
    try {
      // Find the event
      const event = events.find(e => e.id === data.eventId);
      if (!event) {
        console.error('Event not found for survey completion:', data.eventId);
        return;
      }

      // Queue for sync
      await syncManager.queueSurveyResponse(data.responses, event);
    } catch (error) {
      console.error('Failed to handle survey completion:', error);
    }
  };

  /**
   * Handle sync completion
   */
  const handleSyncComplete = (metrics: SyncMetrics) => {
    console.log('Sync completed:', metrics);
    // Could show a toast notification here
  };

  /**
   * Handle survey abandonment (for analytics)
   */
  const handleSurveyAbandoned = (event: ExpanseEvent) => {
    console.log('Survey abandoned for event:', event.id);
    // Could track analytics here
  };

  if (!isInitialized) {
    return (
      <SafeAreaProvider>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#257180" />
          <Text style={styles.loadingText}>Initializing Meridian Events...</Text>
        </View>
        <StatusBar style="auto" />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="EventList"
          screenOptions={{
            headerStyle: {
              backgroundColor: themeProvider.getCurrentTheme().colors.primary,
            },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen 
            name="EventList" 
            options={{ 
              title: 'Survey Events',
              headerShown: true,
            }}
          >
            {(props: any) => (
              <EventListScreen
                {...props}
                events={events}
                loading={loading}
                onRefresh={loadEvents}
              />
            )}
          </Stack.Screen>
          
          <Stack.Screen 
            name="Survey" 
            options={{
              title: 'Survey',
              headerShown: false, // Survey screen manages its own header
              gestureEnabled: false, // Prevent swipe back during survey
            }}
          >
            {(props: any) => (
              <SurveyScreen
                {...props}
                onSurveyComplete={handleSurveyComplete}
                onSurveyAbandoned={handleSurveyAbandoned}
              />
            )}
          </Stack.Screen>
        </Stack.Navigator>

        {/* Sync Status Indicator */}
        <SyncStatusIndicator
          position="bottom"
          showManualSync={true}
          onSyncComplete={handleSyncComplete}
        />
      </NavigationContainer>
      
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
});

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 16,
  },
});