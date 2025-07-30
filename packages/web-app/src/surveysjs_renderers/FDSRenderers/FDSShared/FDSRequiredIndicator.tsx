import React from 'react';
import { Typography } from "@ui/ford-ui-components/src/v2/typography/Typography";
import { getOptionalText } from './utils';

interface FDSRequiredIndicatorProps {
  question?: any; // SurveyJS question object to get locale
}

export const FDSRequiredIndicator: React.FC<FDSRequiredIndicatorProps> = ({ question }) => {
  const optionalText = question ? getOptionalText(question) : ' (Optional)';
  
  return (
    <span 
      className="fds-required-indicator"
      style={{ marginLeft: '4px' }}
    >
      <Typography variant="body2" color="subtle" weight="regular">
        {optionalText}
      </Typography>
    </span>
  );
};