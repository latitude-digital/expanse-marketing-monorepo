import React, { createContext, useContext, ReactNode } from 'react';
import { useSessionManager } from '../../hooks/useSessionManager';
import SessionWarningModal from './SessionWarningModal';

interface SessionContextType {
  isActive: boolean;
  lastActivity: Date;
  secondsUntilExpiry: number;
  extendSession: () => void;
  resetTimer: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}

interface SessionProviderProps {
  children: ReactNode;
  timeoutMinutes?: number;
  warningMinutes?: number;
  disableOnRoutes?: string[];
}

export function SessionProvider({ 
  children, 
  timeoutMinutes,
  warningMinutes,
  disableOnRoutes
}: SessionProviderProps) {
  const sessionManager = useSessionManager({
    timeoutMinutes,
    warningMinutes,
    disableOnRoutes
  });

  const contextValue: SessionContextType = {
    isActive: sessionManager.isActive,
    lastActivity: sessionManager.lastActivity,
    secondsUntilExpiry: sessionManager.secondsUntilExpiry,
    extendSession: sessionManager.extendSession,
    resetTimer: sessionManager.resetTimer
  };

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
      
      {/* Session Warning Modal */}
      <SessionWarningModal
        isVisible={sessionManager.showWarning}
        secondsUntilExpiry={sessionManager.secondsUntilExpiry}
        onExtendSession={sessionManager.extendSession}
        onClose={() => {
          // User chose to ignore warning - they'll be logged out when timer expires
        }}
      />
    </SessionContext.Provider>
  );
}

export default SessionProvider;