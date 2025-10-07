import { DatabaseService } from './database';
import { DatabaseOperations } from './database-operations';
import { environment } from '../config/environment';
import { offlineDetector } from '../utils/offline-detector';
import type { MeridianEvent as ExpanseEvent, FordSurveyAnswers, LincolnSurveyAnswers, BaseSurveyAnswers } from '@meridian-event-tech/shared/types';
import { mapSurveyResponseToFordAPI, mapSurveyResponseToLincolnAPI, mapSurveyResponseToFirestore } from '@meridian-event-tech/shared/utils';

export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed';
export type SyncEndpoint = 'firestore' | 'ford_api' | 'lincoln_api';

export interface SyncQueueItem {
  id: string;
  type: SyncEndpoint;
  payload: string;
  retry_count: number;
  last_attempt?: number;
  created_at?: number;
}

export interface SyncResult {
  success: boolean;
  endpoint: SyncEndpoint;
  error?: string;
  statusCode?: number;
  retryable?: boolean;
}

export interface SyncProgress {
  total: number;
  completed: number;
  failed: number;
  inProgress: number;
  currentItem?: string;
}

export interface SyncMetrics {
  totalSynced: number;
  totalFailed: number;
  avgSyncTime: number;
  lastSyncAttempt?: number;
  lastSuccessfulSync?: number;
  connectionType?: string;
}

export type SyncProgressCallback = (progress: SyncProgress) => void;
export type SyncCompletionCallback = (metrics: SyncMetrics) => void;

export class SyncManager {
  private static instance: SyncManager;
  private dbService!: DatabaseService;
  private operations: DatabaseOperations | null = null;
  private isSyncing = false;
  private syncInterval: ReturnType<typeof setTimeout> | null = null;
  private maxRetries = 3;
  private baseRetryDelayMs = 1000;
  private progressCallback: SyncProgressCallback | null = null;
  private completionCallback: SyncCompletionCallback | null = null;

  constructor(dbService: DatabaseService) {
    if (SyncManager.instance) {
      return SyncManager.instance;
    }
    SyncManager.instance = this;
    this.dbService = dbService;
    this.initialize();
  }

  /**
   * Initialize sync manager
   */
  private async initialize(): Promise<void> {
    try {
      this.operations = await this.dbService.getOperations();
      this.setupConnectivityListener();
    } catch (error) {
      console.error('SyncManager initialization failed:', error);
    }
  }

  /**
   * Set up connectivity listener for automatic sync
   */
  private setupConnectivityListener(): void {
    offlineDetector.addListener((networkState) => {
      if (networkState.isConnected && networkState.isInternetReachable) {
        // Connection restored, trigger sync if we have pending items
        this.checkAndSync();
      }
    });
  }

  /**
   * Add survey response to sync queue
   */
  async queueSurveyResponse(
    surveyResponse: any,
    event: ExpanseEvent
  ): Promise<void> {
    if (!this.operations) {
      throw new Error('SyncManager not initialized');
    }

    const baseId = `${event.id}_${Date.now()}`;

    try {
      // Always queue Firestore sync
      await this.operations.createSyncQueueItem({
        id: `${baseId}_firestore`,
        type: 'firestore',
        payload: JSON.stringify({
          surveyResponse: mapSurveyResponseToFirestore(surveyResponse, event),
          event,
        }),
        retry_count: 0,
      });

      // Queue brand-specific API sync based on event brand
      if (event.brand === 'Ford') {
        await this.operations.createSyncQueueItem({
          id: `${baseId}_ford`,
          type: 'ford_api',
          payload: JSON.stringify({
            surveyResponse: mapSurveyResponseToFordAPI(surveyResponse, event),
            event,
          }),
          retry_count: 0,
        });
      } else if (event.brand === 'Lincoln') {
        await this.operations.createSyncQueueItem({
          id: `${baseId}_lincoln`,
          type: 'lincoln_api',
          payload: JSON.stringify({
            surveyResponse: mapSurveyResponseToLincolnAPI(surveyResponse, event),
            event,
          }),
          retry_count: 0,
        });
      }

      // Trigger immediate sync if online
      if (offlineDetector.isOnline()) {
        this.startSync();
      }
    } catch (error) {
      console.error('Failed to queue survey response:', error);
      throw error;
    }
  }

