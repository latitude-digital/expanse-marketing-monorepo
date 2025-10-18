import {
  getFirestore,
  collection,
  collectionGroup,
  query,
  where,
  orderBy,
  getDocs,
  onSnapshot,
  initializeFirestore,
} from '@react-native-firebase/firestore';
import { getApp } from '@react-native-firebase/app';
import { MeridianEvent as ExpanseEvent } from '@meridian-event-tech/shared/types';
import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

/**
 * Configure Firestore with unlimited cache for offline support
 * MUST be called before any Firestore operations
 */
let firestoreSetupPromise: Promise<void> | null = null;

const logFirestoreInfo = (db: FirebaseFirestoreTypes.Module) => {
  const app = db.app ?? getApp();
  console.log('🔥 [FIRESTORE] Initialized Firestore');
  console.log('🔥 [FIRESTORE] Firebase App Name:', app.name);
  console.log('🔥 [FIRESTORE] Project ID:', app.options.projectId);
  console.log('🔥 [FIRESTORE] Storage Bucket:', app.options.storageBucket);
  console.log('🔥 [FIRESTORE] Offline Persistence: ENABLED (default for React Native Firebase)');

  // Connect to the Firestore emulator here if needed (import connectFirestoreEmulator locally).
};

export const configureFirestore = async () => {
  if (!firestoreSetupPromise) {
    firestoreSetupPromise = (async () => {
      try {
        const app = getApp();
        const db = await initializeFirestore(app, {
          cacheSizeBytes: -1,
        });
        console.log('🔥 [FIRESTORE] ✅ Unlimited cache size enabled');
        logFirestoreInfo(db);
      } catch (error) {
        console.warn('🔥 [FIRESTORE] ⚠️ Failed to configure cache size (may have already been set):', error);
        // Ensure we still log project information even if settings were already applied
        const db = getFirestore();
        logFirestoreInfo(db);
      }
    })();
  }

  return firestoreSetupPromise;
};

export const eventsService = {
  // Get all events from Firestore
  getEvents: async (): Promise<ExpanseEvent[]> => {
    try {
      const db = getFirestore();
      const eventsCol = collection(db, 'events');
      const q = query(eventsCol, orderBy('startDate', 'desc'));
      const snapshot = await getDocs(q);

      const events: ExpanseEvent[] = snapshot.docs.map(doc => {
        const data = doc.data();
        const customConfig = (() => {
          const rawValue = data.customConfig;
          if (rawValue === undefined || rawValue === null) {
            return null;
          }
          if (typeof rawValue === 'string') {
            try {
              return JSON.parse(rawValue);
            } catch (error) {
              console.warn('[eventsService] Failed to parse customConfig JSON for event', doc.id, error);
              return null;
            }
          }
          return rawValue;
        })();
        return {
          id: doc.id,
          name: data.name || '',
          brand: data.brand,
          subdomain: data.subdomain || '',
          preRegDate: data.preRegDate?.toDate(),
          startDate: data.startDate?.toDate() || new Date(),
          endDate: data.endDate?.toDate() || new Date(),
          isActive: data.isActive !== false, // Default to true if not specified
          tags: data.tags || [],
          surveyType: data.surveyType,
          _preEventID: data._preEventID,
          fordEventID: data.fordEventID,
          lincolnEventID: data.lincolnEventID,
          agency: data.agency,
          hidden: data.hidden || false,
          archived: data.archived || false,
          isInternal: data.isInternal || false,
          locked: data.locked || false,
          template: data.template,
          brandConfig: data.brandConfig,
          questions: data.questions || data.surveyJSON || { pages: [] },
          surveyJSON: data.surveyJSON || data.questions || { pages: [] },
          surveyJSModel: data.surveyJSModel || data.surveyJSON || data.questions || { pages: [] },
          theme: data.theme || data.surveyJSTheme || { cssVariables: {} },
          surveyJSTheme: data.surveyJSTheme || data.theme || { cssVariables: {} },
          customConfig,
        };
      });

      return events;
    } catch (error) {
      console.error('Error fetching events from Firestore:', error);
      throw error;
    }
  },

  // Listen for real-time updates
  onEventsChange: (callback: (events: ExpanseEvent[]) => void) => {
    const db = getFirestore();
    const eventsCol = collection(db, 'events');
    const q = query(eventsCol, orderBy('startDate', 'desc'));

    return onSnapshot(
      q,
      (snapshot) => {
          const events: ExpanseEvent[] = snapshot.docs.map(doc => {
            const data = doc.data();
            const customConfig = (() => {
              const rawValue = data.customConfig;
              if (rawValue === undefined || rawValue === null) {
                return null;
              }
              if (typeof rawValue === 'string') {
                try {
                  return JSON.parse(rawValue);
                } catch (error) {
                  console.warn('[eventsService] Failed to parse customConfig JSON for event', doc.id, error);
                  return null;
                }
              }
              return rawValue;
            })();
            return {
              id: doc.id,
              name: data.name || '',
              brand: data.brand,
              subdomain: data.subdomain || '',
              preRegDate: data.preRegDate?.toDate(),
              startDate: data.startDate?.toDate() || new Date(),
              endDate: data.endDate?.toDate() || new Date(),
              isActive: data.isActive !== false,
              tags: data.tags || [],
              surveyType: data.surveyType,
              _preEventID: data._preEventID,
              fordEventID: data.fordEventID,
              lincolnEventID: data.lincolnEventID,
              agency: data.agency,
              hidden: data.hidden || false,
              archived: data.archived || false,
              isInternal: data.isInternal || false,
              locked: data.locked || false,
              template: data.template,
              brandConfig: data.brandConfig,
              questions: data.questions || data.surveyJSON || { pages: [] },
              surveyJSON: data.surveyJSON || data.questions || { pages: [] },
              surveyJSModel: data.surveyJSModel || data.surveyJSON || data.questions || { pages: [] },
              theme: data.theme || data.surveyJSTheme || { cssVariables: {} },
              surveyJSTheme: data.surveyJSTheme || data.theme || { cssVariables: {} },
              customConfig,
            };
          });
          callback(events);
        },
        (error) => {
          console.error('Error listening to events:', error);
        }
      );
  }
};

