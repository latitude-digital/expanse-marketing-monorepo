import React, { useState, useEffect } from "react";
import { ReactQuestionFactory, SurveyQuestionElementBase } from "survey-react-ui";
import { QuestionRatingModel } from "survey-core";
import { StyledButton } from "@ui/ford-ui-components/src/v2/button/Button";
import { StyledSelectDropdown as SelectDropdown } from "@ui/ford-ui-components/src/v2/selectDropdown/SelectDropdown";
import { useQuestionValidation, renderLabel, renderDescription, getOptionalText, FDSQuestionWrapper } from "./FDSShared";

// Custom hook for responsive behavior
const useBreakpoint = () => {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768; // md breakpoint in Tailwind
  });

  useEffect(() => {
    const checkBreakpoint = () => {
      const windowWidth = window.innerWidth;
      const mobileBreakpoint = 768; // md breakpoint in Tailwind
      setIsMobile(windowWidth < mobileBreakpoint);
    };

    checkBreakpoint();
    window.addEventListener('resize', checkBreakpoint);
    
    return () => window.removeEventListener('resize', checkBreakpoint);
  }, []);

  return isMobile;
};


// Functional component for React hooks usage
const FDSRatingComponent: React.FC<{ question: QuestionRatingModel }> = ({ question }) => {
  const isMobile = useBreakpoint();
  
  // Use shared validation utilities
  const { isInvalid, errorMessage } = useQuestionValidation(question);
  const optionalText = getOptionalText(question);
  
  
  // Generate rating scale options
  const generateRatingOptions = () => {
    const options = [];
    const minRateValue = question.rateMin;
    const maxRateValue = question.rateMax;
    const step = question.rateStep;
    
    // Get helper labels - SurveyJS stores these differently than minRateDescription/maxRateDescription
    // Check various properties where the labels might be stored
    const rateValues = question.rateValues || [];
    const displayMode = question.displayMode || question.rateDisplayMode;
    
    // Default helper labels based on common patterns
    const leftLabel = question.minRateDescription || question.rateMin_text || 'Poor';
    const rightLabel = question.maxRateDescription || question.rateMax_text || 'Excellent';
    
    for (let i = minRateValue; i <= maxRateValue; i += step) {
      let displayText = i.toString();
      
      // Add helper labels for min and max values (format: "1 – Poor", "10 – Excellent")
      if (i === minRateValue && leftLabel) {
        displayText = `${i} – ${leftLabel}`;
      } else if (i === maxRateValue && rightLabel) {
        displayText = `${i} – ${rightLabel}`;
      }
      
      options.push({
        value: i,
        label: i.toString(),
        displayText: displayText,
      });
    }
    
    return options;
  };

  const ratingOptions = generateRatingOptions();
  
  // Mobile dropdown rendering
  const renderMobileDropdown = () => {
    // Transform rating options to SelectDropdown format
    const selectOptions = ratingOptions.map((option, index) => ({
      id: option.value,
      label: option.displayText,
      value: option.value
    }));

    return (
      <SelectDropdown
        label={question.title}
        description={question.description}
        placeholder="Select rating..."
        options={selectOptions}
        selectedKey={question.value || null}
        variant="select"
        isInvalid={isInvalid}
        errorMessage={errorMessage}
        isRequired={question.isRequired}
        requiredMessage={optionalText}
        isDisabled={question.isReadOnly}
        listBoxProps={{
          style: { 
            maxHeight: '300px', // Allow up to 300px height for dropdown
            minHeight: '200px'  // Ensure minimum height to show multiple options
          },
          className: 'outline-none overflow-auto' // Enable scrolling
        }}
        onSelectionChange={(key: any) => {
          // SelectDropdown onSelectionChange provides Key type, need to find corresponding option value
          const selectedOption = selectOptions.find(opt => opt.id === key);
          if (selectedOption) {
            question.value = selectedOption.value;
          }
        }}
        onBlur={() => {
          question.validate();
        }}
        data-testid={`fds-rating-${question.name}`}
        aria-label={question.title}
      />
    );
  };

  // Desktop button grid rendering
  const renderDesktopButtons = () => {
    // Handle labels that might contain JSX elements
    const labelContent = renderLabel(question.title);
    const label = typeof labelContent === 'string' ? labelContent : question.title;
    
    const descriptionContent = renderDescription(question.description);
    const description = typeof descriptionContent === 'string' ? descriptionContent : question.description;

    // Get helper labels (same logic as in generateRatingOptions)
    const leftLabel = question.minRateDescription || question.rateMin_text || 'Poor';
    const rightLabel = question.maxRateDescription || question.rateMax_text || 'Excellent';

    return (
      <FDSQuestionWrapper
        label={label}
        description={description}
        isRequired={question.isRequired}
        isInvalid={isInvalid}
        errorMessage={errorMessage}
        question={question}
      >
        <div className="flex items-center gap-4">
          {/* Left helper label */}
          {leftLabel && (
            <span className="text-sm text-[var(--semantic-color-text-onlight-subtle)] whitespace-nowrap">
              {leftLabel}
            </span>
          )}
          
          {/* Rating buttons */}
          <div 
            className="flex flex-wrap gap-2 items-center"
            role="radiogroup" 
            aria-label={question.title}
          >
            {ratingOptions.map((option) => {
              const isSelected = question.value === option.value;
              
              return (
                <StyledButton
                  key={option.value}
                  variant={isSelected ? "primary" : "secondary"}
                  emphasis="default"
                  className={`
                    min-w-[44px] h-11 rounded-full px-4 transition-all duration-200
                    ${isSelected ? 'scale-105' : 'hover:scale-105'}
                    ${question.isReadOnly ? 'pointer-events-none opacity-50' : ''}
                  `}
                  isDisabled={question.isReadOnly}
                  onPress={() => {
                    if (!question.isReadOnly) {
                      question.value = option.value;
                      question.validate();
                    }
                  }}
                  aria-pressed={isSelected}
                  aria-label={`Rate ${option.value}`}
                  title={`Rating: ${option.value}`}
                >
                  {option.label}
                </StyledButton>
              );
            })}
          </div>
          
          {/* Right helper label */}
          {rightLabel && (
            <span className="text-sm text-[var(--semantic-color-text-onlight-subtle)] whitespace-nowrap">
              {rightLabel}
            </span>
          )}
        </div>
      </FDSQuestionWrapper>
    );
  };

  // Conditional rendering based on screen size
  return isMobile ? renderMobileDropdown() : renderDesktopButtons();
};

export class FDSRatingRenderer extends SurveyQuestionElementBase {
  constructor(props: any) {
    super(props);
  }

  protected get question(): QuestionRatingModel {
    return this.questionBase as QuestionRatingModel;
  }

  protected canRender(): boolean {
    return super.canRender();
  }

  protected renderElement(): JSX.Element {
    return <FDSRatingComponent question={this.question} />;
  }
}

// Register the rating renderer
ReactQuestionFactory.Instance.registerQuestion(
  "rating",
  (props) => {
    return React.createElement(FDSRatingRenderer, props);
  }
);