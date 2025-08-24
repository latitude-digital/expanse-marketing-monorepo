/**
 * AuthAlert Component - Reusable Alert/Notification for Auth Flows (AUTH-013)
 * 
 * This component provides consistent success/error/info messaging for authentication flows
 * with WCAG AA accessibility compliance and responsive design.
 */
import React from 'react';

export type AlertType = 'success' | 'error' | 'info' | 'warning';

interface AuthAlertProps {
  type: AlertType;
  title?: string;
  message: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

const AuthAlert: React.FC<AuthAlertProps> = ({
  type,
  title,
  message,
  dismissible = false,
  onDismiss,
  className = ''
}) => {
  const getTypeStyles = (alertType: AlertType) => {
    switch (alertType) {
      case 'success':
        return {
          container: 'bg-green-50 border-green-400 text-green-800',
          icon: 'text-green-800',
          iconPath: (
            <path 
              fillRule="evenodd" 
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
              clipRule="evenodd" 
            />
          )
        };
      case 'error':
        return {
          container: 'bg-red-50 border-red-400 text-red-800',
          icon: 'text-red-800',
          iconPath: (
            <path 
              fillRule="evenodd" 
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
              clipRule="evenodd" 
            />
          )
        };
      case 'warning':
        return {
          container: 'bg-yellow-50 border-yellow-400 text-yellow-800',
          icon: 'text-yellow-800',
          iconPath: (
            <path 
              fillRule="evenodd" 
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" 
              clipRule="evenodd" 
            />
          )
        };
      case 'info':
        return {
          container: 'bg-blue-50 border-blue-400 text-blue-800',
          icon: 'text-blue-800',
          iconPath: (
            <path 
              fillRule="evenodd" 
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" 
              clipRule="evenodd" 
            />
          )
        };
      default:
        return {
          container: 'bg-gray-50 border-gray-400 text-gray-800',
          icon: 'text-gray-800',
          iconPath: (
            <path 
              fillRule="evenodd" 
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" 
              clipRule="evenodd" 
            />
          )
        };
    }
  };

  const styles = getTypeStyles(type);
  const ariaLive = type === 'error' ? 'assertive' : 'polite';

  return (
    <div 
      className={`mb-4 sm:mb-6 p-3 sm:p-4 border-2 rounded-md text-sm sm:text-base ${styles.container} ${className}`}
      role="alert"
      aria-live={ariaLive}
      aria-atomic="true"
    >
      <div className="flex items-start">
        <svg 
          className={`w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 mt-0.5 flex-shrink-0 ${styles.icon}`}
          fill="currentColor" 
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          {styles.iconPath}
        </svg>
        <div className="flex-1">
          {title && (
            <strong className="font-semibold block mb-1">
              {title}
            </strong>
          )}
          <div className="leading-relaxed">
            {message}
          </div>
        </div>
        {dismissible && onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className={`ml-3 flex-shrink-0 p-1 rounded-md transition-colors duration-200 hover:bg-black hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current ${styles.icon}`}
            aria-label="Dismiss alert"
          >
            <svg 
              className="w-4 h-4" 
              fill="currentColor" 
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path 
                fillRule="evenodd" 
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" 
                clipRule="evenodd" 
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default AuthAlert;