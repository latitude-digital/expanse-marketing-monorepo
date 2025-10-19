import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, TouchableOpacity, Alert, Modal } from 'react-native';
import { useNavigation } from 'expo-router';
import EventListScreen from '../src/screens/EventListScreen';
import { useAuth } from '../src/contexts/AuthContext';
import { DatabaseService } from '../src/services/database';
import { EventCacheService, CachedMeridianEvent } from '../src/services/event-cache';
// COMMENTED OUT - Asset caching disabled
// import { AssetCacheService } from '../src/services/asset-cache';
import { eventsService } from '../src/services/firestore';
import { offlineDetector } from '../src/utils/offline-detector';
import { getFirestore, waitForPendingWrites, enableNetwork, collection, onSnapshot, query, limit } from '@react-native-firebase/firestore';
import { createSyncManager } from '../src/services/sync-manager';
import * as Updates from 'expo-updates';

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

type RefreshStepKey = 'events' | 'sync' | 'updates';
type RefreshStepStatus = 'pending' | 'in_progress' | 'success' | 'error';

interface RefreshStepState {
  status: RefreshStepStatus;
  message?: string;
}

const createInitialRefreshSteps = (): Record<RefreshStepKey, RefreshStepState> => ({
  events: { status: 'pending' },
  sync: { status: 'pending' },
  updates: { status: 'pending' },
});

