import React from 'react';

interface FDSErrorDisplayProps {
  message: string;
}

export const FDSErrorDisplay: React.FC<FDSErrorDisplayProps> = ({ message }) => {
  return (
    <div className="fds-error-display" style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '8px',
      fontSize: '14px',
      lineHeight: '1.4',
      color: 'var(--semantic-color-text-onlight-danger-default)'
    }}>
      {/* Error Icon */}
      <span 
        className="fds-error-icon"
        style={{
          minWidth: '16px',
          height: '16px',
          marginTop: '2px',
          color: 'var(--semantic-color-text-onlight-danger-default)'
        }}
      >
        ⚠️
      </span>
      
      {/* Error Message */}
      <span className="fds-error-message">
        {message}
      </span>
    </div>
  );
};