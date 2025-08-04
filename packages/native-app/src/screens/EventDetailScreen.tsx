import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import type { ExpanseEvent, Brand } from '@expanse/shared/types';
import { themeProvider } from '../utils/theme-provider';
import { offlineDetector } from '../utils/offline-detector';

interface EventDetailScreenProps {
  event?: ExpanseEvent;
  loading?: boolean;
  onLaunchSurvey?: (event: ExpanseEvent) => void;
  onRefresh?: () => Promise<void>;
}

const EventDetailScreen: React.FC<EventDetailScreenProps> = ({
  event,
  loading = false,
  onLaunchSurvey,
  onRefresh,
}) => {
  // Accept the event as a prop (from the route component)
  const displayEvent = event;
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(offlineDetector.isOnline());

  useEffect(() => {
    // Subscribe to connectivity changes
    const unsubscribe = offlineDetector.addListener((networkState) => {
      setIsOnline(networkState.isConnected && networkState.isInternetReachable);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    // Set theme based on event brand
    if (displayEvent?.brand) {
      themeProvider.setTheme(displayEvent.brand);
    }
  }, [displayEvent?.brand]);

  const handleRefresh = async () => {
    if (onRefresh) {
      setRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
        Alert.alert('Error', 'Failed to refresh event details');
      } finally {
        setRefreshing(false);
      }
    }
  };

  const handleLaunchSurvey = () => {
    if (!displayEvent) return;

    // Survey now works offline with self-contained SPA architecture
    // No internet connection required

    if (onLaunchSurvey) {
      onLaunchSurvey(displayEvent);
    } else {
      // Default navigation behavior using Expo Router
      router.push(`/survey/${displayEvent.id}`);
    }
  };

  const getBrandColor = (brand?: Brand): string => {
    return themeProvider.getBrandPrimaryColor(brand || 'Other');
  };

  const getBrandSecondaryColor = (brand?: Brand): string => {
    return themeProvider.getBrandSecondaryColor(brand || 'Other');
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'No date set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString?: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const renderMetadataItem = (label: string, value: string | number | undefined, fallback = 'Not specified') => (
    <View style={styles.metadataItem}>
      <Text style={styles.metadataLabel}>{label}</Text>
      <Text style={styles.metadataValue}>{value || fallback}</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={getBrandColor(displayEvent?.brand)} />
          <Text style={styles.loadingText}>Loading event details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!displayEvent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Event Not Found</Text>
          <Text style={styles.errorText}>The requested event could not be loaded.</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const brandColor = getBrandColor(displayEvent.brand);
  const brandSecondaryColor = getBrandSecondaryColor(displayEvent.brand);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          onRefresh ? {
            refreshing,
            onRefresh: handleRefresh,
            colors: [brandColor],
            tintColor: brandColor,
          } as any : undefined
        }
      >
        {/* Event Header */}
        <View style={[styles.header, { backgroundColor: brandSecondaryColor }]}>
          <View style={[styles.brandBadge, { backgroundColor: brandColor }]}>
            <Text style={styles.brandBadgeText}>
              {(displayEvent.brand || 'Other').toUpperCase()}
            </Text>
          </View>
          
          <Text style={styles.eventTitle}>{displayEvent.eventName || 'Unnamed Event'}</Text>
          
          {displayEvent.description && (
            <Text style={styles.eventDescription}>{displayEvent.description}</Text>
          )}

          <View style={[styles.statusContainer, 
            displayEvent.isActive ? styles.activeStatus : styles.inactiveStatus
          ]}>
            <Text style={[styles.statusText,
              displayEvent.isActive ? styles.activeStatusText : styles.inactiveStatusText
            ]}>
              {displayEvent.isActive ? 'Active Event' : 'Inactive Event'}
            </Text>
          </View>
        </View>

        {/* Event Details */}
        <View style={styles.detailsContainer}>
          <Text style={styles.sectionTitle}>Event Details</Text>
          
          <View style={styles.detailsGrid}>
            {renderMetadataItem('Date', formatDate(displayEvent.eventDate))}
            {displayEvent.eventDate && renderMetadataItem('Time', formatTime(displayEvent.eventDate))}
            {renderMetadataItem('Location', displayEvent.location)}
            {renderMetadataItem('Survey', displayEvent.surveyName, 'Default Survey')}
            {renderMetadataItem('Expected Responses', displayEvent.expectedResponses)}
            {renderMetadataItem('Created', formatDate(displayEvent.createdAt))}
            {renderMetadataItem('Last Updated', formatDate(displayEvent.updatedAt))}
          </View>
        </View>

        {/* Survey Configuration */}
        {displayEvent.surveyJSON && (
          <View style={styles.detailsContainer}>
            <Text style={styles.sectionTitle}>Survey Configuration</Text>
            <View style={styles.configItem}>
              <Text style={styles.configLabel}>Survey Questions</Text>
              <Text style={styles.configValue}>
                {JSON.parse(displayEvent.surveyJSON).pages?.length || 0} pages configured
              </Text>
            </View>
          </View>
        )}

        {/* Additional Metadata */}
        <View style={styles.detailsContainer}>
          <Text style={styles.sectionTitle}>Additional Information</Text>
          <View style={styles.detailsGrid}>
            {renderMetadataItem('Event ID', displayEvent.id)}
            {renderMetadataItem('Brand', displayEvent.brand || 'Other')}
            {displayEvent.showHeader !== undefined && 
              renderMetadataItem('Header Enabled', displayEvent.showHeader ? 'Yes' : 'No')
            }
            {displayEvent.showLanguageChooser !== undefined && 
              renderMetadataItem('Language Chooser', displayEvent.showLanguageChooser ? 'Yes' : 'No')
            }
          </View>
        </View>

        {/* Connection Status */}
        <View style={styles.connectionStatus}>
          <Text style={[styles.connectionText, { color: isOnline ? '#28A745' : '#DC3545' }]}>
            {isOnline ? '🟢 Online - Ready for surveys' : '🔴 Offline - Limited functionality'}
          </Text>
        </View>
      </ScrollView>

      {/* Launch Survey Button */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={[
            styles.launchButton,
            { backgroundColor: brandColor },
            !displayEvent.isActive && styles.disabledButton,
          ]}
          onPress={handleLaunchSurvey}
          disabled={!displayEvent.isActive}
        >
          <Text style={styles.launchButtonText}>
            {!displayEvent.isActive 
              ? 'Event Inactive' 
              : 'Launch Survey'
            }
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 12,
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
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#0066CC',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  brandBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  brandBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  eventTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
    lineHeight: 34,
  },
  eventDescription: {
    fontSize: 16,
    color: '#495057',
    marginBottom: 16,
    lineHeight: 24,
  },
  statusContainer: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  activeStatus: {
    backgroundColor: '#D4EDDA',
  },
  inactiveStatus: {
    backgroundColor: '#F8D7DA',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  activeStatusText: {
    color: '#155724',
  },
  inactiveStatusText: {
    color: '#721C24',
  },
  detailsContainer: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    padding: 24,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E9ECEF',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  detailsGrid: {
    gap: 16,
  },
  metadataItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  metadataLabel: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '600',
    flex: 1,
    marginRight: 16,
  },
  metadataValue: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  configItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  configLabel: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '600',
  },
  configValue: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
  },
  connectionStatus: {
    padding: 16,
    alignItems: 'center',
  },
  connectionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  bottomActions: {
    padding: 24,
    paddingTop: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  launchButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#6C757D',
  },
  launchButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default EventDetailScreen;