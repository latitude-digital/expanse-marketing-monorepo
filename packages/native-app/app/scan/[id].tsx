import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { MeridianEvent } from '@meridian-event-tech/shared/types';
import BadgeScanScreen from '../../src/screens/BadgeScanScreen';

export default function BadgeScanRoute() {
  const router = useRouter();
  const { id, eventData } = useLocalSearchParams<{ id: string; eventData?: string }>();

  let event: MeridianEvent | null = null;

  if (eventData) {
    try {
      event = JSON.parse(eventData);
    } catch (error) {
      console.warn('[BadgeScanRoute] Failed to parse event data from params', error);
    }
  }

  if (!event) {
    return (
      <View style={styles.fallbackContainer}>
        <Text style={styles.fallbackTitle}>Event Details Missing</Text>
        <Text style={styles.fallbackText}>
          We could not load details for event {id || ''}. Please return to the event list and try again.
        </Text>
        <TouchableOpacity style={styles.fallbackButton} onPress={() => router.replace('/')}>
          <Text style={styles.fallbackButtonText}>Back to Events</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <BadgeScanScreen event={event} />;
}

const styles = StyleSheet.create({
  fallbackContainer: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  fallbackTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  fallbackText: {
    color: '#CCCCCC',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 20,
  },
  fallbackButton: {
    marginTop: 20,
    backgroundColor: '#00B4D8',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  fallbackButtonText: {
    color: '#000000',
    fontWeight: '700',
    fontSize: 15,
  },
});
