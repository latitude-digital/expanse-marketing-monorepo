import React from 'react';
import { useSession } from './SessionProvider';

interface SessionStatusProps {
  className?: string;
  showDetails?: boolean;
}

export function SessionStatus({ className = '', showDetails = false }: SessionStatusProps) {
  const session = useSession();

  if (!session.isActive) {
    return null;
  }

  const formatTime = (seconds: number): string => {
    if (seconds <= 0) return '00:00';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDateTime = (date: Date): string => {
    return date.toLocaleTimeString();
  };

  return (
    <div className={`session-status ${className}`}>
      {showDetails && (
        <div className="text-xs text-gray-500 space-y-1">
          <div>Session expires in: {formatTime(session.secondsUntilExpiry)}</div>
          <div>Last activity: {formatDateTime(session.lastActivity)}</div>
          <button
            onClick={session.extendSession}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Extend Session
          </button>
        </div>
      )}
      
      {!showDetails && session.secondsUntilExpiry < 300 && ( // Show simple indicator when < 5 minutes
        <div className="flex items-center space-x-2 text-yellow-600">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 001.414-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
          <span className="text-sm">{formatTime(session.secondsUntilExpiry)}</span>
        </div>
      )}
    </div>
  );
}

export default SessionStatus;