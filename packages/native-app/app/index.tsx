import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, TouchableOpacity, Alert, Platform } from 'react-native';
import { useNavigation } from 'expo-router';
import EventListScreen from '../src/screens/EventListScreen';
import { useAuth } from '../src/contexts/AuthContext';
import { DatabaseService } from '../src/services/database';
import { EventCacheService, CachedMeridianEvent } from '../src/services/event-cache';
import { AssetCacheService } from '../src/services/asset-cache';
import { eventsService } from '../src/services/firestore';
import { offlineDetector } from '../src/utils/offline-detector';

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
  const [assetCache, setAssetCache] = useState<AssetCacheService | null>(null);

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

  const fetchAndCacheEvents = useCallback(async () => {
    if (!assetCache) {
      return [];
    }

    try {
      const firestoreEvents = await eventsService.getEvents();
      const processed: CachedMeridianEvent[] = [];

      for (const event of firestoreEvents) {
        try {
          const assetMap = await assetCache.prefetchAssetsForEvent(event);
          const eventWithAssets: CachedMeridianEvent = {
            ...event,
            assetMap,
          };
          await eventCache.cacheEvent(eventWithAssets);
          processed.push(eventWithAssets);
        } catch (eventError) {
          console.error('[EventList] Failed to cache assets for event:', event.id, eventError);
          const fallbackEvent: CachedMeridianEvent = {
            ...event,
          };
          await eventCache.cacheEvent(fallbackEvent);
          processed.push(fallbackEvent);
        }
      }

      return processed;
    } catch (error) {
      console.error('[EventList] Failed to fetch events from Firestore:', error);
      return [];
    }
  }, [assetCache, eventCache]);

  const loadEvents = useCallback(async () => {
    if (!dbReady || !assetCache) {
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
  }, [assetCache, dbReady, eventCache, fetchAndCacheEvents]);

  useEffect(() => {
    if (!dbReady || !assetCache) {
      return;
    }

    loadEvents();
  }, [dbReady, assetCache, loadEvents]);

  useEffect(() => {
    if (!dbReady || !assetCache) {
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
  }, [dbReady, assetCache, fetchAndCacheEvents]);

  const handleRefresh = useCallback(async () => {
    if (!dbReady || !assetCache) {
      Alert.alert('Not Ready', 'Please wait for the app to finish initializing.', [{ text: 'OK' }]);
      return;
    }

    if (!offlineDetector.isOnline()) {
      console.log('[EventList] Refresh requested while offline, using cached events');
      const cached = await eventCache.getCachedEvents();
      setEvents(cached);
      Alert.alert(
        'Offline Mode',
        `Loaded ${cached.length} cached event${cached.length !== 1 ? 's' : ''}.`,
        [{ text: 'OK' }]
      );
      return;
    }

    setLoading(true);
    try {
      const refreshed = await fetchAndCacheEvents();
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
      console.error('[EventList] Manual refresh failed:', error);
      Alert.alert(
        'Refresh Failed',
        'Unable to refresh events. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  }, [assetCache, dbReady, eventCache, fetchAndCacheEvents]);

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

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={handleRefresh}
          onLongPress={handleLongPressClearCache}
          disabled={loading}
          activeOpacity={0.6}
          style={{ marginLeft: 16 }}
          accessibilityRole="button"
          accessibilityHint="Tap to refresh events, long press to clear asset cache"
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
  }, [navigation, handleRefresh, handleLongPressClearCache, loading]);

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
