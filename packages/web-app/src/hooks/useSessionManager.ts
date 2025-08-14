import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getSessionTimeout, isDisabledRoute, getDisabledRoutes } from '../config/sessionConfig';

interface SessionConfig {
  timeoutMinutes: number;
  warningMinutes: number;
  checkIntervalMs: number;
  disableOnRoutes: string[];
}

interface SessionState {
  isActive: boolean;
  showWarning: boolean;
  secondsUntilExpiry: number;
  lastActivity: Date;
}

const DEFAULT_CONFIG: SessionConfig = {
  timeoutMinutes: getSessionTimeout(),
  warningMinutes: 1, // Show warning 1 minute before timeout
  checkIntervalMs: 1000, // Check every second
  disableOnRoutes: getDisabledRoutes()
};

const ACTIVITY_EVENTS = [
  'mousedown',
  'mousemove',
  'keypress',
  'scroll',
  'touchstart',
  'click'
] as const;

// Storage keys for cross-tab communication
const STORAGE_KEYS = {
  LAST_ACTIVITY: 'session_last_activity',
  FORCE_LOGOUT: 'session_force_logout'
} as const;

export function useSessionManager(config: Partial<SessionConfig> = {}) {
  const fullConfig = { 
    ...DEFAULT_CONFIG, 
    ...config,
    disableOnRoutes: config.disableOnRoutes || DEFAULT_CONFIG.disableOnRoutes
  };
  const { currentUser, signOut } = useAuth();
  const [sessionState, setSessionState] = useState<SessionState>({
    isActive: false,
    showWarning: false,
    secondsUntilExpiry: fullConfig.timeoutMinutes * 60,
    lastActivity: new Date()
  });

  const lastActivityRef = useRef<Date>(new Date());
  const checkIntervalRef = useRef<NodeJS.Timeout>();
  const isDisabledRef = useRef(false);

  // Update route-based disable status
  const updateDisableStatus = useCallback(() => {
    const currentPath = window.location.pathname;
    isDisabledRef.current = isDisabledRoute(currentPath) || 
      (fullConfig.disableOnRoutes || []).some(route => currentPath.startsWith(route));
  }, [fullConfig.disableOnRoutes]);

  // Cross-tab activity synchronization
  const syncActivityAcrossTabs = useCallback((timestamp: string) => {
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, timestamp);
    } catch (error) {
      console.warn('Failed to sync activity across tabs:', error);
    }
  }, []);

  const broadcastLogout = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.FORCE_LOGOUT, Date.now().toString());
    } catch (error) {
      console.warn('Failed to broadcast logout:', error);
    }
  }, []);

  // Record user activity
  const recordActivity = useCallback(() => {
    if (isDisabledRef.current || !currentUser) return;
    
    const now = new Date();
    lastActivityRef.current = now;
    
    // Sync activity across tabs
    syncActivityAcrossTabs(now.toISOString());
    
    setSessionState(prev => ({
      ...prev,
      lastActivity: now,
      showWarning: false
    }));
  }, [currentUser, syncActivityAcrossTabs]);

  // Reset session timer
  const resetTimer = useCallback(() => {
    if (isDisabledRef.current || !currentUser) return;
    
    recordActivity();
    
    setSessionState(prev => ({
      ...prev,
      secondsUntilExpiry: fullConfig.timeoutMinutes * 60,
      showWarning: false
    }));
  }, [fullConfig.timeoutMinutes, currentUser, recordActivity]);

  // Force logout
  const forceLogout = useCallback(async () => {
    try {
      // Broadcast logout to all tabs first
      broadcastLogout();
      await signOut();
    } catch (error) {
      console.error('Session timeout logout error:', error);
      // Even if logout fails, redirect to login
      window.location.href = '/login';
    }
  }, [signOut, broadcastLogout]);

  // Extend session
  const extendSession = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  // Check session status
  const checkSession = useCallback(() => {
    if (isDisabledRef.current || !currentUser) {
      setSessionState(prev => ({ ...prev, isActive: false, showWarning: false }));
      return;
    }

    const now = new Date();
    const timeSinceActivity = (now.getTime() - lastActivityRef.current.getTime()) / 1000;
    const timeoutSeconds = fullConfig.timeoutMinutes * 60;
    const warningSeconds = fullConfig.warningMinutes * 60;
    
    const secondsUntilExpiry = Math.max(0, timeoutSeconds - timeSinceActivity);
    const shouldShowWarning = secondsUntilExpiry <= warningSeconds && secondsUntilExpiry > 0;
    
    setSessionState(prev => ({
      ...prev,
      isActive: true,
      secondsUntilExpiry: Math.ceil(secondsUntilExpiry),
      showWarning: shouldShowWarning
    }));

    // Auto-logout when time expires
    if (secondsUntilExpiry <= 0) {
      forceLogout();
    }
  }, [currentUser, fullConfig.timeoutMinutes, fullConfig.warningMinutes, forceLogout]);

  // Initialize session monitoring
  useEffect(() => {
    if (!currentUser) {
      // Clear any existing intervals when user logs out
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      setSessionState(prev => ({ ...prev, isActive: false, showWarning: false }));
      return;
    }

    // Update disable status on route changes
    updateDisableStatus();
    
    // Reset timer when user logs in or component mounts
    resetTimer();

    // Set up activity listeners
    const addActivityListeners = () => {
      ACTIVITY_EVENTS.forEach(event => {
        document.addEventListener(event, recordActivity, { passive: true });
      });
    };

    const removeActivityListeners = () => {
      ACTIVITY_EVENTS.forEach(event => {
        document.removeEventListener(event, recordActivity);
      });
    };

    // Cross-tab communication handler
    const handleStorageChange = (event: StorageEvent) => {
      if (!event.key || !currentUser) return;

      if (event.key === STORAGE_KEYS.LAST_ACTIVITY && event.newValue) {
        try {
          const activityTime = new Date(event.newValue);
          if (activityTime > lastActivityRef.current) {
            lastActivityRef.current = activityTime;
            setSessionState(prev => ({
              ...prev,
              lastActivity: activityTime,
              showWarning: false
            }));
          }
        } catch (error) {
          console.warn('Failed to parse cross-tab activity time:', error);
        }
      } else if (event.key === STORAGE_KEYS.FORCE_LOGOUT && event.newValue) {
        // Another tab initiated logout
        forceLogout();
      }
    };

    // Start monitoring
    addActivityListeners();
    window.addEventListener('storage', handleStorageChange);
    checkIntervalRef.current = setInterval(checkSession, fullConfig.checkIntervalMs);

    return () => {
      removeActivityListeners();
      window.removeEventListener('storage', handleStorageChange);
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [currentUser, checkSession, recordActivity, resetTimer, updateDisableStatus, fullConfig.checkIntervalMs, forceLogout]);

  // Handle route changes
  useEffect(() => {
    updateDisableStatus();
    if (!isDisabledRef.current && currentUser) {
      resetTimer();
    }
  }, [updateDisableStatus, resetTimer, currentUser]);

  return {
    ...sessionState,
    extendSession,
    resetTimer,
    config: fullConfig
  };
}