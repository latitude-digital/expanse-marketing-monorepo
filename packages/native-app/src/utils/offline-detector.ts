import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { environment } from '../config/environment';

export type NetworkState = {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: string;
  isWifi: boolean;
  isCellular: boolean;
};

export type ConnectivityListener = (networkState: NetworkState) => void;

export class OfflineDetector {
  private static instance: OfflineDetector;
  private listeners: Set<ConnectivityListener> = new Set();
  private currentState: NetworkState = {
    isConnected: false,
    isInternetReachable: false,
    type: 'unknown',
    isWifi: false,
    isCellular: false,
  };
  private unsubscribe: (() => void) | null = null;

  constructor() {
    if (OfflineDetector.instance) {
      return OfflineDetector.instance;
    }
    OfflineDetector.instance = this;
    this.initialize();
  }

  /**
   * Initialize network state monitoring
   */
  private async initialize(): Promise<void> {
    try {
      // Get initial network state
      const initialState = await NetInfo.fetch();
      this.updateNetworkState(initialState);

      // Subscribe to network state changes
      this.unsubscribe = NetInfo.addEventListener((state) => {
        this.updateNetworkState(state);
      });
    } catch (error) {
      console.error('Failed to initialize network monitoring:', error);
    }
  }

  /**
   * Update internal network state and notify listeners
   */
  private updateNetworkState(netInfoState: NetInfoState): void {
    const networkState: NetworkState = {
      isConnected: netInfoState.isConnected || false,
      isInternetReachable: netInfoState.isInternetReachable || false,
      type: netInfoState.type || 'unknown',
      isWifi: netInfoState.type === 'wifi',
      isCellular: netInfoState.type === 'cellular',
    };

    // Only notify if state actually changed
    if (this.hasStateChanged(networkState)) {
      this.currentState = networkState;
      this.notifyListeners(networkState);
    }
  }

  /**
   * Check if network state has meaningfully changed
   */
  private hasStateChanged(newState: NetworkState): boolean {
    return (
      this.currentState.isConnected !== newState.isConnected ||
      this.currentState.isInternetReachable !== newState.isInternetReachable ||
      this.currentState.type !== newState.type
    );
  }

  /**
   * Notify all registered listeners of state change
   */
  private notifyListeners(networkState: NetworkState): void {
    this.listeners.forEach((listener) => {
      try {
        listener(networkState);
      } catch (error) {
        console.error('Error in connectivity listener:', error);
      }
    });
  }

  /**
   * Get current network state
   */
  getCurrentState(): NetworkState {
    return { ...this.currentState };
  }

  /**
   * Check if device is online with internet access
   */
  isOnline(): boolean {
    return this.currentState.isConnected && this.currentState.isInternetReachable;
  }

  /**
   * Check if device is offline
   */
  isOffline(): boolean {
    return !this.isOnline();
  }

  /**
   * Check if connected via WiFi
   */
  isWifiConnected(): boolean {
    return this.currentState.isWifi && this.isOnline();
  }

  /**
   * Check if connected via cellular
   */
  isCellularConnected(): boolean {
    return this.currentState.isCellular && this.isOnline();
  }

  /**
   * Check if current connection is suitable for syncing
   * Based on environment settings for sync preferences
   */
  isSyncable(): boolean {
    if (!this.isOnline()) {
      return false;
    }

    // If environment specifies wifi-only sync, check for wifi
    // WiFi-only mode not available in current config
    // if (environment.sync?.wifiOnly) {
    //   return this.isWifiConnected();
    // }

    return true;
  }

  /**
   * Subscribe to connectivity changes
   */
  addListener(listener: ConnectivityListener): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Remove a specific listener
   */
  removeListener(listener: ConnectivityListener): void {
    this.listeners.delete(listener);
  }

  /**
   * Remove all listeners
   */
  removeAllListeners(): void {
    this.listeners.clear();
  }

  /**
   * Force refresh network state
   */
  async refresh(): Promise<NetworkState> {
    try {
      const state = await NetInfo.fetch();
      this.updateNetworkState(state);
      return this.getCurrentState();
    } catch (error) {
      console.error('Failed to refresh network state:', error);
      return this.getCurrentState();
    }
  }

  /**
   * Test connectivity to a specific URL
   */
  async testConnectivity(url?: string): Promise<boolean> {
    const testUrl = url || environment.apiUrl || 'https://www.google.com';
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(testUrl, {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.error('Connectivity test failed:', error);
      return false;
    }
  }

  /**
   * Get connection quality estimate based on type
   */
  getConnectionQuality(): 'excellent' | 'good' | 'fair' | 'poor' | 'unknown' {
    if (!this.isOnline()) {
      return 'poor';
    }

    switch (this.currentState.type) {
      case 'wifi':
        return 'excellent';
      case 'cellular':
        // Could be enhanced with signal strength if available
        return 'good';
      case 'ethernet':
        return 'excellent';
      case 'bluetooth':
        return 'fair';
      default:
        return 'unknown';
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.removeAllListeners();
  }
}

// Export singleton instance
export const offlineDetector = new OfflineDetector();