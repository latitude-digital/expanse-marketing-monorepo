import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, TouchableOpacity, Alert, Platform } from 'react-native';
import { useNavigation } from 'expo-router';
import EventListScreen from '../src/screens/EventListScreen';
import { useAuth } from '../src/contexts/AuthContext';
import { DatabaseService } from '../src/services/database';
import { EventCacheService, CachedMeridianEvent } from '../src/services/event-cache';
// COMMENTED OUT - Asset caching disabled
// import { AssetCacheService } from '../src/services/asset-cache';
import { eventsService } from '../src/services/firestore';
import { offlineDetector } from '../src/utils/offline-detector';
import { getFirestore, waitForPendingWrites } from '@react-native-firebase/firestore';

// DEBUG: Expose offline toggle to global for testing
(global as any).toggleOfflineMode = (forceOffline?: boolean) => {
  offlineDetector.debugForceOffline = forceOffline ?? !offlineDetector.debugForceOffline;
  console.log(
    offlineDetector.debugForceOffline
      ? '🔴 [DEBUG] Offline mode ENABLED - app will behave as if offline'
      : '🟢 [DEBUG] Offline mode DISABLED - app will use real network'
  );
  return offlineDetector.debugForceOffline;
};

export default function EventListPage() {
  const navigation = useNavigation();
  const { currentUser } = useAuth();

  // DEBUG: Log offline mode helper on mount
  useEffect(() => {
    console.log('💡 [DEBUG] To test offline mode, open debugger and run: toggleOfflineMode()');
  }, []);

  const [events, setEvents] = useState<CachedMeridianEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbReady, setDbReady] = useState(false);
  // COMMENTED OUT - Asset caching disabled
  // const [assetCache, setAssetCache] = useState<AssetCacheService | null>(null);

  const [databaseService] = useState(() => DatabaseService.createEncrypted());
  const [eventCache] = useState(() => new EventCacheService(databaseService));

  useEffect(() => {
    let isMounted = true;

    const initDatabase = async () => {
      try {
        await databaseService.initialize();
        const ready = await databaseService.isInitialized();
        if (isMounted) {
          setDbReady(ready);
        }
      } catch (error) {
        console.error('[EventList] Database initialization failed:', error);
        if (isMounted) {
          setDbReady(false);
        }
      }
    };

    initDatabase();

    return () => {
      isMounted = false;
    };
  }, [databaseService]);

  // COMMENTED OUT - Asset caching disabled
  /*
  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const MAX_RETRIES = 20;
    const RETRY_DELAY = 1000; // ms

    const initAssetCache = async () => {
      while (isMounted && retryCount < MAX_RETRIES) {
        try {
          const service = await AssetCacheService.getInstance();
          if (isMounted) {
            console.log('[EventList] ✅ Asset cache initialized successfully');
            setAssetCache(service);
          }
          return;
        } catch (error: any) {
          retryCount++;
          if (error?.message?.includes('FileSystem directories unavailable')) {
            // FileSystem not ready yet, retry after delay
            console.log(`[EventList] ⏳ FileSystem not ready, retrying (${retryCount}/${MAX_RETRIES})...`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          } else {
            // Different error, don't retry
            console.error('[EventList] ❌ Asset cache initialization failed:', error);
            return;
          }
        }
      }

      if (isMounted && retryCount >= MAX_RETRIES) {
        console.error('[EventList] ❌ Asset cache initialization failed after', MAX_RETRIES, 'retries');
      }
    };

    initAssetCache();

    return () => {
      isMounted = false;
    };
  }, []);
  */

  const fetchAndCacheEvents = useCallback(async () => {
    // COMMENTED OUT - Asset caching disabled
    /*
    if (!assetCache) {
      return [];
    }
    */

    try {
      console.log('[EventList] 🔥 Fetching events from Firestore...');
      const firestoreEvents = await eventsService.getEvents();
      console.log(`[EventList] 📥 Received ${firestoreEvents.length} events from Firestore`);

      // Log first event's surveyJSModel from Firestore
      if (firestoreEvents.length > 0) {
        const firstEvent = firestoreEvents[0];
        console.log(`[EventList] 🔥 Firestore event ${firstEvent.id} surveyJSModel type:`, firstEvent.surveyJSModel ? typeof firstEvent.surveyJSModel : 'undefined');
        if (firstEvent.surveyJSModel) {
          const model = typeof firstEvent.surveyJSModel === 'string'
            ? JSON.parse(firstEvent.surveyJSModel)
            : firstEvent.surveyJSModel;

          // Look for panel and log address field
          const panel = model.pages?.[0]?.elements?.find((el: any) => el.type === 'panel');
          if (panel?.elements) {
            const addressField = panel.elements.find((el: any) =>
              el.name === 'address_group' || el.type?.includes('address')
            );
            if (addressField) {
              console.log(`[EventList] 🔥 FIRESTORE ADDRESS FIELD:`, JSON.stringify({
                type: addressField.type,
                name: addressField.name,
                _ffs: addressField._ffs
              }));
            }
          }
        }
      }

      const processed: CachedMeridianEvent[] = [];

      for (const event of firestoreEvents) {
        try {
          // COMMENTED OUT - Asset caching disabled
          /*
          const assetMap = await assetCache.prefetchAssetsForEvent(event);
          const eventWithAssets: CachedMeridianEvent = {
            ...event,
            assetMap,
          };
          await eventCache.cacheEvent(eventWithAssets);
          processed.push(eventWithAssets);
          */
          const eventWithoutAssets: CachedMeridianEvent = {
            ...event,
          };
          await eventCache.cacheEvent(eventWithoutAssets);
          processed.push(eventWithoutAssets);
        } catch (eventError) {
          console.error('[EventList] ❌ Failed to cache event:', event.id, eventError);
          const fallbackEvent: CachedMeridianEvent = {
            ...event,
          };
          await eventCache.cacheEvent(fallbackEvent);
          processed.push(fallbackEvent);
        }
      }

      console.log(`[EventList] ✅ Processed and cached ${processed.length} events`);
      return processed;
    } catch (error) {
      console.error('[EventList] ❌ Failed to fetch events from Firestore:', error);
      return [];
    }
  }, [eventCache]);

  const loadEvents = useCallback(async () => {
    // COMMENTED OUT - Asset caching disabled
    // if (!dbReady || !assetCache) {
    if (!dbReady) {
      return;
    }

    setLoading(true);

    try {
      const cachedEvents = await eventCache.getCachedEvents();
      if (cachedEvents.length) {
        setEvents(cachedEvents);
      }

      if (offlineDetector.isOnline()) {
        const refreshed = await fetchAndCacheEvents();
        if (refreshed.length) {
          setEvents(refreshed);
        }
      }
    } catch (error) {
      console.error('[EventList] Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  }, [dbReady, eventCache, fetchAndCacheEvents]);

  useEffect(() => {
    // COMMENTED OUT - Asset caching disabled
    // if (!dbReady || !assetCache) {
    if (!dbReady) {
      return;
    }

    loadEvents();
  }, [dbReady, loadEvents]);

  useEffect(() => {
    // COMMENTED OUT - Asset caching disabled
    // if (!dbReady || !assetCache) {
    if (!dbReady) {
      return;
    }

    const unsubscribe = offlineDetector.addListener((networkState) => {
      if (networkState.isConnected && networkState.isInternetReachable) {
        fetchAndCacheEvents()
          .then((refreshed) => {
            if (refreshed.length) {
              setEvents(refreshed);
            }
          })
          .catch((error) => {
            console.error('[EventList] Auto-refresh failed:', error);
          });
      }
    });

    return unsubscribe;
  }, [dbReady, fetchAndCacheEvents]);

  const handleRefresh = useCallback(async () => {
    console.log('[EventList] 🔄 Refresh Events button pressed');
    // COMMENTED OUT - Asset caching disabled
    // if (!dbReady || !assetCache) {
    if (!dbReady) {
      console.log('[EventList] ❌ Database not ready');
      Alert.alert('Not Ready', 'Please wait for the app to finish initializing.', [{ text: 'OK' }]);
      return;
    }

    if (!offlineDetector.isOnline()) {
      console.log('[EventList] ⚠️ Refresh requested while offline, using cached events');
      const cached = await eventCache.getCachedEvents();
      setEvents(cached);
      Alert.alert(
        'Offline Mode',
        `Loaded ${cached.length} cached event${cached.length !== 1 ? 's' : ''}.`,
        [{ text: 'OK' }]
      );
      return;
    }

    console.log('[EventList] 🌐 Online - fetching events from Firestore');
    setLoading(true);
    try {
      // Wait for all pending writes before refreshing
      console.log('[EventList] ⏳ Waiting for pending writes to sync...');
      try {
        const db = getFirestore();
        await Promise.race([
          waitForPendingWrites(db),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
        ]);
        console.log('[EventList] ✅ All pending writes synced successfully');
      } catch (error: any) {
        if (error.message === 'timeout') {
          console.log('[EventList] ⚠️ Timeout waiting for pending writes (5s), continuing with refresh anyway');
        } else {
          console.error('[EventList] ❌ Error waiting for pending writes:', error);
        }
      }

      const refreshed = await fetchAndCacheEvents();
      console.log(`[EventList] ✅ Fetched ${refreshed.length} events from Firestore`);

      if (refreshed.length > 0) {
        // Log first event's surveyJSModel to verify what we got from Firestore
        const firstEvent = refreshed[0];
        console.log(`[EventList] 📊 First event (${firstEvent.id}) surveyJSModel type:`, firstEvent.surveyJSModel ? typeof firstEvent.surveyJSModel : 'undefined');
        if (firstEvent.surveyJSModel) {
          const model = typeof firstEvent.surveyJSModel === 'string'
            ? JSON.parse(firstEvent.surveyJSModel)
            : firstEvent.surveyJSModel;
          console.log('[EventList] 📋 First event surveyJSModel pages:', JSON.stringify(model.pages?.[0]?.elements?.slice(0, 3)));
        }
      }

      if (refreshed.length) {
        setEvents(refreshed);
        Alert.alert(
          'Events Refreshed',
          `Successfully loaded ${refreshed.length} event${refreshed.length !== 1 ? 's' : ''}.`,
          [{ text: 'OK' }]
        );
      } else {
        const cached = await eventCache.getCachedEvents();
        setEvents(cached);
        Alert.alert(
          'Refresh Complete',
          `No new events found. Showing ${cached.length} cached event${cached.length !== 1 ? 's' : ''}.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('[EventList] ❌ Manual refresh failed:', error);
      Alert.alert(
        'Refresh Failed',
        'Unable to refresh events. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  }, [dbReady, eventCache, fetchAndCacheEvents]);

  // COMMENTED OUT - Asset caching disabled
  /*
  const handleLongPressClearCache = useCallback(async () => {
    console.log('[EventList] 🔔 Long press detected on Refresh Events button');

    if (!assetCache) {
      console.log('[EventList] ⚠️ Asset cache not initialized yet');
      return;
    }

    try {
      const stats = await assetCache.getCacheStats();
      const sizeInMB = (stats.totalSize / (1024 * 1024)).toFixed(2);

      Alert.alert(
        'Clear Asset Cache',
        `Clear all cached assets?\n\n${stats.assetCount} assets cached (${sizeInMB} MB)\n\nThis will delete all downloaded fonts, images, and other assets. They will be re-downloaded when needed.`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Clear Cache',
            style: 'destructive',
            onPress: async () => {
              try {
                await assetCache.clearCache();
                Alert.alert(
                  'Cache Cleared',
                  `Successfully cleared ${stats.assetCount} cached assets.`,
                  [{ text: 'OK' }]
                );
              } catch (error) {
                console.error('[EventList] Failed to clear cache:', error);
                Alert.alert(
                  'Error',
                  'Failed to clear cache. Please try again.',
                  [{ text: 'OK' }]
                );
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('[EventList] Failed to get cache stats:', error);
      Alert.alert(
        'Error',
        'Failed to retrieve cache information.',
        [{ text: 'OK' }]
      );
    }
  }, [assetCache]);
  */

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={handleRefresh}
          // COMMENTED OUT - Asset caching disabled
          // onLongPress={handleLongPressClearCache}
          disabled={loading}
          activeOpacity={0.6}
          accessibilityRole="button"
          // COMMENTED OUT - Asset caching disabled
          // accessibilityHint="Tap to refresh events, long press to clear asset cache"
          accessibilityHint="Tap to refresh events"
        >
          <Text
            style={[
              styles.headerRefreshText,
              loading && styles.headerRefreshTextDisabled,
            ]}
          >
            Refresh Events
          </Text>
        </TouchableOpacity>
      ),
      headerLeftContainerStyle: {
        paddingLeft: 0,
      },
    });
  }, [navigation, handleRefresh, loading]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#257180" />
        <Text style={styles.loadingText}>Loading Meridian Events...</Text>
      </View>
    );
  }

  return (
    <EventListScreen
      events={events}
      loading={loading}
      currentUser={currentUser ?? undefined}
      onRefresh={handleRefresh}
    />
  );
}

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
  headerRefreshText: {
    color: '#007AFF', // iOS system blue
    fontSize: 17, // iOS standard navigation button size
    fontWeight: '400', // iOS standard weight for nav buttons
    textAlign: 'center', // Center text within pill
  },
  headerRefreshTextDisabled: {
    color: '#8E8E93', // iOS system gray
  },
});
