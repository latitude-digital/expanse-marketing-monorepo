import React from 'react';
import { Typography } from "@ui/ford-ui-components";
import { renderLabel, renderDescription, processMarkdown, getOptionalText, renderQuestionDescription, isQuestionEffectivelyRequired } from './utils';
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
  const isCustomBoolean = !!question?.__fdsCustomBoolean;
  
  // Check description location setting - similar to RadioButtonButton renderer
  const showDescriptionAbove = !question?.descriptionLocation || question.descriptionLocation !== "underInput";
  const shouldShowDescriptionAbove = Boolean(description && showDescriptionAbove && (!isTitleHidden || isCustomBoolean));
  const shouldShowDescriptionBelow = Boolean(description && !showDescriptionAbove && (!isTitleHidden || isCustomBoolean));

  // Enhanced required detection: include dynamic requiredIf logic, parent requirements, and validator expressions
  const requiredFromSurvey = isQuestionEffectivelyRequired(question, isRequired);
  const requiredFromValidators = question?.validators && question.validators.some((validator: any) => 
    validator.type === 'expression' && validator.expression?.includes('notempty')
  );
  const isActuallyRequired = Boolean(requiredFromSurvey || requiredFromValidators);

  // Get the optional text and append it to the label if not required (similar to how StyledTextField works)
  if (process.env.NODE_ENV !== 'production' && question?.name) {
    console.log('[FDSQuestionWrapper] requirement check', {
      name: question.name,
      isRequiredProp: isRequired,
      requiredIf: question?.requiredIf,
      parentRequired: question?.parentQuestion?.isRequired,
      effectiveRequired: isActuallyRequired,
    });
  }

  const optionalText = !isActuallyRequired && question ? getOptionalText(question) : '';
  const labelWithOptional = (label || '') + optionalText;

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
                <Typography
                  displayStyle="body-2-regular"
                  displayColor="text-onlight-moderate-default"
                  displayBox="inline"
                  spanProps={{ className: "text-ford-body2-regular" }}
                >
                  <span dangerouslySetInnerHTML={{ __html: processedLabel }} />
                </Typography>
              );
            } else {
              // For plain text, use Typography component
              return (
                <Typography
                  displayStyle="body-2-regular"
                  displayColor="text-onlight-moderate-default"
                  displayBox="inline"
                  spanProps={{ className: "text-ford-body2-regular" }}
                >
                  {processedLabel}
                </Typography>
              );
            }
          })()}
        </div>
      )}

      {/* Question Description (optional) - Only show if titleLocation is not "hidden" and positioned above form control when descriptionLocation is not "underInput" */}
      {shouldShowDescriptionAbove && (
        <div className="fds-question-description" style={{ marginBottom: '12px' }}>
          {renderQuestionDescription(description, question)}
        </div>
      )}

      {/* Form Control (children) */}
      <div className="fds-question-control">
        {children}
      </div>

      {/* Question Description (optional) - Only show if titleLocation is not "hidden" and positioned below form control when descriptionLocation is "underInput" */}
      {shouldShowDescriptionBelow && (
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