  /**
   * Start manual sync process
   */
  async startSync(): Promise<void> {
    if (this.isSyncing) {
      console.log('Sync already in progress');
      return;
    }

    if (!offlineDetector.isSyncable()) {
      console.log('Device not ready for sync (offline or wifi-only mode without wifi)');
      return;
    }

    this.isSyncing = true;
    const startTime = Date.now();

    try {
      await this.processSyncQueue();
      
      const metrics: SyncMetrics = {
        totalSynced: 0,
        totalFailed: 0,
        avgSyncTime: Date.now() - startTime,
        lastSyncAttempt: Date.now(),
        lastSuccessfulSync: Date.now(),
        connectionType: offlineDetector.getCurrentState().type,
      };

      if (this.completionCallback) {
        this.completionCallback(metrics);
      }
    } catch (error) {
      console.error('Sync process failed:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Process all pending items in sync queue
   */
  private async processSyncQueue(): Promise<void> {
    if (!this.operations) {
      throw new Error('SyncManager not initialized');
    }

    const pendingItems = await this.operations.getPendingSyncItems();
    const total = pendingItems.length;
    let completed = 0;
    let failed = 0;

    for (const item of pendingItems) {
      if (!offlineDetector.isOnline()) {
        console.log('Lost connection during sync, stopping');
        break;
      }

      this.updateProgress({
        total,
        completed,
        failed,
        inProgress: 1,
        currentItem: item.type,
      });

      try {
        const result = await this.syncItem(item);
        
        if (result.success) {
          await this.operations.deleteSyncQueueItem(item.id);
          completed++;
        } else {
          await this.handleSyncFailure(item, result);
          failed++;
        }
      } catch (error) {
        console.error(`Sync failed for item ${item.id}:`, error);
        await this.handleSyncFailure(item, {
          success: false,
          endpoint: item.type,
          error: error instanceof Error ? error.message : 'Unknown error',
          retryable: true,
        });
        failed++;
      }

      // Brief pause between sync operations to avoid overwhelming APIs
      await this.delay(100);
    }

    this.updateProgress({
      total,
      completed,
      failed,
      inProgress: 0,
    });
  }

  /**
   * Sync individual queue item
   */
  private async syncItem(item: SyncQueueItem): Promise<SyncResult> {
    const payload = JSON.parse(item.payload);
    
    switch (item.type) {
      case 'firestore':
        return await this.syncToFirestore(payload);
      case 'ford_api':
        return await this.syncToFordAPI(payload);
      case 'lincoln_api':
        return await this.syncToLincolnAPI(payload);
      default:
        return {
          success: false,
          endpoint: item.type,
          error: `Unknown sync endpoint: ${item.type}`,
          retryable: false,
        };
    }
  }

  /**
   * Sync to Firestore using existing SAVE_SURVEY endpoint
   */
  private async syncToFirestore(payload: any): Promise<SyncResult> {
    try {
      const response = await fetch(`${environment.apiUrl}/api/save-survey`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${environment.firebase.apiKey}`,
        },
        body: JSON.stringify(payload.surveyResponse),
      });

      if (response.ok) {
        return {
          success: true,
          endpoint: 'firestore',
          statusCode: response.status,
        };
      } else {
        const errorText = await response.text();
        return {
          success: false,
          endpoint: 'firestore',
          error: errorText,
          statusCode: response.status,
          retryable: response.status >= 500, // Retry server errors
        };
      }
    } catch (error) {
      return {
        success: false,
        endpoint: 'firestore',
        error: error instanceof Error ? error.message : 'Network error',
        retryable: true,
      };
    }
  }

  /**
   * Sync to Ford API endpoints
   */
  private async syncToFordAPI(payload: any): Promise<SyncResult> {
    try {
      // Ford requires two separate API calls: SURVEY_UPLOAD_V11 and VEHICLES_INSERT
      const surveyData = payload.surveyResponse;
      
      // First call: Survey upload
      const surveyResponse = await fetch(`${environment.apiUrl}/api/ford/survey-upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(surveyData.survey),
      });

      if (!surveyResponse.ok) {
        const errorText = await surveyResponse.text();
        return {
          success: false,
          endpoint: 'ford_api',
          error: `Survey upload failed: ${errorText}`,
          statusCode: surveyResponse.status,
          retryable: surveyResponse.status >= 500,
        };
      }

      // Second call: Vehicle data (if present)
      if (surveyData.vehicles && surveyData.vehicles.length > 0) {
        const vehicleResponse = await fetch(`${environment.apiUrl}/api/ford/vehicles-insert`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(surveyData.vehicles),
        });

        if (!vehicleResponse.ok) {
          const errorText = await vehicleResponse.text();
          return {
            success: false,
            endpoint: 'ford_api',
            error: `Vehicle insert failed: ${errorText}`,
            statusCode: vehicleResponse.status,
            retryable: vehicleResponse.status >= 500,
          };
        }
      }

      return {
        success: true,
        endpoint: 'ford_api',
        statusCode: 200,
      };
    } catch (error) {
      return {
        success: false,
        endpoint: 'ford_api',
        error: error instanceof Error ? error.message : 'Network error',
        retryable: true,
      };
    }
  }

  /**
   * Sync to Lincoln API endpoints
   */
  private async syncToLincolnAPI(payload: any): Promise<SyncResult> {
    try {
      // Lincoln requires three separate API calls
      const surveyData = payload.surveyResponse;
      
      // First call: Survey upload
      const surveyResponse = await fetch(`${environment.apiUrl}/api/lincoln/survey-upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(surveyData.survey),
      });

      if (!surveyResponse.ok) {
        const errorText = await surveyResponse.text();
        return {
          success: false,
          endpoint: 'lincoln_api',
          error: `Survey upload failed: ${errorText}`,
          statusCode: surveyResponse.status,
          retryable: surveyResponse.status >= 500,
        };
      }

      // Second call: Vehicles interested
      if (surveyData.vehiclesInterested && surveyData.vehiclesInterested.length > 0) {
        const interestedResponse = await fetch(`${environment.apiUrl}/api/lincoln/vehicles-interested`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(surveyData.vehiclesInterested),
        });

        if (!interestedResponse.ok) {
          const errorText = await interestedResponse.text();
          return {
            success: false,
            endpoint: 'lincoln_api',
            error: `Vehicles interested failed: ${errorText}`,
            statusCode: interestedResponse.status,
            retryable: interestedResponse.status >= 500,
          };
        }
      }

      // Third call: Vehicles driven
      if (surveyData.vehiclesDriven && surveyData.vehiclesDriven.length > 0) {
        const drivenResponse = await fetch(`${environment.apiUrl}/api/lincoln/vehicles-driven`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(surveyData.vehiclesDriven),
        });

        if (!drivenResponse.ok) {
          const errorText = await drivenResponse.text();
          return {
            success: false,
            endpoint: 'lincoln_api',
            error: `Vehicles driven failed: ${errorText}`,
            statusCode: drivenResponse.status,
            retryable: drivenResponse.status >= 500,
          };
        }
      }

      return {
        success: true,
        endpoint: 'lincoln_api',
        statusCode: 200,
      };
    } catch (error) {
      return {
        success: false,
        endpoint: 'lincoln_api',
        error: error instanceof Error ? error.message : 'Network error',
        retryable: true,
      };
    }
  }

  /**
   * Handle sync failure with retry logic
   */
  private async handleSyncFailure(item: SyncQueueItem, result: SyncResult): Promise<void> {
    if (!this.operations || !result.retryable || item.retry_count >= this.maxRetries) {
      // Maximum retries reached or non-retryable error
      await this.operations?.deleteSyncQueueItem(item.id);
      console.error(`Sync item ${item.id} failed permanently:`, result.error);
      return;
    }

    // Update retry count and last attempt time
    await this.operations.updateSyncQueueItem(item.id, {
      retry_count: item.retry_count + 1,
      last_attempt: Date.now(),
    });

    console.log(`Sync item ${item.id} will be retried (attempt ${item.retry_count + 1}/${this.maxRetries})`);
  }

  /**
   * Check if sync is needed and start if appropriate
   */
  private async checkAndSync(): Promise<void> {
    if (!this.operations || this.isSyncing) {
      return;
    }

    const pendingCount = await this.operations.getPendingSyncItemCount();
    if (pendingCount > 0) {
      console.log(`Found ${pendingCount} pending sync items, starting sync`);
      this.startSync();
    }
  }

  /**
   * Start background sync with interval
   */
  startBackgroundSync(intervalMs: number = 300000): void { // Default 5 minutes
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      this.checkAndSync();
    }, intervalMs);
  }

  /**
   * Stop background sync
   */
  stopBackgroundSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Get current sync queue status
   */
  async getSyncStatus(): Promise<{
    pendingCount: number;
    isSyncing: boolean;
    lastSync?: number;
  }> {
    if (!this.operations) {
      return { pendingCount: 0, isSyncing: false };
    }

    const pendingCount = await this.operations.getPendingSyncItemCount();
    
    return {
      pendingCount,
      isSyncing: this.isSyncing,
    };
  }

  /**
   * Clear all sync queue items (for debugging/cleanup)
   */
  async clearSyncQueue(): Promise<void> {
    if (!this.operations) {
      throw new Error('SyncManager not initialized');
    }

    await this.operations.clearSyncQueue();
  }

  /**
   * Set progress callback
   */
  setProgressCallback(callback: SyncProgressCallback): void {
    this.progressCallback = callback;
  }

  /**
   * Set completion callback
   */
  setCompletionCallback(callback: SyncCompletionCallback): void {
    this.completionCallback = callback;
  }

  /**
   * Update sync progress
   */
  private updateProgress(progress: SyncProgress): void {
    if (this.progressCallback) {
      this.progressCallback(progress);
    }
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopBackgroundSync();
    this.progressCallback = null;
    this.completionCallback = null;
  }
}

// Export singleton factory
export const createSyncManager = (dbService: DatabaseService): SyncManager => {
  return new SyncManager(dbService);
};
