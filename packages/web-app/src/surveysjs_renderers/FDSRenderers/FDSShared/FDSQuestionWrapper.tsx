import React from 'react';
import { renderLabel, renderDescription } from './utils';
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
      {/* Question Label */}
      <div className="fds-question-label" style={{
        marginBottom: '8px',
        fontSize: '16px',
        fontWeight: '600',
        lineHeight: '1.4',
        color: 'var(--semantic-color-text-onlight-moderate-default)'
      }}>
        {renderLabel(label)}
        {!isRequired && (
          <FDSRequiredIndicator question={question} />
        )}
      </div>

      {/* Question Description (optional) */}
      {description && (
        <div className="fds-question-description" style={{
          marginBottom: '12px',
          fontSize: '14px',
          lineHeight: '1.5',
          color: 'var(--semantic-color-text-onlight-subtle-default)'
        }}>
          {renderDescription(description)}
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