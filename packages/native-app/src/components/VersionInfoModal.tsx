import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, Pressable, ScrollView, Platform, Switch } from 'react-native';
import * as Application from 'expo-application';
import * as Updates from 'expo-updates';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { disableNetwork, enableNetwork, getFirestore } from '@react-native-firebase/firestore';
import { useEventSync } from '../contexts/EventSyncContext';

interface VersionInfoModalProps {
  visible: boolean;
  onClose: () => void;
}

export const VersionInfoModal: React.FC<VersionInfoModalProps> = ({ visible, onClose }) => {
  const appVersion = Application.nativeApplicationVersion;
  const buildNumber = Application.nativeBuildVersion;
  const easUpdateId = Updates.updateId;
  const easChannel = Updates.channel;
  const runtimeVersion = Updates.runtimeVersion;

  // Sync state from context
  const { isOnline, pendingWriteCount } = useEventSync();

  // Manual offline mode toggle
  const [offlineMode, setOfflineMode] = useState(false);

  // Load offline mode preference on mount
  useEffect(() => {
    AsyncStorage.getItem('manualOfflineMode').then(value => {
      setOfflineMode(value === 'true');
    });
  }, []);

  // Handle offline mode toggle
  const handleToggleOfflineMode = async (enabled: boolean) => {
    try {
      const db = getFirestore();

      if (enabled) {
        await disableNetwork(db);
        console.log('[VersionInfo] 📵 Manual offline mode enabled');
      } else {
        await enableNetwork(db);
        console.log('[VersionInfo] 📶 Manual offline mode disabled');
      }

      await AsyncStorage.setItem('manualOfflineMode', String(enabled));
      setOfflineMode(enabled);
    } catch (error) {
      console.error('[VersionInfo] ❌ Error toggling offline mode:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.modal} onStartShouldSetResponder={() => true}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Version Information</Text>
          </View>

          <ScrollView style={styles.content}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>App Version</Text>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Version:</Text>
                <Text style={styles.value}>{appVersion}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Build:</Text>
                <Text style={styles.value}>{buildNumber}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>EAS Update</Text>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Update ID:</Text>
                <Text style={[styles.value, styles.monospace]} numberOfLines={2}>
                  {easUpdateId}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Channel:</Text>
                <Text style={styles.value}>{easChannel}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Runtime Version:</Text>
                <Text style={styles.value}>{runtimeVersion}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Network & Sync</Text>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Manual Offline Mode:</Text>
                <Switch
                  value={offlineMode}
                  onValueChange={handleToggleOfflineMode}
                  trackColor={{ false: '#E9ECEF', true: '#257180' }}
                  thumbColor={offlineMode ? '#FFFFFF' : '#FFFFFF'}
                  ios_backgroundColor="#E9ECEF"
                />
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Connection Status:</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: isOnline ? '#28A745' : '#FFC107',
                    marginRight: 6,
                  }} />
                  <Text style={styles.value}>{isOnline ? 'Online' : 'Offline'}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Pending Writes:</Text>
                <Text style={[
                  styles.value,
                  pendingWriteCount > 0 && { color: '#FFC107', fontWeight: '600' }
                ]}>
                  {pendingWriteCount}
                </Text>
              </View>

              {pendingWriteCount > 0 && (
                <View style={{
                  marginTop: 8,
                  padding: 8,
                  backgroundColor: '#FFF3CD',
                  borderRadius: 6
                }}>
                  <Text style={{ fontSize: 12, color: '#856404' }}>
                    {pendingWriteCount} survey{pendingWriteCount === 1 ? '' : 's'} waiting to sync
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.divider} />

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Platform</Text>
              <View style={styles.infoRow}>
                <Text style={styles.label}>OS:</Text>
                <Text style={styles.value}>{Platform.OS === 'ios' ? 'iOS' : 'Android'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>OS Version:</Text>
                <Text style={styles.value}>{Platform.Version}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Bundle ID:</Text>
                <Text style={[styles.value, styles.monospace]}>
                  {Application.applicationId || 'Unknown'}
                </Text>
              </View>
            </View>
          </ScrollView>

          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    alignItems: 'flex-start',
  },
  label: {
    fontSize: 14,
    color: '#6C757D',
    fontWeight: '500',
    flex: 1,
  },
  value: {
    fontSize: 14,
    color: '#333333',
    flex: 2,
    textAlign: 'right',
  },
  monospace: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#E9ECEF',
    marginVertical: 16,
  },
  closeButton: {
    backgroundColor: '#257180',
    paddingVertical: 14,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
