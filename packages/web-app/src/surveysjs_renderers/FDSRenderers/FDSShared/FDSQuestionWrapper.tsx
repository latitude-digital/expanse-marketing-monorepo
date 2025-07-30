import React from 'react';
import { Typography } from "@ui/ford-ui-components/src/v2/typography/Typography";
import { renderLabel, renderDescription, processMarkdown } from './utils';
import { FDSErrorDisplay } from './FDSErrorDisplay';
import { FDSRequiredIndicator } from './FDSRequiredIndicator';

interface FDSQuestionWrapperProps {
  label: string;
  description?: string;
  isRequired?: boolean;
  isInvalid?: boolean;
  errorMessage?: string;
  children: React.ReactNode;
  question?: any; // For getting survey locale if needed
}

export const FDSQuestionWrapper: React.FC<FDSQuestionWrapperProps> = ({
  label,
  description,
  isRequired = false,
  isInvalid = false,
  errorMessage,
  children,
  question
}) => {
  return (
    <div className="fds-question-wrapper">
      {/* Question Label - Match built-in Ford UI component styling */}
      <div className="fds-question-label" style={{ marginBottom: '8px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
        {(() => {
          const processedLabel = processMarkdown(label);
          const hasHtml = processedLabel.includes('<');
          
          if (hasHtml) {
            // For HTML content, use a span with Typography classes
            return (
              <span 
                className="text-ford-body2-regular"
                style={{ color: 'var(--semantic-color-text-onlight-moderate-default)' }}
                dangerouslySetInnerHTML={{ __html: processedLabel }}
              />
            );
          } else {
            // For plain text, use Typography component
            return (
              <Typography variant="body2" weight="regular" color="moderate">
                {processedLabel}
              </Typography>
            );
          }
        })()}
        {!isRequired && (
          <FDSRequiredIndicator question={question} />
        )}
      </div>

      {/* Question Description (optional) */}
      {description && (
        <div className="fds-question-description" style={{ marginBottom: '12px' }}>
          {(() => {
            const processedDescription = processMarkdown(description);
            const hasHtml = processedDescription.includes('<');
            
            if (hasHtml) {
              // For HTML content, use a span with Typography classes to match built-in Ford UI descriptions
              return (
                <span 
                  className="text-ford-body2-regular"
                  style={{ color: 'var(--semantic-color-text-onlight-subtle)' }}
                  dangerouslySetInnerHTML={{ __html: processedDescription }}
                />
              );
            } else {
              // For plain text, use Typography component to match built-in Ford UI descriptions
              return (
                <Typography variant="body2" color="subtle">
                  {processedDescription}
                </Typography>
              );
            }
          })()}
        </div>
      )}

      {/* Form Control (children) */}
      <div className="fds-question-control">
        {children}
      </div>

      {/* Error Message */}
      {isInvalid && errorMessage && (
        <div className="fds-question-error" style={{ marginTop: '8px' }}>
          <FDSErrorDisplay message={errorMessage} />
        </div>
      )}
    </div>
  );
};