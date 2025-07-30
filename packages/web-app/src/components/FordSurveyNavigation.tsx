import React, { useState, useEffect } from 'react';
import { Model } from 'survey-core';
import { StyledButton } from '@ui/ford-ui-components/src/v2/button/Button';

interface FordSurveyNavigationProps {
  survey: Model;
  brand?: string;
}

export const FordSurveyNavigation: React.FC<FordSurveyNavigationProps> = ({ 
  survey, 
  brand 
}) => {
  const [isFirstPage, setIsFirstPage] = useState(true);
  const [isLastPage, setIsLastPage] = useState(false);
  const [canComplete, setCanComplete] = useState(false);

  // Update navigation state when survey changes
  useEffect(() => {
    const updateNavigationState = () => {
      setIsFirstPage(survey.isFirstPage);
      setIsLastPage(survey.isLastPage);
      setCanComplete(survey.isLastPage && survey.currentPage.hasErrors === false);
    };

    // Initial state
    updateNavigationState();

    // Listen for survey state changes
    const onCurrentPageChanged = () => {
      updateNavigationState();
    };

    const onValueChanged = () => {
      updateNavigationState();
    };

    const onValidateQuestion = () => {
      updateNavigationState();
    };

    survey.onCurrentPageChanged.add(onCurrentPageChanged);
    survey.onValueChanged.add(onValueChanged);
    survey.onValidateQuestion.add(onValidateQuestion);

    // Cleanup event listeners
    return () => {
      survey.onCurrentPageChanged.remove(onCurrentPageChanged);
      survey.onValueChanged.remove(onValueChanged);
      survey.onValidateQuestion.remove(onValidateQuestion);
    };
  }, [survey]);

  const handlePrevious = () => {
    survey.prevPage();
  };

  const handleNext = () => {
    survey.nextPage();
  };

  const handleComplete = () => {
    survey.tryComplete();
  };

  // Don't render navigation if survey is completed
  if (survey.state === 'completed') {
    return null;
  }

  return (
    <div 
      className="ford-survey-navigation"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        margin: '0 24px',
        borderTop: '1px solid var(--semantic-color-stroke-onlight-subtle-default)'
      }}
    >
      {/* Previous button - only show if not first page */}
      <div style={{ flex: '0 0 auto' }}>
        {!isFirstPage && (
          <StyledButton
            variant="secondary"
            onClick={handlePrevious}
            aria-label="Previous page"
            data-testid="ford-nav-previous"
          >
            Previous
          </StyledButton>
        )}
      </div>

      {/* Next/Complete button - always show on right */}
      <div style={{ flex: '0 0 auto' }}>
        {isLastPage ? (
          <StyledButton
            variant="primary"
            onClick={handleComplete}
            aria-label="Complete survey"
            data-testid="ford-nav-complete"
          >
            Complete
          </StyledButton>
        ) : (
          <StyledButton
            variant="primary"
            onClick={handleNext}
            aria-label="Next page"
            data-testid="ford-nav-next"
          >
            Next
          </StyledButton>
        )}
      </div>
    </div>
  );
};