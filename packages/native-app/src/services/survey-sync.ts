import {
  getFirestore,
  doc,
  setDoc,
  collection,
} from '@react-native-firebase/firestore';
import type { SurveyCompletionData } from '../components/OfflineSurveyWebView';

/**
 * Survey sync service for saving survey responses to Firestore
 * Uses offline persistence to work without network connection
 *
 * React Native Firebase has offline persistence enabled by default,
 * so surveys will be queued and synced automatically when online.
 */
export class SurveySyncService {
  private static instance: SurveySyncService;

  private constructor() {
    console.log('[SurveySync] ✅ Service initialized (offline persistence enabled by default)');
  }

  static getInstance(): SurveySyncService {
    if (!SurveySyncService.instance) {
      SurveySyncService.instance = new SurveySyncService();
    }
    return SurveySyncService.instance;
  }

  /**
   * Save survey response to Firestore using device_survey_guid as document ID
   * Path: events/{eventId}/surveys/{device_survey_guid}
   *
   * Key approach:
   * - Uses device_survey_guid from survey data as the Firestore document ID
   * - This ensures the same ID is used everywhere (Firestore, local DB)
   * - Works offline - setDoc() returns immediately and queues the write
   * - No ID collisions across devices since device_survey_guid is a UUID
   */
  async saveSurvey(completionData: SurveyCompletionData): Promise<string> {
    try {
      const { eventId, answers } = completionData;

      if (!eventId) {
        throw new Error('eventId is required');
      }

      if (!answers || typeof answers !== 'object') {
        throw new Error('answers object is required');
      }

      // Use device_survey_guid as the document ID - it's already a unique UUID
      const deviceSurveyGuid = answers.device_survey_guid as string;
      if (!deviceSurveyGuid) {
        throw new Error('device_survey_guid is required in survey answers');
      }

      console.log('[SurveySync] 💾 Saving survey to Firestore:', {
        eventId,
        deviceSurveyGuid,
        answersCount: Object.keys(answers).length,
      });

      const db = getFirestore();
      const surveysCollection = collection(db, 'events', eventId, 'surveys');

      // Use the device_survey_guid as the document ID
      // This ensures consistency between Firestore and local database
      const docRef = doc(surveysCollection, deviceSurveyGuid);

      // Use setDoc() - works offline and returns immediately
      await setDoc(docRef, answers);

      console.log('[SurveySync] ✅ Survey saved to Firestore with ID:', docRef.id);
      console.log('[SurveySync] Path: events/' + eventId + '/surveys/' + docRef.id);

      return docRef.id;
    } catch (error) {
      console.error('[SurveySync] ❌ Failed to save survey:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const surveySyncService = SurveySyncService.getInstance();
