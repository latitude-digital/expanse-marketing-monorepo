import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { createSyncManager, SyncProgress, SyncMetrics } from '../services/sync-manager';
import { DatabaseService } from '../services/database';
import { offlineDetector } from '../utils/offline-detector';
import { themeProvider } from '../utils/theme-provider';

export interface SyncStatusIndicatorProps {
  position?: 'top' | 'bottom';
  showManualSync?: boolean;
  onSyncComplete?: (metrics: SyncMetrics) => void;
  style?: object;
}

interface SyncState {
  pendingCount: number;
  isSyncing: boolean;
  isOnline: boolean;
  lastSync?: number;
  connectionType?: string;
}

const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  position = 'bottom',
  showManualSync = true,
  onSyncComplete,
  style,
}) => {
  const [syncState, setSyncState] = useState<SyncState>({
    pendingCount: 0,
    isSyncing: false,
    isOnline: false,
  });
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showSyncLogs, setShowSyncLogs] = useState(false);
  const [animatedValue] = useState(new Animated.Value(0));
  const [syncManager] = useState(() => createSyncManager(DatabaseService.createEncrypted()));

  useEffect(() => {
    const initializeSync = async () => {
      // Set up sync callbacks
      syncManager.setProgressCallback(setSyncProgress);
      syncManager.setCompletionCallback((metrics) => {
        setSyncProgress(null);
        if (onSyncComplete) {
          onSyncComplete(metrics);
        }
        updateSyncState();
      });

      // Initial state update
      await updateSyncState();

      // Start background sync
      syncManager.startBackgroundSync(300000); // 5 minutes
    };

    initializeSync();

    // Listen for connectivity changes
    const unsubscribeConnectivity = offlineDetector.addListener(async (networkState) => {
      await updateSyncState();
    });

    return () => {
      unsubscribeConnectivity();
      syncManager.destroy();
    };
  }, [syncManager, onSyncComplete]);

  useEffect(() => {
    // Animate indicator based on sync state
    const targetValue = syncState.pendingCount > 0 || syncState.isSyncing ? 1 : 0;
    
    Animated.timing(animatedValue, {
      toValue: targetValue,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [animatedValue, syncState.pendingCount, syncState.isSyncing]);

  const updateSyncState = useCallback(async () => {
    try {
      const status = await syncManager.getSyncStatus();
      const networkState = offlineDetector.getCurrentState();
      
      setSyncState({
        pendingCount: status.pendingCount,
        isSyncing: status.isSyncing,
        isOnline: networkState.isConnected && networkState.isInternetReachable,
        lastSync: status.lastSync,
        connectionType: networkState.type,
      });
    } catch (error) {
      console.error('Failed to update sync state:', error);
    }
  }, [syncManager]);

  const handleManualSync = useCallback(async () => {
    if (syncState.isSyncing) {
      return;
    }

    if (!syncState.isOnline) {
      Alert.alert(
        'No Internet Connection',
        'Sync requires an internet connection. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      await syncManager.startSync();
    } catch (error) {
      console.error('Manual sync failed:', error);
      Alert.alert(
        'Sync Error',
        'Failed to start sync process. Please try again.',
        [{ text: 'OK' }]
      );
    }
  }, [syncManager, syncState]);

  const handleClearQueue = useCallback(async () => {
    Alert.alert(
      'Clear Sync Queue',
      'This will remove all pending sync items. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await syncManager.clearSyncQueue();
              await updateSyncState();
            } catch (error) {
              console.error('Failed to clear sync queue:', error);
              Alert.alert('Error', 'Failed to clear sync queue');
            }
          },
        },
      ]
    );
  }, [syncManager, updateSyncState]);

  const getStatusColor = (): string => {
    if (!syncState.isOnline) return '#DC3545'; // Red for offline
    if (syncState.isSyncing) return '#FFC107'; // Yellow for syncing
    if (syncState.pendingCount > 0) return '#FF6B35'; // Orange for pending
    return '#28A745'; // Green for synced
  };

  const getStatusText = (): string => {
    if (!syncState.isOnline) return 'Offline';
    if (syncState.isSyncing) return 'Syncing...';
    if (syncState.pendingCount > 0) return `${syncState.pendingCount} pending`;
    return 'All synced';
  };

  const getStatusIcon = (): string => {
    if (!syncState.isOnline) return '🔴';
    if (syncState.isSyncing) return '🟡';
    if (syncState.pendingCount > 0) return '🟠';
    return '🟢';
  };

  const formatLastSync = (): string => {
    if (!syncState.lastSync) return 'Never';
    const diff = Date.now() - syncState.lastSync;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const renderSyncProgress = () => {
    if (!syncProgress) return null;

    const progressPercentage = syncProgress.total > 0 
      ? ((syncProgress.completed + syncProgress.failed) / syncProgress.total) * 100 
      : 0;

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${progressPercentage}%`,
                backgroundColor: getStatusColor(),
              }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {syncProgress.currentItem ? `Syncing ${syncProgress.currentItem}...` : 'Preparing...'}
        </Text>
        <Text style={styles.progressStats}>
          {syncProgress.completed}/{syncProgress.total} completed
          {syncProgress.failed > 0 && `, ${syncProgress.failed} failed`}
        </Text>
      </View>
    );
  };

  const renderDetailsModal = () => (
    <Modal
      visible={showDetails}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowDetails(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Sync Status</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowDetails(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.statusSection}>
              <Text style={styles.sectionTitle}>Current Status</Text>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Connection:</Text>
                <Text style={[styles.statusValue, { color: getStatusColor() }]}>
                  {syncState.isOnline ? `Online (${syncState.connectionType})` : 'Offline'}
                </Text>
              </View>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Pending Items:</Text>
                <Text style={styles.statusValue}>{syncState.pendingCount}</Text>
              </View>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Status:</Text>
                <Text style={[styles.statusValue, { color: getStatusColor() }]}>
                  {getStatusText()}
                </Text>
              </View>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Last Sync:</Text>
                <Text style={styles.statusValue}>{formatLastSync()}</Text>
              </View>
            </View>

            {syncProgress && (
              <View style={styles.statusSection}>
                <Text style={styles.sectionTitle}>Sync Progress</Text>
                {renderSyncProgress()}
              </View>
            )}

            <View style={styles.statusSection}>
              <Text style={styles.sectionTitle}>Actions</Text>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: themeProvider.getCurrentTheme().colors.primary },
                  (!syncState.isOnline || syncState.isSyncing) && styles.disabledButton,
                ]}
                onPress={handleManualSync}
                disabled={!syncState.isOnline || syncState.isSyncing}
              >
                <Text style={styles.actionButtonText}>
                  {syncState.isSyncing ? 'Syncing...' : 'Manual Sync'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton]}
                onPress={() => updateSyncState()}
              >
                <Text style={styles.secondaryButtonText}>Refresh Status</Text>
              </TouchableOpacity>

              {syncState.pendingCount > 0 && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.dangerButton]}
                  onPress={handleClearQueue}
                >
                  <Text style={styles.actionButtonText}>Clear Queue</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const indicatorStyle = [
    styles.container,
    position === 'top' ? styles.topPosition : styles.bottomPosition,
    style,
  ];

  return (
    <>
      <Animated.View style={[indicatorStyle, { opacity: animatedValue }]}>
        <TouchableOpacity
          style={[styles.indicator, { backgroundColor: getStatusColor() }]}
          onPress={() => setShowDetails(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.indicatorIcon}>{getStatusIcon()}</Text>
          <Text style={styles.indicatorText}>{getStatusText()}</Text>
          {syncProgress && (
            <View style={styles.miniProgressBar}>
              <View 
                style={[
                  styles.miniProgressFill,
                  { 
                    width: `${syncProgress.total > 0 
                      ? ((syncProgress.completed + syncProgress.failed) / syncProgress.total) * 100 
                      : 0}%`
                  }
                ]} 
              />
            </View>
          )}
        </TouchableOpacity>

        {showManualSync && syncState.pendingCount > 0 && !syncState.isSyncing && (
          <TouchableOpacity
            style={styles.syncButton}
            onPress={handleManualSync}
            disabled={!syncState.isOnline}
          >
            <Text style={styles.syncButtonText}>Sync</Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      {renderDetailsModal()}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1000,
  },
  topPosition: {
    top: 60,
  },
  bottomPosition: {
    bottom: 20,
  },
  indicator: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  indicatorIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  indicatorText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  miniProgressBar: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
  syncButton: {
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
  },
  syncButtonText: {
    color: '#333333',
    fontSize: 12,
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
    margin: 20,
    borderRadius: 12,
    maxHeight: '80%',
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666666',
  },
  modalBody: {
    padding: 20,
  },
  statusSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: '#666666',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E9ECEF',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 4,
  },
  progressStats: {
    fontSize: 12,
    color: '#666666',
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#DEE2E6',
  },
  secondaryButtonText: {
    color: '#495057',
    fontSize: 14,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: '#DC3545',
  },
  disabledButton: {
    backgroundColor: '#6C757D',
  },
});

export default SyncStatusIndicator;