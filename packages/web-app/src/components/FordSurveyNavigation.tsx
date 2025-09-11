import React, { useState, useEffect } from 'react';
import { Model } from 'survey-core';
import { StyledButton } from '@ui/ford-ui-components';

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
  const [isCompleted, setIsCompleted] = useState(false);

  // Update navigation state when survey changes
  useEffect(() => {
    const updateNavigationState = () => {
      setIsFirstPage(survey.isFirstPage);
      setIsLastPage(survey.isLastPage);
      setCanComplete(survey.isLastPage && survey.currentPage.hasErrors === false);
      // Use public SurveyJS state to determine completion.
      // TODO(meridian): We previously relied on a private field `survey.isCompleted` to work around
      // a SurveyJS bug where `state` didn't always flip to "completed" in some flows.
      // If we observe regressions, consider restoring the fallback below or deleting this note.
      // const completed = (survey as any).isCompleted || survey.state === 'completed';
      // setIsCompleted(completed);
      setIsCompleted(survey.state === 'completed');
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

    const onComplete = () => {
      updateNavigationState();
    };

    survey.onCurrentPageChanged.add(onCurrentPageChanged);
    survey.onValueChanged.add(onValueChanged);
    survey.onValidateQuestion.add(onValidateQuestion);
    survey.onComplete.add(onComplete);

    // Cleanup event listeners
    return () => {
      survey.onCurrentPageChanged.remove(onCurrentPageChanged);
      survey.onValueChanged.remove(onValueChanged);
      survey.onValidateQuestion.remove(onValidateQuestion);
      survey.onComplete.remove(onComplete);
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

  // Don't render navigation buttons in these scenarios:
  // 1. Survey is completed (state = "completed") 
  // 2. Survey is in any non-running state (loading, empty, etc.)
  // 3. React state isCompleted is true (from our event listener)
  // TODO(meridian): If the old workaround is needed again, extend the guard with
  // `|| (survey as any).isCompleted` — see note above.
  if (survey.state === 'completed' || survey.state !== 'running' || isCompleted) {
    return null;
  }

  return (
    <div 
      className="ford-survey-navigation"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        margin: '24px 24px 0 24px',
        paddingTop: '16px',
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
