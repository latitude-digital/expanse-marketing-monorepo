/**
 * Native Places API Bridge
 *
 * Provides a seamless interface to use Google Places API through the native app's
 * bridge when running in a React Native WebView, falling back to direct Google API
 * when running in a regular browser.
 */

import type {
  WebViewToNativeMessage,
  NativeToWebViewMessage,
} from '@meridian-event-tech/shared/types';

type PlacesPrediction = {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
};

type PlaceDetails = {
  placeId: string;
  formattedAddress: string;
  addressComponents: Array<{
    longName: string;
    shortName: string;
    types: string[];
  }>;
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
};

type PendingRequest = {
  resolve: (value: any) => void;
  reject: (error: Error) => void;
};

class NativePlacesApi {
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private sessionToken: string = this.generateSessionToken();
  private isNative: boolean = false;

  constructor() {
    // Detect if running in React Native WebView
    this.isNative = !!(window as any).ReactNativeWebView;

    if (this.isNative) {
      // Listen for messages from native
      window.addEventListener('message', this.handleNativeMessage);
    }
  }

  /**
   * Generate a unique session token for billing optimization
   */
  private generateSessionToken(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate a unique request ID
   */
  private generateRequestId(): string {
    return `places_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Handle messages from the native app
   */
  private handleNativeMessage = (event: MessageEvent) => {
    try {
      // Parse the message data
      const message: NativeToWebViewMessage =
        typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

      // Only handle PLACES_* messages, silently ignore others
      if (!message.type || !message.type.startsWith('PLACES_')) {
        return;
      }

      switch (message.type) {
        case 'PLACES_AUTOCOMPLETE_RESULT': {
          const pending = this.pendingRequests.get(message.payload.requestId);
          if (pending) {
            pending.resolve(message.payload.predictions);
            this.pendingRequests.delete(message.payload.requestId);
          }
          break;
        }

        case 'PLACES_DETAILS_RESULT': {
          const pending = this.pendingRequests.get(message.payload.requestId);
          if (pending) {
            pending.resolve(message.payload.details);
            this.pendingRequests.delete(message.payload.requestId);
          }
          break;
        }

        case 'PLACES_ERROR': {
          const pending = this.pendingRequests.get(message.payload.requestId);
          if (pending) {
            pending.reject(new Error(message.payload.error));
            this.pendingRequests.delete(message.payload.requestId);
          }
          break;
        }
      }
    } catch (error) {
      // Silently ignore parsing errors for non-Places messages
      // Only log if it's actually a Places message that failed
      if (typeof event.data === 'string' && event.data.includes('PLACES_')) {
        console.error('[NativePlacesApi] Error handling message:', error);
      }
    }
  };

  /**
   * Send a message to the native app
   */
  private sendToNative(message: WebViewToNativeMessage): void {
    if ((window as any).ReactNativeWebView) {
      (window as any).ReactNativeWebView.postMessage(JSON.stringify(message));
    }
  }

  /**
   * Get autocomplete predictions for an input string
   */
  async getAutocompletePredictions(input: string): Promise<PlacesPrediction[]> {
    if (!this.isNative) {
      // Fallback to Google Places API if not in native WebView
      return this.getAutocompletePredictionsGoogle(input);
    }

    const requestId = this.generateRequestId();

    return new Promise((resolve, reject) => {
      // Store the promise callbacks
      this.pendingRequests.set(requestId, { resolve, reject });

      // Send request to native
      this.sendToNative({
        type: 'PLACES_AUTOCOMPLETE_REQUEST',
        payload: {
          requestId,
          input,
          sessionToken: this.sessionToken,
        },
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          reject(new Error('Request timeout'));
        }
      }, 10000);
    });
  }

  /**
   * Get place details for a place ID
   */
  async getPlaceDetails(placeId: string): Promise<PlaceDetails> {
    if (!this.isNative) {
      // Fallback to Google Places API if not in native WebView
      return this.getPlaceDetailsGoogle(placeId);
    }

    const requestId = this.generateRequestId();

    return new Promise((resolve, reject) => {
      // Store the promise callbacks
      this.pendingRequests.set(requestId, { resolve, reject });

      // Send request to native
      this.sendToNative({
        type: 'PLACES_DETAILS_REQUEST',
        payload: {
          requestId,
          placeId,
          sessionToken: this.sessionToken,
        },
      });

      // Generate a new session token for the next autocomplete search
      // (according to Google Places API billing best practices)
      this.sessionToken = this.generateSessionToken();

      // Timeout after 10 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          reject(new Error('Request timeout'));
        }
      }, 10000);
    });
  }

  /**
   * Fallback: Get autocomplete predictions using Google Places API directly
   * (for when running in a regular browser)
   */
  private async getAutocompletePredictionsGoogle(input: string): Promise<PlacesPrediction[]> {
    // Check if Google Places API is loaded
    if (typeof google === 'undefined' || !google.maps?.places) {
      console.warn('[NativePlacesApi] Google Places API not loaded');
      return [];
    }

    const service = new google.maps.places.AutocompleteService();

    return new Promise((resolve, reject) => {
      service.getPlacePredictions(
        {
          input,
          types: ['address'],
          sessionToken: new google.maps.places.AutocompleteSessionToken(),
        },
        (predictions, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            resolve(
              predictions.map((p) => ({
                placeId: p.place_id,
                description: p.description,
                mainText: p.structured_formatting.main_text,
                secondaryText: p.structured_formatting.secondary_text || '',
              }))
            );
          } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            resolve([]);
          } else {
            reject(new Error(`Google Places API error: ${status}`));
          }
        }
      );
    });
  }

  /**
   * Fallback: Get place details using Google Places API directly
   * (for when running in a regular browser)
   */
  private async getPlaceDetailsGoogle(placeId: string): Promise<PlaceDetails> {
    // Check if Google Places API is loaded
    if (typeof google === 'undefined' || !google.maps?.places) {
      throw new Error('Google Places API not loaded');
    }

    // Create a temporary div for PlacesService
    const div = document.createElement('div');
    const service = new google.maps.places.PlacesService(div);

    return new Promise((resolve, reject) => {
      service.getDetails(
        {
          placeId,
          fields: ['place_id', 'formatted_address', 'address_components', 'geometry'],
        },
        (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place) {
            resolve({
              placeId: place.place_id || placeId,
              formattedAddress: place.formatted_address || '',
              addressComponents: (place.address_components || []).map((component) => ({
                longName: component.long_name,
                shortName: component.short_name,
                types: component.types,
              })),
              geometry: place.geometry?.location
                ? {
                    location: {
                      lat: place.geometry.location.lat(),
                      lng: place.geometry.location.lng(),
                    },
                  }
                : undefined,
            });
          } else {
            reject(new Error(`Google Places API error: ${status}`));
          }
        }
      );
    });
  }

  /**
   * Check if running in native WebView
   */
  isRunningInNative(): boolean {
    return this.isNative;
  }
}

// Export singleton instance
export const nativePlacesApi = new NativePlacesApi();
