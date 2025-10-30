import React from 'react';
import { Typography } from "@ui/ford-ui-components";
import { getOptionalText, isQuestionEffectivelyRequired } from './utils';

interface FDSRequiredIndicatorProps {
  question?: any; // SurveyJS question object to get locale
}

export const FDSRequiredIndicator: React.FC<FDSRequiredIndicatorProps> = ({ question }) => {
  if (question && isQuestionEffectivelyRequired(question)) {
    return null;
  }
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
