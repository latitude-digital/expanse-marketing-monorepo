import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getFirestore, collection, doc, onSnapshot } from '@react-native-firebase/firestore';
import type { MeridianEvent as ExpanseEvent } from '@meridian-event-tech/shared/types';

/**
 * EventSyncContext provides real-time synchronization state for the currently active event
 * and all of its linked activation events.
 *
 * Features:
 * - Monitors pending writes across event + all activation events
 * - Provides online/offline state derived from Firestore metadata
 * - Automatically subscribes/unsubscribes when event changes
 * - Supports up to 10 activation events (Firestore IN query limit)
 */

interface EventSyncContextValue {
  /** True if connected to Firestore server (any monitored collection from server) */
  isOnline: boolean;
  /** Total pending writes across current event + all activation events */
  pendingWriteCount: number;
  /** True when all writes have been synced (pendingWriteCount === 0) */
  isFullySynced: boolean;
  /** The ID of the currently monitored event */
  currentEventId: string | null;
  /** Set the current event to monitor (along with its activation events) */
  setCurrentEvent: (eventId: string, event: ExpanseEvent) => void;
  /** Clear the current event and stop all monitoring */
  clearCurrentEvent: () => void;
}

const EventSyncContext = createContext<EventSyncContextValue | undefined>(undefined);

export function useEventSync() {
  const context = useContext(EventSyncContext);
  if (context === undefined) {
    throw new Error('useEventSync must be used within an EventSyncProvider');
  }
  return context;
}

interface EventSyncProviderProps {
  children: ReactNode;
}

export function EventSyncProvider({ children }: EventSyncProviderProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [currentEventId, setCurrentEventId] = useState<string | null>(null);
  const [currentEvent, setCurrentEvent] = useState<ExpanseEvent | null>(null);

  // Track pending write counts per event ID
  // Key: eventId, Value: pending write count
  const [eventPendingCounts, setEventPendingCounts] = useState<Record<string, number>>({});

  /**
   * Update pending write count for a specific event
   */
  const setPendingCountForEvent = useCallback((eventId: string, count: number) => {
    setEventPendingCounts(prev => {
      // Only update if count changed
      if (prev[eventId] === count) {
        return prev;
      }
      return { ...prev, [eventId]: count };
    });
  }, []);

  /**
   * Monitor the current event's surveys collection
   */
  useEffect(() => {
    if (!currentEventId) {
      return;
    }

    const path = `events/${currentEventId}/surveys`;
    console.log('[EventSync] 👀 Starting listener for current event:', currentEventId);
    console.log('[EventSync] 📍 Firestore path:', path);

    const db = getFirestore();
    const surveysRef = collection(doc(collection(db, 'events'), currentEventId), 'surveys');

    const unsubscribe = onSnapshot(
      surveysRef,
      { includeMetadataChanges: true }, // CRITICAL: enables metadata updates
      (snapshot) => {
        // Check if data is from cache (offline) or server (online)
        const fromServer = !snapshot.metadata.fromCache;

        if (fromServer) {
          setIsOnline(true);
        }

        // Count pending writes in this collection
        const pending = snapshot.docs.filter(
          doc => doc.metadata.hasPendingWrites
        ).length;

        console.log(`[EventSync] 📊 ${path}: ${pending} pending, ${snapshot.docs.length} total docs, fromServer: ${fromServer}`);

        // Store for aggregation
        setPendingCountForEvent(currentEventId, pending);
      },
      (error) => {
        console.error(`[EventSync] ❌ Error on ${path}:`, error);
        setIsOnline(false);
      }
    );

    return () => {
      console.log('[EventSync] 🛑 Stopped listener for:', path);
      unsubscribe();
    };
  }, [currentEventId, setPendingCountForEvent]);

  /**
   * Monitor all activation events' surveys collections
   *
   * Per ACTIVATIONS_IMPLEMENTATION.md:
   * - Events can be linked via customConfig.activations array (max 10 event IDs)
   * - When a badge is scanned at an activation event, survey data is copied with _originalActivation
   * - We need to track pending writes in ALL linked events for complete sync visibility
   */
  useEffect(() => {
    if (!currentEvent || !currentEvent.customConfig?.activations) {
      // No activation events to monitor
      return;
    }

    const activationEventIds = currentEvent.customConfig.activations;

    if (!Array.isArray(activationEventIds) || activationEventIds.length === 0) {
      return;
    }

    console.log('[EventSync] 🔗 Found', activationEventIds.length, 'activation event(s)');
    console.log('[EventSync] 🔗 Activation event IDs:', activationEventIds.join(', '));

    const db = getFirestore();

    // Create listeners for each activation event's surveys collection
    const unsubscribers = activationEventIds.map(activationEventId => {
      const path = `events/${activationEventId}/surveys`;
      console.log(`[EventSync] 👀 Starting listener for activation event: ${activationEventId}`);
      console.log(`[EventSync] 📍 Firestore path: ${path}`);

      const surveysRef = collection(doc(collection(db, 'events'), activationEventId), 'surveys');

      return onSnapshot(
        surveysRef,
        { includeMetadataChanges: true },
        (snapshot) => {
          // Count pending writes in this activation event
          const pending = snapshot.docs.filter(
            doc => doc.metadata.hasPendingWrites
          ).length;

          const fromServer = !snapshot.metadata.fromCache;

          console.log(`[EventSync] 📊 ${path}: ${pending} pending, ${snapshot.docs.length} total docs, fromServer: ${fromServer}`);

          // Store for aggregation
          setPendingCountForEvent(activationEventId, pending);

          // Update online status (if ANY collection is from server, we're online)
          if (fromServer) {
            setIsOnline(true);
          }
        },
        (error) => {
          console.error(`[EventSync] ❌ Error on ${path}:`, error);
        }
      );
    });

    return () => {
      activationEventIds.forEach(id => {
        console.log(`[EventSync] 🛑 Stopped listener for: events/${id}/surveys`);
      });
      // Clean up all activation event listeners
      unsubscribers.forEach(unsub => unsub());
    };
  }, [currentEvent, setPendingCountForEvent]);

  /**
   * Aggregate total pending writes across all monitored events
   * (current event + all activation events)
   */
  const pendingWriteCount = Object.values(eventPendingCounts).reduce(
    (sum, count) => sum + count,
    0
  );

  const isFullySynced = pendingWriteCount === 0;

  /**
   * Set the current event to monitor (along with its activation events)
   */
  const setCurrentEventHandler = useCallback((eventId: string, event: ExpanseEvent) => {
    console.log('[EventSync] 📍 Setting current event:', eventId);

    if (event.customConfig?.activations) {
      console.log('[EventSync] 🔗 Event has', event.customConfig.activations.length, 'activation(s)');
    } else {
      console.log('[EventSync] ℹ️  Event has no activations');
    }

    setCurrentEventId(eventId);
    setCurrentEvent(event);
    setEventPendingCounts({}); // Reset counts when switching events
  }, []);

  /**
   * Clear the current event and stop all monitoring
   */
  const clearCurrentEventHandler = useCallback(() => {
    console.log('[EventSync] 🧹 Clearing current event');
    setCurrentEventId(null);
    setCurrentEvent(null);
    setEventPendingCounts({});
  }, []);

  const value: EventSyncContextValue = {
    isOnline,
    pendingWriteCount,
    isFullySynced,
    currentEventId,
    setCurrentEvent: setCurrentEventHandler,
    clearCurrentEvent: clearCurrentEventHandler,
  };

  return (
    <EventSyncContext.Provider value={value}>
      {children}
    </EventSyncContext.Provider>
  );
}
