import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import EventListScreen from '../src/screens/EventListScreen';
import { DatabaseService } from '../src/services/database';
import { EventCacheService } from '../src/services/event-cache';
import { offlineDetector } from '../src/utils/offline-detector';
import type { ExpanseEvent } from '@expanse/shared/types';

export default function EventListPage() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [events, setEvents] = useState<ExpanseEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [dbService] = useState(() => DatabaseService.createEncrypted());
  const [eventCache] = useState(() => new EventCacheService(dbService));

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      await dbService.initialize();
      const isDbReady = await dbService.isInitialized();
      if (!isDbReady) {
        throw new Error('Database initialization failed');
      }
      await loadEvents();
      setIsInitialized(true);
    } catch (error) {
      console.error('App initialization failed:', error);
      setIsInitialized(true);
    }
  };

  const loadEvents = async () => {
    setLoading(true);
    try {
      const cachedEvents = await eventCache.getCachedEvents();
      setEvents(cachedEvents);

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

  const refreshEventsFromAPI = async () => {
    try {
      const mockEvents: ExpanseEvent[] = [
        {
          id: 'ford-event-1',
          name: 'Ford F-150 Lightning Experience',
          brand: 'Ford',
          isActive: true,
          startDate: new Date(Date.now() - 60 * 60 * 1000), // Started 1 hour ago
          endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
          questions: {
            pages: [
              {
                name: "page1",
                elements: [
                  {
                    type: "text",
                    name: "firstName",
                    title: "What is your first name?",
                    isRequired: true
                  },
                  {
                    type: "text", 
                    name: "lastName",
                    title: "What is your last name?",
                    isRequired: true
                  },
                  {
                    type: "radiogroup",
                    name: "vehicleInterest",
                    title: "Which Ford F-150 Lightning feature interests you most?",
                    choices: [
                      "All-electric powertrain",
                      "Pro Power Onboard capability", 
                      "Intelligent Range technology",
                      "Advanced towing features",
                      "Ford Co-Pilot360 technology"
                    ],
                    isRequired: true
                  }
                ]
              },
              {
                name: "page2", 
                elements: [
                  {
                    type: "rating",
                    name: "overallExperience",
                    title: "How would you rate your overall experience with the F-150 Lightning?",
                    rateMin: 1,
                    rateMax: 5,
                    minRateDescription: "Poor",
                    maxRateDescription: "Excellent",
                    isRequired: true
                  },
                  {
                    type: "comment",
                    name: "feedback",
                    title: "Please share any additional feedback about your Ford F-150 Lightning experience:",
                    rows: 4
                  },
                  {
                    type: "boolean",
                    name: "recommend",
                    title: "Would you recommend the Ford F-150 Lightning to others?",
                    isRequired: true
                  }
                ]
              }
            ]
          },
          theme: { cssVariables: {} },
        },
        {
          id: 'lincoln-event-1',
          name: 'Lincoln Aviator Luxury Test Drive',
          brand: 'Lincoln',
          isActive: true,
          startDate: new Date(Date.now() + 86400000),
          endDate: new Date(Date.now() + 2 * 86400000),
          questions: { pages: [] },
          theme: { cssVariables: {} },
        },
        {
          id: 'other-event-1',
          name: 'General Automotive Survey',
          brand: 'Other',
          isActive: true,
          startDate: new Date(Date.now() - 86400000),
          endDate: new Date(Date.now() - 43200000),
          questions: { pages: [] },
          theme: { cssVariables: {} },
        },
      ];

      for (const event of mockEvents) {
        await eventCache.cacheEvent(event);
      }
      setEvents(mockEvents);
    } catch (error) {
      console.error('Failed to refresh events from API:', error);
      throw error;
    }
  };

  if (!isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>Initializing Expanse Survey...</Text>
      </View>
    );
  }

  return (
    <EventListScreen
      events={events}
      loading={loading}
      onRefresh={loadEvents}
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
});
