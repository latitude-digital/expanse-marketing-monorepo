/**
 * Google Places API Service
 *
 * Handles autocomplete and place details lookups using Google Places API REST endpoints.
 * Used by the WebView bridge to provide address autocomplete functionality
 * to the survey forms without exposing the API key to the web content.
 */

import Constants from 'expo-constants';
import { locationManager } from './location-manager';

// Get the Google Maps API key from app config
const getApiKey = (): string => {
  // In production builds, expoConfig.ios.config may not be available
  // Use extra.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY which is accessible at runtime
  let apiKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Fallback for development
  if (!apiKey && Constants.expoConfig?.ios?.config?.googleMapsApiKey) {
    apiKey = Constants.expoConfig.ios.config.googleMapsApiKey;
  }

  if (!apiKey) {
    console.error('[PlacesApiService] API key sources checked:', {
      'extra.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY': Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
      'ios.config.googleMapsApiKey': Constants.expoConfig?.ios?.config?.googleMapsApiKey,
      'full expoConfig': Constants.expoConfig
    });
    throw new Error('Google Maps API key not configured');
  }

  return apiKey;
};

// Get the iOS bundle identifier
const getBundleId = (): string => {
  // In production, Constants.expoConfig may not be available
  // Use Constants.manifest2 or Application.applicationId instead
  let bundleId = Constants.expoConfig?.ios?.bundleIdentifier;

  // Fallback: try manifest (legacy)
  if (!bundleId && Constants.manifest?.ios?.bundleIdentifier) {
    bundleId = Constants.manifest.ios.bundleIdentifier;
  }

  // Fallback: try manifest2 (EAS updates)
  if (!bundleId && Constants.manifest2?.extra?.expoClient?.ios?.bundleIdentifier) {
    bundleId = Constants.manifest2.extra.expoClient.ios.bundleIdentifier;
  }

  // Fallback: hardcode based on environment (last resort)
  if (!bundleId) {
    // Check if this is staging or production based on other indicators
    const appName = Constants.expoConfig?.name || Constants.manifest?.name || '';
    bundleId = appName.includes('Staging')
      ? 'com.meridianeventtech.app.staging'
      : 'com.meridianeventtech.app';
    console.warn('[PlacesApiService] Using fallback bundle ID:', bundleId);
  }

  console.log('[PlacesApiService] Bundle ID resolved to:', bundleId);
  return bundleId;
};

// Google Places API (New) endpoints
const AUTOCOMPLETE_URL = 'https://places.googleapis.com/v1/places:autocomplete';
const PLACE_DETAILS_URL = 'https://places.googleapis.com/v1/places';

export interface PlacesPrediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

export interface PlaceDetails {
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
}

class PlacesApiService {
  /**
   * Get autocomplete predictions for an input string
   */
  async getAutocompletePredictions(
    input: string,
    sessionToken?: string
  ): Promise<PlacesPrediction[]> {
    try {
      const apiKey = getApiKey();

      // Log API key for debugging (first 10 chars only for security)
      console.log('[PlacesApiService] Using API key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NONE');
      console.log('[PlacesApiService] Full config:', Constants.expoConfig?.ios?.config);

      // Build request body for Places API (New)
      const requestBody: any = {
        input,
        includedPrimaryTypes: ['street_address', 'premise'],
        // Include US region bias
        regionCode: 'US',
      };

      // Get location from location manager
      const currentLocation = locationManager.getLocation();

      // Add location bias if we have current location
      if (currentLocation) {
        requestBody.locationBias = {
          circle: {
            center: {
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            },
            // 50km radius for location bias
            radius: 50000.0,
          },
        };
        console.log('[PlacesApiService] Using location bias:', {
          lat: currentLocation.latitude,
          lng: currentLocation.longitude,
          age: Date.now() - currentLocation.timestamp,
        });
      } else {
        console.log('[PlacesApiService] No location available for bias');
      }

      if (sessionToken) {
        requestBody.sessionToken = sessionToken;
      }

      console.log('[PlacesApiService] Request URL:', AUTOCOMPLETE_URL);
      console.log('[PlacesApiService] Request body:', requestBody);

      const bundleId = getBundleId();
      console.log('[PlacesApiService] Using bundle ID:', bundleId);

      const response = await fetch(AUTOCOMPLETE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Ios-Bundle-Identifier': bundleId,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[PlacesApiService] HTTP error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      console.log('[PlacesApiService] Response:', data);

      // Map the predictions to our simplified format
      // The new API returns suggestions array instead of predictions
      const suggestions = data.suggestions || [];
      return suggestions
        .filter((suggestion: any) => suggestion.placePrediction)
        .map((suggestion: any) => {
          const prediction = suggestion.placePrediction;
          return {
            placeId: prediction.placeId || prediction.place,
            description: prediction.text?.text || '',
            mainText: prediction.structuredFormat?.mainText?.text || prediction.text?.text || '',
            secondaryText: prediction.structuredFormat?.secondaryText?.text || '',
          };
        });
    } catch (error) {
      console.error('[PlacesApiService] Autocomplete error:', error);
      throw error;
    }
  }

  /**
   * Get detailed information about a place
   */
  async getPlaceDetails(
    placeId: string,
    sessionToken?: string
  ): Promise<PlaceDetails> {
    try {
      const apiKey = getApiKey();

      console.log('[PlacesApiService] Place details - Using API key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NONE');
      console.log('[PlacesApiService] Place ID:', placeId);

      // Build URL for Places API (New) - using field mask to specify what we want
      const url = `${PLACE_DETAILS_URL}/${placeId}`;
      const fieldMask = 'id,formattedAddress,addressComponents,location';

      console.log('[PlacesApiService] Place details URL:', url);

      const bundleId = getBundleId();
      console.log('[PlacesApiService] Place details - Using bundle ID:', bundleId);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': fieldMask,
          'X-Ios-Bundle-Identifier': bundleId,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[PlacesApiService] Place details HTTP error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      console.log('[PlacesApiService] Place details response:', data);

      // Map the new API response to our format
      return {
        placeId: data.id || placeId,
        formattedAddress: data.formattedAddress || '',
        addressComponents: (data.addressComponents || []).map((component: any) => ({
          longName: component.longText || '',
          shortName: component.shortText || '',
          types: component.types || [],
        })),
        geometry: data.location
          ? {
              location: {
                lat: data.location.latitude,
                lng: data.location.longitude,
              },
            }
          : undefined,
      };
    } catch (error) {
      console.error('[PlacesApiService] Place details error:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const placesApiService = new PlacesApiService();
