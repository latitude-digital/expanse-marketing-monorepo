import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useNavigation } from 'expo-router';
import EventListScreen from '../src/screens/EventListScreen';
import { useAuth } from '../src/contexts/AuthContext';
import { DatabaseService } from '../src/services/database';
import { EventCacheService, CachedMeridianEvent } from '../src/services/event-cache';
import { AssetCacheService } from '../src/services/asset-cache';
import { eventsService } from '../src/services/firestore';
import { offlineDetector } from '../src/utils/offline-detector';

export default function EventListPage() {
  const navigation = useNavigation();
  const { currentUser } = useAuth();

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

    AssetCacheService.getInstance()
      .then((service) => {
        if (isMounted) {
          setAssetCache(service);
        }
      })
      .catch((error) => {
        console.error('[EventList] Asset cache initialization failed:', error);
      });

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
      return;
    }

    if (!offlineDetector.isOnline()) {
      console.log('[EventList] Refresh requested while offline, using cached events');
      const cached = await eventCache.getCachedEvents();
      setEvents(cached);
      return;
    }

    setLoading(true);
    try {
      const refreshed = await fetchAndCacheEvents();
      if (refreshed.length) {
        setEvents(refreshed);
      } else {
        const cached = await eventCache.getCachedEvents();
        setEvents(cached);
      }
    } catch (error) {
      console.error('[EventList] Manual refresh failed:', error);
    } finally {
      setLoading(false);
    }
  }, [assetCache, dbReady, eventCache, fetchAndCacheEvents]);

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={handleRefresh}
          style={[
            styles.headerRefreshButton,
            loading && styles.headerRefreshButtonDisabled,
          ]}
          disabled={loading}
          accessibilityRole="button"
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
  headerRefreshButton: {
    marginLeft: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#257180',
  },
  headerRefreshButtonDisabled: {
    borderColor: '#9EB1B7',
  },
  headerRefreshText: {
    color: '#257180',
    fontSize: 14,
    fontWeight: '600',
  },
  headerRefreshTextDisabled: {
    color: '#9EB1B7',
  },
});
