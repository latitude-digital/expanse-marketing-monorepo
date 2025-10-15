import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import EventListScreen from '../src/screens/EventListScreen';
import { eventsService } from '../src/services/firestore';
import { useAuth } from '../src/contexts/AuthContext';
import { Stack } from 'expo-router';
import type { MeridianEvent as ExpanseEvent } from '@meridian-event-tech/shared/types';

export default function EventListPage() {
  console.log('EventListPage rendering');
  const { signOut, currentUser } = useAuth();
  
  const [events, setEvents] = useState<ExpanseEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('useEffect running - loading events from Firestore');
    loadEvents();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  const loadEvents = async () => {
    setLoading(true);
    try {
      console.log('Fetching events from Firestore...');
      const firestoreEvents = await eventsService.getEvents();
      console.log('Loaded', firestoreEvents.length, 'events from Firestore');
      setEvents(firestoreEvents);
    } catch (error) {
      console.error('Failed to load events from Firestore:', error);
      setEvents([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

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
      loading={false}
      currentUser={currentUser}
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
