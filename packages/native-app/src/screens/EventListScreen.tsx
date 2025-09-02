import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import type { ExpanseEvent, Brand } from '@expanse/shared/types';

export type EventFilter = 'all' | 'current' | 'past' | 'future';

interface EventListScreenProps {
  events?: ExpanseEvent[];
  loading?: boolean;
  onRefresh?: () => Promise<void>;
  onEventPress?: (event: ExpanseEvent) => void;
}

const EventListScreen: React.FC<EventListScreenProps> = ({
  events = [],
  loading = false,
  onRefresh,
  onEventPress,
}) => {
  // Using Expo Router instead of React Navigation
  const [filter, setFilter] = useState<EventFilter>('current');
  const [refreshing, setRefreshing] = useState(false);

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

  const filterEvents = useCallback((events: ExpanseEvent[], filter: EventFilter): ExpanseEvent[] => {
    const now = Date.now();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    switch (filter) {
      case 'current':
        return events.filter(event => {
          const eventDate = new Date(event.startDate || now);
          return eventDate >= todayStart && eventDate <= todayEnd;
        });
      case 'past':
        return events.filter(event => {
          const eventDate = new Date(event.startDate || now);
          return eventDate < todayStart;
        });
      case 'future':
        return events.filter(event => {
          const eventDate = new Date(event.startDate || now);
          return eventDate > todayEnd;
        });
      case 'all':
      default:
        return events;
    }
  }, []);

  const filteredEvents = filterEvents(events, filter);

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

  const renderEventItem = ({ item: event }: { item: ExpanseEvent }) => (
    <TouchableOpacity
      style={[styles.eventCard, { borderLeftColor: getBrandColor(event.brand) }]}
      onPress={() => handleEventPress(event)}
    >
      <View style={styles.eventHeader}>
        <Text style={styles.eventTitle}>{event.name || 'Unnamed Event'}</Text>
        <Text style={[styles.eventBrand, { color: getBrandColor(event.brand) }]}>
          {(event.brand || 'Other').toUpperCase()}
        </Text>
      </View>
      
      <Text style={styles.eventDate}>
        {event.startDate ? new Date(event.startDate).toLocaleDateString() : 'No date set'}
      </Text>
      
      {event.thanks && (
        <Text style={styles.eventDescription} numberOfLines={2}>
          {event.thanks}
        </Text>
      )}
      
      <View style={styles.eventFooter}>
        <Text style={styles.eventLocation}>
          {'Location TBD'}
        </Text>
        <View style={[styles.statusBadge, 
          !event.disabled ? styles.activeBadge : styles.inactiveBadge
        ]}>
          <Text style={[styles.statusText,
            !event.disabled ? styles.activeStatusText : styles.inactiveStatusText
          ]}>
            {!event.disabled ? 'Active' : 'Disabled'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>No Events Found</Text>
      <Text style={styles.emptyStateText}>
        {filter === 'current' && 'No events scheduled for today'}
        {filter === 'past' && 'No past events to display'}
        {filter === 'future' && 'No upcoming events scheduled'}
        {filter === 'all' && 'No events available'}
      </Text>
      {onRefresh && (
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Events</Text>
        <Text style={styles.headerSubtitle}>
          {filteredEvents.length} {filter === 'all' ? 'total' : filter} events
        </Text>
      </View>

      <View style={styles.filterContainer}>
        {renderFilterButton('current', 'Today')}
        {renderFilterButton('future', 'Upcoming')}
        {renderFilterButton('past', 'Past')}
        {renderFilterButton('all', 'All')}
      </View>

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
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
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
    padding: 16,
  },
  eventCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventLocation: {
    fontSize: 12,
    color: '#666666',
    flex: 1,
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