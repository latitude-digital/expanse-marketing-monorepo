import React from 'react';
import { useSession } from '../auth/SessionProvider';

// Development-only component for testing session functionality
export function SessionTestControls() {
  const session = useSession();

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-4 border border-gray-200 text-sm z-50">
      <div className="font-semibold text-gray-700 mb-2">
        Session Debug (Dev Only)
      </div>
      
      {session.isActive ? (
        <div className="space-y-2">
          <div className="text-gray-600">
            <span className="font-medium">Status:</span> Active
          </div>
          <div className="text-gray-600">
            <span className="font-medium">Time remaining:</span> {formatTime(session.secondsUntilExpiry)}
          </div>
          <div className="text-gray-600">
            <span className="font-medium">Last activity:</span> {session.lastActivity.toLocaleTimeString()}
          </div>
          
          <div className="flex space-x-2 pt-2">
            <button
              onClick={session.extendSession}
              className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
            >
              Extend
            </button>
            <button
              onClick={session.resetTimer}
              className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
            >
              Reset
            </button>
          </div>
        </div>
      ) : (
        <div className="text-gray-500">
          Session inactive
        </div>
      )}
    </div>
  );
}

export default SessionTestControls;