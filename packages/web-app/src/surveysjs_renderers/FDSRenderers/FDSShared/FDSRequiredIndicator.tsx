import React from 'react';
import { getOptionalText } from './utils';

interface FDSRequiredIndicatorProps {
  question?: any; // SurveyJS question object to get locale
}

export const FDSRequiredIndicator: React.FC<FDSRequiredIndicatorProps> = ({ question }) => {
  const optionalText = question ? getOptionalText(question) : ' (Optional)';
  
  return (
    <span 
      className="fds-required-indicator"
      style={{
        marginLeft: '4px',
        fontSize: '14px',
        fontWeight: '400',
        color: 'var(--semantic-color-text-onlight-subtle-default)'
      }}
    >
      {optionalText}
    </span>
  );
};