export const surveysService = {
  /**
   * Check if a badge has already completed a survey in the given event
   * @param badgeNumber - The scanned badge number
   * @param eventId - The event ID to check
   * @returns Survey data if found, null otherwise
   */
  checkBadgeAlreadyScanned: async (
    badgeNumber: string,
    eventId: string
  ): Promise<{ data: any; path: string } | null> => {
    try {
      const db = getFirestore();

      // Query the event's surveys subcollection for this badge
      const surveysQuery = query(
        collection(db, 'events', eventId, 'surveys'),
        where('_scanValue', '==', badgeNumber)
      );

      const snapshot = await getDocs(surveysQuery);

      if (snapshot.empty) {
        return null;
      }

      // Return the first matching survey
      const doc = snapshot.docs[0];
      return {
        data: doc.data(),
        path: doc.ref.path
      };
    } catch (error) {
      console.error('[surveysService] Error checking badge scan:', error);
      throw error;
    }
  }
};

export const activationsService = {
  /**
   * Find original activation survey for a badge across linked events
   * @param badgeNumber - The scanned badge number
   * @param activationEventIds - Array of event IDs to search (max 10)
   * @returns Survey data with full path OR null if not found
   */
  findOriginalActivationSurvey: async (
    badgeNumber: string,
    activationEventIds: string[]
  ): Promise<{ data: any; path: string; eventId: string } | null> => {
    try {
      // 1. Log search parameters
      console.log('[ACTIVATIONS] Starting search for original activation survey');
      console.log('[ACTIVATIONS] Badge Number:', badgeNumber);
      console.log('[ACTIVATIONS] Activation Event IDs:', JSON.stringify(activationEventIds));

      const db = getFirestore();

      // Query surveys collection group with IN query
      const surveysQuery = query(
        collectionGroup(db, 'surveys'),
        where('_scanValue', '==', badgeNumber),
        where('_eventId', 'in', activationEventIds)
      );

      const snapshot = await getDocs(surveysQuery);

      // 2. Log total surveys found
      console.log('[ACTIVATIONS] Total surveys found in query:', snapshot.size);

      if (snapshot.empty) {
        console.log('[ACTIVATIONS] Returning null: No surveys found for badge in activation events');
        return null;
      }

      // Filter out any surveys that already have _originalActivation
      // (we want the original, not a copy)
      const originalSurveys = snapshot.docs
        .filter(doc => !doc.data()._originalActivation)
        .map(doc => ({
          doc,
          data: doc.data(),
          createdAt: doc.data().survey_date || null
        }));

      // 3. Log how many originals remain after filtering
      console.log('[ACTIVATIONS] Original surveys (without _originalActivation):', originalSurveys.length);
      console.log('[ACTIVATIONS] Filtered out (have _originalActivation):', snapshot.size - originalSurveys.length);

      if (originalSurveys.length === 0) {
        console.log('[ACTIVATIONS] Returning null: All surveys have _originalActivation (no originals found)');
        return null;
      }

      // 4. Log survey_date values being compared
      console.log('[ACTIVATIONS] Survey dates before sorting:');
      originalSurveys.forEach((survey, idx) => {
        console.log(`[ACTIVATIONS]   [${idx}] survey_date:`, survey.createdAt, 'eventId:', survey.data._eventId);
      });

      // Sort by survey_date (oldest first) and pick the first one
      originalSurveys.sort((a, b) => {
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });

      console.log('[ACTIVATIONS] Survey dates after sorting (oldest first):');
      originalSurveys.forEach((survey, idx) => {
        console.log(`[ACTIVATIONS]   [${idx}] survey_date:`, survey.createdAt, 'eventId:', survey.data._eventId);
      });

      const oldest = originalSurveys[0];

      // 5. Log the result being returned
      console.log('[ACTIVATIONS] Found original activation survey!');
      console.log('[ACTIVATIONS] Survey Path:', oldest.doc.ref.path);
      console.log('[ACTIVATIONS] Event ID:', oldest.data._eventId);
      console.log('[ACTIVATIONS] Survey Date:', oldest.createdAt);
      console.log('[ACTIVATIONS] Badge Number:', oldest.data._scanValue);

      return {
        data: oldest.data,
        path: oldest.doc.ref.path, // Full path: "events/{eventId}/surveys/{surveyId}"
        eventId: oldest.data._eventId
      };
    } catch (error) {
      console.error('[ACTIVATIONS] Error finding activation survey:', error);
      throw error;
    }
  }
};
