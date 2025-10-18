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
   * - NON-BLOCKING: Returns document ID immediately without waiting for server confirmation
   * - Firestore queues the write locally and syncs automatically when online
   * - No ID collisions across devices since device_survey_guid is a UUID
   */
  saveSurvey(completionData: SurveyCompletionData): string {
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

    // CRITICAL: Don't await setDoc() - this prevents app hanging when offline
    // The write succeeds locally immediately and syncs to server when online
    setDoc(docRef, answers)
      .then(() => {
        console.log('[SurveySync] ✅ Survey saved to Firestore with ID:', docRef.id);
        console.log('[SurveySync] Path: events/' + eventId + '/surveys/' + docRef.id);
      })
      .catch((error) => {
        console.error('[SurveySync] ❌ Failed to save survey:', error);
        // Error is logged but doesn't block the app
        // The write is still queued locally and will retry automatically
      });

    // Return the document ID immediately - don't wait for server confirmation
    return docRef.id;
  }
}

// Export singleton instance
export const surveySyncService = SurveySyncService.getInstance();
