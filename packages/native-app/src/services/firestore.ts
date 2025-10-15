import {
  getFirestore,
  collection,
  query,
  orderBy,
  getDocs,
  onSnapshot,
  connectFirestoreEmulator,
} from '@react-native-firebase/firestore';
import { MeridianEvent as ExpanseEvent } from '@meridian-event-tech/shared/types';

// Connect to emulator in development
const initializeFirestore = () => {
  const db = getFirestore();

  // Log Firebase project connection info
  console.log('🔥 [FIRESTORE] Initialized Firestore');
  console.log('🔥 [FIRESTORE] Firebase App Name:', db.app.name);
  console.log('🔥 [FIRESTORE] Project ID:', db.app.options.projectId);
  console.log('🔥 [FIRESTORE] Storage Bucket:', db.app.options.storageBucket);

  // Connect to emulator if in development
  // DISABLED: Uncomment to use local emulator
  // if (__DEV__) {
  //   try {
  //     // Use localhost for iOS simulator, 10.0.2.2 for Android emulator
  //     const host = 'localhost';
  //     connectFirestoreEmulator(db, host, 8080);
  //     console.log('🔧 Connected to Firestore emulator at localhost:8080');
  //   } catch (error) {
  //     console.log('⚠️ Firestore emulator already connected');
  //   }
  // }
};

// Initialize on import
initializeFirestore();

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