const refreshStepLabels: Record<RefreshStepKey, string> = {
  events: 'Refreshing events',
  sync: 'Syncing data',
  updates: 'Checking for updates',
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
  const [syncManager] = useState(() => createSyncManager(databaseService));
  const refreshInProgressRef = useRef(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshModalVisible, setRefreshModalVisible] = useState(false);
  const [refreshSteps, setRefreshSteps] = useState<Record<RefreshStepKey, RefreshStepState>>(
    () => createInitialRefreshSteps()
  );
  const [pendingReload, setPendingReload] = useState(false);

  const setStepStatus = useCallback(
    (step: RefreshStepKey, status: RefreshStepStatus, message?: string) => {
      setRefreshSteps((prev) => ({
        ...prev,
        [step]: { status, message },
      }));
    },
    []
  );

  const getStatusColor = useCallback((status: RefreshStepStatus) => {
    switch (status) {
      case 'success':
        return '#2E7D32';
      case 'error':
        return '#C62828';
      case 'in_progress':
        return '#F9A825';
      default:
        return '#9CA3AF';
    }
  }, []);

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

  const runRefreshFlow = useCallback(async () => {
    if (!dbReady) {
      Alert.alert('Not Ready', 'Please wait for the app to finish initializing.', [{ text: 'OK' }]);
      return;
    }

    if (refreshInProgressRef.current) {
      setRefreshModalVisible(true);
      return;
    }

    refreshInProgressRef.current = true;
    setRefreshing(true);
    setRefreshSteps(createInitialRefreshSteps());
    setRefreshModalVisible(true);
    setPendingReload(false);

    const runEventsStep = async () => {
      let unsubscribe: (() => void) | undefined;
      try {
        setStepStatus('events', 'in_progress', 'Preparing to refresh events...');
        const db = getFirestore();

        if (!offlineDetector.isOnline()) {
          const cached = await eventCache.getCachedEvents();
          setEvents(cached);
          setStepStatus(
            'events',
            'success',
            `Offline: showing ${cached.length} cached event${cached.length === 1 ? '' : 's'}.`
          );
          return;
        }

        try {
          await enableNetwork(db);
        } catch (error) {
          console.warn('[EventList] ⚠️ Error enabling Firestore network (may already be enabled):', error);
        }

        let connectedToServer = false;
        unsubscribe = onSnapshot(
          query(collection(db, 'events'), limit(1)),
          { includeMetadataChanges: true },
          (snapshot) => {
            if (!snapshot.metadata.fromCache) {
              connectedToServer = true;
              setStepStatus('events', 'in_progress', 'Connected to Firestore. Refreshing events...');
            }
          },
          (error) => {
            console.error('[EventList] ❌ Firestore metadata listener error:', error);
          }
        );

        try {
          await Promise.race([
            waitForPendingWrites(db),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 15000)),
          ]);
        } catch (error: any) {
          if (error?.message === 'timeout') {
            setStepStatus('events', 'in_progress', 'Pending writes still syncing...');
          } else {
            setStepStatus('events', 'in_progress', 'Continuing refresh despite sync warning.');
          }
        }

        const refreshed = await fetchAndCacheEvents();
        if (refreshed.length) {
          setEvents(refreshed);
        }

        setStepStatus(
          'events',
          'success',
          connectedToServer
            ? 'Events refreshed from Firestore.'
            : 'Events refreshed (using latest cached data).'
        );
      } catch (error) {
        console.error('[EventList] ❌ Refresh events failed:', error);
        setStepStatus(
          'events',
          'error',
          error instanceof Error ? error.message : 'Unexpected error refreshing events.'
        );
      } finally {
        if (unsubscribe) {
          unsubscribe();
        }
      }
    };

    const runSyncStep = async () => {
      setStepStatus('sync', 'in_progress', 'Checking for pending responses...');
      try {
        const operations = await databaseService.getOperations();
        const pendingCount = await operations.getPendingSyncItemCount();

        if (pendingCount === 0) {
          setStepStatus('sync', 'success', 'No pending responses to sync.');
          return;
        }

        setStepStatus(
          'sync',
          'in_progress',
          `Syncing ${pendingCount} pending response${pendingCount === 1 ? '' : 's'}...`
        );

        await syncManager.startSync();

        const remaining = await operations.getPendingSyncItemCount();
        if (remaining === 0) {
          setStepStatus('sync', 'success', 'All responses synced.');
        } else {
          setStepStatus(
            'sync',
            'error',
            `${remaining} response${remaining === 1 ? '' : 's'} still pending after sync.`
          );
        }
      } catch (error) {
        console.error('[EventList] ❌ Sync step failed:', error);
        setStepStatus(
          'sync',
          'error',
          error instanceof Error ? error.message : 'Unexpected error while syncing.'
        );
      }
    };

    const runUpdatesStep = async () => {
      setStepStatus('updates', 'in_progress', 'Checking for app updates...');
      try {
        const updateResult = await Updates.checkForUpdateAsync();
        if (!updateResult.isAvailable) {
          setStepStatus('updates', 'success', 'App is up to date.');
          return;
        }

        setStepStatus('updates', 'in_progress', 'Downloading update...');
        await Updates.fetchUpdateAsync();
        setPendingReload(true);
        setStepStatus('updates', 'success', 'Update downloaded. Restart to apply.');
      } catch (error: any) {
        console.error('[EventList] ❌ Update step failed:', error);
        let message = error instanceof Error ? error.message : 'Unexpected error while checking for updates.';
        if (error?.code === 'ERR_UPDATES_DISABLED') {
          message = 'Updates disabled for this build.';
        }
        setStepStatus('updates', 'error', message);
      }
    };

    try {
      await runEventsStep();
      await runSyncStep();
      await runUpdatesStep();
    } finally {
      setRefreshing(false);
      refreshInProgressRef.current = false;
    }
  }, [dbReady, eventCache, fetchAndCacheEvents, setStepStatus, databaseService, syncManager]);

  const handleRefresh = useCallback(async () => {
    await runRefreshFlow();
  }, [runRefreshFlow]);

  const allStepsComplete = Object.values(refreshSteps).every(
    (step) => step.status === 'success' || step.status === 'error'
  );

  const handleRefreshModalClose = useCallback(async () => {
    if (refreshInProgressRef.current) {
      return;
    }

    setRefreshModalVisible(false);
    setRefreshSteps(createInitialRefreshSteps());

    if (pendingReload) {
      try {
        await Updates.reloadAsync();
      } catch (error) {
        console.error('[EventList] ❌ Failed to apply update:', error);
      } finally {
        setPendingReload(false);
      }
    }
  }, [pendingReload]);

  const renderRefreshModal = () => (
    <Modal
      transparent
      animationType="fade"
      visible={refreshModalVisible}
      onRequestClose={handleRefreshModalClose}
    >
      <View style={styles.refreshModalBackdrop}>
        <View style={styles.refreshModalContainer}>
          <Text style={styles.refreshModalTitle}>Refresh Status</Text>
          {(Object.keys(refreshStepLabels) as RefreshStepKey[]).map((key) => {
            const step = refreshSteps[key];
            const showSpinner = step.status === 'in_progress';

            return (
              <View key={key} style={styles.refreshStatusRow}>
                <View style={[styles.refreshStatusIndicator, { backgroundColor: getStatusColor(step.status) }]} />
                <View style={styles.refreshStatusTextContainer}>
                  <Text style={styles.refreshStatusLabel}>{refreshStepLabels[key]}</Text>
                  {step.message ? (
                    <Text style={styles.refreshStatusMessage}>{step.message}</Text>
                  ) : null}
                  {showSpinner ? (
                    <ActivityIndicator
                      size="small"
                      color="#257180"
                      style={styles.refreshStatusSpinner}
                    />
                  ) : null}
                </View>
              </View>
            );
          })}

          <View style={styles.refreshModalFooter}>
            <TouchableOpacity
              style={[
                styles.refreshModalButton,
                (!allStepsComplete || refreshInProgressRef.current) && styles.refreshModalButtonDisabled,
              ]}
              disabled={!allStepsComplete || refreshInProgressRef.current}
              onPress={handleRefreshModalClose}
            >
              <Text style={styles.refreshModalButtonText}>
                {pendingReload ? 'Restart' : 'OK'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

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
          onPress={runRefreshFlow}
          // COMMENTED OUT - Asset caching disabled
          // onLongPress={handleLongPressClearCache}
          disabled={loading}
          activeOpacity={0.6}
          accessibilityRole="button"
          // COMMENTED OUT - Asset caching disabled
          // accessibilityHint="Tap to refresh events, long press to clear asset cache"
          accessibilityHint="Tap to refresh"
        >
          <Text
            style={[
              styles.headerRefreshText,
              loading && styles.headerRefreshTextDisabled,
            ]}
          >
            Refresh
          </Text>
        </TouchableOpacity>
      ),
      headerLeftContainerStyle: {
        paddingLeft: 0,
      },
    });
  }, [navigation, runRefreshFlow, loading]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#257180" />
        <Text style={styles.loadingText}>Loading Meridian Events...</Text>
      </View>
    );
  }

  return (
    <>
      <EventListScreen
        events={events}
        loading={loading}
        currentUser={currentUser ?? undefined}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />
      {renderRefreshModal()}
    </>
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
  refreshModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  refreshModalContainer: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  refreshModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  refreshStatusRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  refreshStatusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    marginRight: 12,
  },
  refreshStatusTextContainer: {
    flex: 1,
  },
  refreshStatusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  refreshStatusMessage: {
    marginTop: 4,
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  refreshStatusSpinner: {
    marginTop: 8,
  },
  refreshModalFooter: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  refreshModalButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#257180',
  },
  refreshModalButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  refreshModalButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 15,
  },
});
