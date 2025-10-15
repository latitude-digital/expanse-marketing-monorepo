import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Linking,
  TextInput,
  Dimensions,
  ScaledSize,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import type { MeridianEvent as ExpanseEvent, Brand } from '@meridian-event-tech/shared/types';
import Icon from '../components/Icon';

export type EventFilter = 'today' | 'upcoming' | 'past' | 'all';

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  isAdmin?: boolean;
  tags?: string[];
}

interface EventListScreenProps {
  events?: ExpanseEvent[];
  loading?: boolean;
  currentUser?: User;
  onRefresh?: () => Promise<void>;
  onEventPress?: (event: ExpanseEvent) => void;
}

const EventListScreen: React.FC<EventListScreenProps> = ({
  events = [],
  loading = false,
  currentUser,
  onRefresh,
  onEventPress,
}) => {
  // Using Expo Router instead of React Navigation
  const [filter, setFilter] = useState<EventFilter>('today');
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [screenData, setScreenData] = useState(Dimensions.get('window'));

  useEffect(() => {
    const onChange = ({ window }: { window: ScaledSize; screen: ScaledSize }) => {
      setScreenData(window);
    };
    const subscription = Dimensions.addEventListener('change', onChange);
    return () => subscription?.remove();
  }, []);

  // Consider iPad if width >= 768px (typical iPad breakpoint)
  const isTablet = screenData.width >= 768;

  const handleRefresh = useCallback(async () => {
    if (onRefresh) {
      setRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
      }
    }
  }, [onRefresh]);

  const filterEvents = useCallback((events: ExpanseEvent[], filter: EventFilter, searchTerm: string): ExpanseEvent[] => {
    const now = new Date();
    const nowTime = now.getTime();

    // First filter by search term
    let searchFilteredEvents = events;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      searchFilteredEvents = events.filter(event => 
        event.name?.toLowerCase().includes(searchLower) ||
        event.brand?.toLowerCase().includes(searchLower) ||
        event.tags?.some((tag: string) => tag.toLowerCase().includes(searchLower))
      );
    }

    // Then filter by user permissions
    let userFilteredEvents = searchFilteredEvents;
    if (currentUser && !currentUser.isAdmin) {
      // Non-admin users only see events with matching tags
      userFilteredEvents = searchFilteredEvents.filter(event => {
        if (!event.tags || !currentUser.tags) return false;
        return event.tags.some((tag: string) => currentUser.tags!.includes(tag));
      });
    }

    // Finally filter by time period
    switch (filter) {
      case 'today':
        return userFilteredEvents.filter(event => {
          const startTime = new Date(event.startDate).getTime();
          const endTime = new Date(event.endDate).getTime();
          return startTime <= nowTime && endTime >= nowTime;
        });
      case 'past':
        return userFilteredEvents.filter(event => {
          const endTime = new Date(event.endDate).getTime();
          return endTime < nowTime;
        });
      case 'upcoming':
        return userFilteredEvents.filter(event => {
          const startTime = new Date(event.startDate).getTime();
          return startTime > nowTime;
        });
      case 'all':
      default:
        return userFilteredEvents;
    }
  }, [currentUser]);

  const filteredEvents = filterEvents(events, filter, searchTerm);

  const handleEventPress = useCallback((event: ExpanseEvent) => {
    if (onEventPress) {
      onEventPress(event);
    } else {
      // Default navigation behavior using Expo Router
      router.push(`/event/${event.id}`);
    }
  }, [onEventPress]);

  const getBrandColor = (brand?: Brand): string => {
    switch (brand?.toLowerCase()) {
      case 'ford': return '#257180';
      case 'lincoln': return '#8B1538';
      default: return '#333333';
    }
  };

  const getBrandDisplay = (event: ExpanseEvent) => {
    // Simple brand normalization
    if (!event.brand) return 'Other';
    return event.brand;
  };

  const renderFilterButton = (filterType: EventFilter, title: string) => (
    <TouchableOpacity
      key={filterType}
      style={[
        styles.filterButton,
        filter === filterType && styles.activeFilterButton,
      ]}
      onPress={() => setFilter(filterType)}
    >
      <Text style={[
        styles.filterButtonText,
        filter === filterType && styles.activeFilterButtonText,
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const handleSurveyPress = (event: ExpanseEvent) => {
    if (onEventPress) {
      onEventPress(event);
    } else {
      // Navigate directly to survey screen with full event data
      router.push({
        pathname: `/survey/[id]`,
        params: { 
          id: event.id,
          eventData: JSON.stringify(event) // Pass the entire event as JSON
        }
      });
    }
  };

  const handleScanPress = (event: ExpanseEvent) => {
    if (onEventPress) {
      onEventPress(event);
      return;
    }

    router.push({
      pathname: `/scan/[id]`,
      params: {
        id: event.id,
        eventData: JSON.stringify(event),
      },
    });
  };

  const handleCheckInPress = (event: ExpanseEvent) => {
    const url = `/s/${event.subdomain || event.id}/in`;
    Linking.openURL(url);
  };

  const handleCheckOutPress = (event: ExpanseEvent) => {
    const url = `/s/${event.subdomain || event.id}/out`;
    Linking.openURL(url);
  };

  const renderEventItem = ({ item: event }: { item: ExpanseEvent }) => (
    <View style={styles.eventCard}>
      <View style={styles.eventContent}>
        <Text style={styles.eventTitle}>{event.name || 'Unnamed Event'}</Text>
        
        <View style={styles.eventDates}>
          <Text style={styles.eventDateLabel}>Start: {event.startDate ? new Date(event.startDate).toLocaleDateString() : 'No date set'}</Text>
          <Text style={styles.eventDateLabel}>End: {event.endDate ? new Date(event.endDate).toLocaleDateString() : 'No date set'}</Text>
        </View>
        
        <Text style={[styles.eventBrand, { color: getBrandColor(event.brand) }]}>
          {getBrandDisplay(event)}
        </Text>
        
        {currentUser?.isAdmin && event.tags && event.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {event.tags.map((tag: string, index: number) => (
              <View key={index} style={styles.tagBadge}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
      
      <View style={styles.eventFooter}>
        {event.customConfig?.badgeScan && (
          <TouchableOpacity
            style={[styles.actionButton, styles.scanButton]}
            onPress={() => handleScanPress(event)}
            testID={`scan-button-${event.id}`}
            accessible={true}
            accessibilityLabel={`Scan badge for ${event.name}`}
            accessibilityRole="button"
          >
            <Text style={styles.actionButtonText}>Scan</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleSurveyPress(event)}
          testID={`survey-button-${event.id}`}
          accessible={true}
          accessibilityLabel={`Survey button for ${event.name}`}
          accessibilityRole="button"
        >
          <Icon name="table" size={16} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Survey</Text>
        </TouchableOpacity>
        
        {(event.preRegDate || event.surveyType === 'preTD') && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleCheckInPress(event)}
          >
            <Icon name="arrows-down-to-people" size={16} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Check-In</Text>
          </TouchableOpacity>
        )}
        
        {event._preEventID && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleCheckOutPress(event)}
          >
            <Icon name="person-to-door" size={16} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Check Out</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>No Events Found</Text>
      <Text style={styles.emptyStateText}>
        {filter === 'today' && 'No events active today'}
        {filter === 'past' && 'No past events to display'}
        {filter === 'upcoming' && 'No upcoming events scheduled'}
        {filter === 'all' && 'No events available'}
      </Text>
      {onRefresh && (
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity 
        style={[styles.refreshButton, { marginLeft: 10, backgroundColor: '#FF6F00' }]} 
        onPress={() => router.push('/survey-test')}
      >
        <Text style={styles.refreshButtonText}>Test Survey</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Bar and Tabs - stacked on mobile, side by side on tablet */}
      {isTablet && currentUser?.isAdmin ? (
        // Tablet layout: side by side
        <View style={[styles.searchAndTabsContainer, { flexDirection: 'row', alignItems: 'center' }]}>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search events..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              clearButtonMode="while-editing"
            />
          </View>
          <View style={styles.tabsContainer}>
            <View style={[styles.filterContainer, { paddingHorizontal: 0, paddingVertical: 0 }]}>
              {renderFilterButton('today', 'Today')}
              {renderFilterButton('upcoming', 'Upcoming')}
              {renderFilterButton('past', 'Past')}
              {renderFilterButton('all', 'All')}
            </View>
          </View>
        </View>
      ) : (
        // Mobile layout: stacked - only show container for admins
        currentUser?.isAdmin ? (
          <View style={styles.searchAndTabsContainer}>
            <View style={[styles.searchContainer, { marginRight: 0 }]}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search events..."
                value={searchTerm}
                onChangeText={setSearchTerm}
                clearButtonMode="while-editing"
              />
            </View>
            <View style={styles.tabsContainer}>
              <View style={styles.filterContainer}>
                {renderFilterButton('today', 'Today')}
                {renderFilterButton('upcoming', 'Upcoming')}
                {renderFilterButton('past', 'Past')}
                {renderFilterButton('all', 'All')}
              </View>
            </View>
          </View>
        ) : null
      )}

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#257180" />
          <Text style={styles.loadingText}>Loading events...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredEvents}
          keyExtractor={(item) => item.id}
          renderItem={renderEventItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#257180']}
              tintColor="#257180"
            />
          }
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2E5BF',
  },
  searchAndTabsContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchContainer: {
    flex: 1,
    marginRight: 16,
  },
  searchInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  tabsContainer: {
    flexShrink: 0,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  activeFilterButton: {
    backgroundColor: '#257180',
    borderColor: '#257180',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '500',
  },
  activeFilterButtonText: {
    color: '#ffffff',
  },
  listContainer: {
    paddingVertical: 16,
  },
  eventCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  eventContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
    marginRight: 8,
  },
  eventBrand: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  eventDate: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 12,
    lineHeight: 20,
  },
  eventFooter: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  eventDates: {
    marginTop: 8,
    marginBottom: 8,
  },
  eventDateLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 2,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 8,
  },
  tagBadge: {
    backgroundColor: '#e9ecef',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: '#495057',
    fontWeight: '500',
  },
  actionButton: {
    backgroundColor: '#257180',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  scanButton: {
    backgroundColor: '#0A8754',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: '#d4edda',
  },
  inactiveBadge: {
    backgroundColor: '#f8d7da',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  activeStatusText: {
    color: '#155724',
  },
  inactiveStatusText: {
    color: '#721c24',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
  },
  refreshButton: {
    backgroundColor: '#257180',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
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
});

export default EventListScreen;
