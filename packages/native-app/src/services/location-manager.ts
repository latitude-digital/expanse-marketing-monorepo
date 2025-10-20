/**
 * Location Manager Service
 *
 * Manages device location for the app.
 * - Fetches location once at app startup
 * - Caches location for the session
 * - Persists to storage for next launch
 * - Refreshes daily
 */

import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCATION_STORAGE_KEY = '@location_cache';
const LOCATION_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface CachedLocation {
  latitude: number;
  longitude: number;
  timestamp: number;
}

class LocationManager {
  private currentLocation: CachedLocation | null = null;
  private initializationPromise: Promise<void> | null = null;

  /**
   * Initialize location - call this at app startup
   */
  async initialize(): Promise<void> {
    // If already initializing, wait for that to complete
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this._initialize();
    return this.initializationPromise;
  }

  private async _initialize(): Promise<void> {
    try {
      console.log('[LocationManager] Initializing...');

      // First, try to load cached location from storage
      const cached = await this.loadCachedLocation();
      if (cached && this.isLocationFresh(cached)) {
        console.log('[LocationManager] Using cached location from storage');
        this.currentLocation = cached;
        return;
      }

      // If no fresh cached location, request new one
      console.log('[LocationManager] Requesting new location...');
      await this.updateLocation();
    } catch (error) {
      console.error('[LocationManager] Initialization error:', error);
    }
  }

  /**
   * Load cached location from AsyncStorage
   */
  private async loadCachedLocation(): Promise<CachedLocation | null> {
    try {
      const stored = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
      if (!stored) return null;

      const parsed = JSON.parse(stored) as CachedLocation;
      console.log('[LocationManager] Loaded cached location:', {
        lat: parsed.latitude,
        lng: parsed.longitude,
        age: Date.now() - parsed.timestamp,
      });

      return parsed;
    } catch (error) {
      console.warn('[LocationManager] Failed to load cached location:', error);
      return null;
    }
  }

  /**
   * Check if cached location is still fresh (< 24 hours old)
   */
  private isLocationFresh(location: CachedLocation): boolean {
    const age = Date.now() - location.timestamp;
    return age < LOCATION_MAX_AGE_MS;
  }

  /**
   * Update the current location by fetching from device
   */
  private async updateLocation(): Promise<void> {
    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        console.log('[LocationManager] Location permission not granted');
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const cached: CachedLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: Date.now(),
      };

      this.currentLocation = cached;

      // Persist to storage
      await AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(cached));

      console.log('[LocationManager] Location updated and cached:', {
        lat: cached.latitude,
        lng: cached.longitude,
      });
    } catch (error) {
      console.warn('[LocationManager] Failed to get location:', error);
    }
  }

  /**
   * Get the current cached location
   */
  getLocation(): CachedLocation | null {
    return this.currentLocation;
  }

  /**
   * Force refresh the location (can be called manually if needed)
   */
  async refresh(): Promise<void> {
    console.log('[LocationManager] Manual refresh requested');
    await this.updateLocation();
  }
}

// Export singleton instance
export const locationManager = new LocationManager();
