import React from 'react';
import { Typography } from "@ui/ford-ui-components";
import { renderLabel, renderDescription, processMarkdown, getOptionalText, renderQuestionDescription } from './utils';
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
  
  // Check if title and description should be hidden
  const isTitleHidden = question?.titleLocation === "hidden";
  
  // Check description location setting - similar to RadioButtonButton renderer
  const showDescriptionAbove = !question?.descriptionLocation || question.descriptionLocation !== "underInput";

  // Enhanced required detection: Check both isRequired prop and validators for expression validators with "notempty"
  const isActuallyRequired = isRequired || (question?.validators && question.validators.some((validator: any) => 
    validator.type === 'expression' && validator.expression?.includes('notempty')
  ));

  // Get the optional text and append it to the label if not required (similar to how StyledTextField works)
  const optionalText = !isActuallyRequired && question ? getOptionalText(question) : '';
  const labelWithOptional = label + optionalText;

  return (
    <div className="fds-question-wrapper">
      {/* Question Label - Only show if titleLocation is not "hidden" */}
      {!isTitleHidden && (
        <div className="fds-question-label" style={{ marginBottom: '8px' }}>
          {(() => {
            const processedLabel = processMarkdown(labelWithOptional);
            const hasHtml = processedLabel.includes('<');
            
            if (hasHtml) {
              // For HTML content, use Typography component wrapper to ensure font inheritance
              return (
                <Typography variant="body2" weight="regular" color="moderate">
                  <span dangerouslySetInnerHTML={{ __html: processedLabel }} />
                </Typography>
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
        </div>
      )}

      {/* Question Description (optional) - Only show if titleLocation is not "hidden" and positioned above form control when descriptionLocation is not "underInput" */}
      {!isTitleHidden && description && showDescriptionAbove && (
        <div className="fds-question-description" style={{ marginBottom: '12px' }}>
          {renderQuestionDescription(description, question)}
        </div>
      )}

      {/* Form Control (children) */}
      <div className="fds-question-control">
        {children}
      </div>

      {/* Question Description (optional) - Only show if titleLocation is not "hidden" and positioned below form control when descriptionLocation is "underInput" */}
      {!isTitleHidden && description && !showDescriptionAbove && (
        <div className="fds-question-description" style={{ marginTop: '12px' }}>
          {renderQuestionDescription(description, question)}
        </div>
      )}

      {/* Error Message */}
      {isInvalid && errorMessage && (
        <div className="fds-question-error" style={{ marginTop: '8px' }}>
          <FDSErrorDisplay message={errorMessage} />
        </div>
      )}
    </div>
  );
};
