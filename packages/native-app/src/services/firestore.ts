import firestore from '@react-native-firebase/firestore';
import { ExpanseEvent } from '@expanse/shared/types';

// Connect to emulator in development
const initializeFirestore = () => {
  // Connect to emulator if in development
  if (__DEV__) {
    try {
      // Use localhost for iOS simulator, 10.0.2.2 for Android emulator
      const host = 'localhost';
      firestore().useEmulator(host, 8080);
      console.log('🔧 Connected to Firestore emulator at localhost:8080');
    } catch (error) {
      console.log('⚠️ Firestore emulator already connected');
    }
  }
};

// Initialize on import
initializeFirestore();

export const eventsService = {
  // Get all events from Firestore
  getEvents: async (): Promise<ExpanseEvent[]> => {
    try {
      const snapshot = await firestore()
        .collection('events')
        .orderBy('startDate', 'desc')
        .get();

      const events: ExpanseEvent[] = snapshot.docs.map(doc => {
        const data = doc.data();
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
          questions: data.questions || { pages: [] },
          theme: data.theme || { cssVariables: {} },
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
    return firestore()
      .collection('events')
      .orderBy('startDate', 'desc')
      .onSnapshot(
        (snapshot) => {
          const events: ExpanseEvent[] = snapshot.docs.map(doc => {
            const data = doc.data();
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
              questions: data.questions || { pages: [] },
              theme: data.theme || { cssVariables: {} },
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

export default firestore;