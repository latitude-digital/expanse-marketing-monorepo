import React from "react";
import { ReactElementFactory } from "survey-react-ui";
import { Question } from "survey-core";

interface CustomSurveyQuestionProps {
  element: Question;
  creator: any;
  survey: any;
  css: any;
}

/**
 * Custom SurveyQuestion component that bypasses SurveyJS title and error rendering.
 * This allows Ford UI components to handle their own labels and error states
 * without interference from SurveyJS wrapper elements.
 */
export class CustomSurveyQuestion extends React.Component<CustomSurveyQuestionProps> {
  private rootRef = React.createRef<HTMLDivElement>();
  private errorObserver: MutationObserver | null = null;

  componentDidMount() {
    const { element } = this.props;
    if (this.rootRef.current && element) {
      element.setWrapperElement(this.rootRef.current);
      this.setupErrorHandling();
    }
  }

  componentWillUnmount() {
    const { element } = this.props;
    if (element) {
      element.setWrapperElement(undefined);
    }
    if (this.errorObserver) {
      this.errorObserver.disconnect();
      this.errorObserver = null;
    }
  }

  componentDidUpdate(prevProps: CustomSurveyQuestionProps) {
    if (prevProps.element !== this.props.element) {
      if (prevProps.element) {
        prevProps.element.setWrapperElement(undefined);
      }
      if (this.props.element && this.rootRef.current) {
        this.props.element.setWrapperElement(this.rootRef.current);
        this.setupErrorHandling();
      }
    }
    
    // Check if errors changed and handle accordingly
    const prevErrors = prevProps.element?.errors || [];
    const currentErrors = this.props.element?.errors || [];
    if (prevErrors.length !== currentErrors.length) {
      this.handleErrorsChanged();
    }
  }

  setupErrorHandling() {
    const { element } = this.props;
    if (!element) return;

    // Listen for error changes on the question
    element.registerFunctionOnPropertyValueChanged("errors", () => {
      this.handleErrorsChanged();
    });
  }

  handleErrorsChanged() {
    const { element } = this.props;
    if (!element || !this.rootRef.current) return;

    // Use requestAnimationFrame to wait for React to render the error
    requestAnimationFrame(() => {
      const hasErrors = element.errors && element.errors.length > 0;
      
      if (hasErrors) {
        // Add a marker class that SurveyJS can detect
        this.rootRef.current?.classList.add('sv-question--has-error');
        
        // If this is the first error on the page, trigger scroll and focus
        if (this.isFirstErrorOnPage()) {
          this.scrollToAndFocus();
        }
      } else {
        // Remove error marker
        this.rootRef.current?.classList.remove('sv-question--has-error');
      }
    });
  }

  isFirstErrorOnPage() {
    const { element, survey } = this.props;
    if (!survey || !element) return false;

    const currentPage = survey.currentPage;
    if (!currentPage) return false;

    // Get all questions with errors on current page
    const questionsWithErrors = currentPage.questions.filter((q: Question) => 
      q.errors && q.errors.length > 0
    );

    // Check if this is the first question with errors
    return questionsWithErrors[0] === element;
  }

  scrollToAndFocus() {
    if (!this.rootRef.current) return;

    // Use setTimeout to ensure DOM is fully updated
    setTimeout(() => {
      // Scroll to the element
      const rect = this.rootRef.current!.getBoundingClientRect();
      const scrollY = window.pageYOffset + rect.top - 100; // 100px offset from top
      
      window.scrollTo({
        top: scrollY,
        behavior: 'smooth'
      });

      // Focus the first input if it's a text input
      const { element } = this.props;
      if (element && (element.getType() === 'text' || 
                     element.getType() === 'comment' || 
                     element.getType() === 'multipletext')) {
        const input = this.rootRef.current!.querySelector('input, textarea') as HTMLElement;
        if (input) {
          // Delay focus slightly to ensure scroll completes
          setTimeout(() => {
            input.focus();
          }, 300);
        }
      }
    }, 100);
  }

  render() {
    const { element, creator, survey, css } = this.props;
    
    if (!element || !creator) {
      return null;
    }

    // Check if we're in Survey Creator/Designer mode - if so, don't interfere
    // Let SurveyJS handle its own rendering for the designer interface
    // BUT allow Preview mode to use custom rendering (no SurveyJS default titles)
    const isDesignerMode = 
      (creator && (creator.isCreator || creator.isDesignMode || creator.readOnly === false)) ||
      (survey && (survey.isDesignMode || survey.mode === 'design')) ||
      // Check if we're in the SurveyJS Creator environment, but exclude Preview mode
      (typeof window !== 'undefined' && 
       window.location.pathname.includes('/admin/') && 
       !window.location.hash.includes('preview') &&
       !document.querySelector('[role="tabpanel"][aria-labelledby*="Preview"]'));

    if (isDesignerMode) {
      // Return null to let SurveyJS use its default question renderer
      return null;
    }

    // Only render the question element itself, bypassing SurveyJS title and error wrappers
    const questionElement = creator.createQuestionElement(element);
    
    if (!questionElement) {
      return null;
    }

    // Get CSS classes for the wrapper but don't include title/error styling
    const cssClasses = element.cssClasses;
    const wrapperClass = cssClasses?.questionWrapper || "sv_q_wrapper";

    return (
      <div
        className={wrapperClass}
        style={element.rootStyle}
        data-name={element.name}
        data-key={element.name}
        onFocus={() => {
          if (element.isQuestion) {
            (element as any).focusIn();
          }
        }}
        ref={this.rootRef}
      >
        {questionElement}
      </div>
    );
  }
}

// Conditionally register the custom survey question component
// Only register if NOT in a designer/admin context
const isInDesignerContext = 
  typeof window !== 'undefined' && window.location.pathname.includes('/admin/');

if (!isInDesignerContext) {
  // Register the custom survey question component for runtime surveys only
  ReactElementFactory.Instance.registerElement("question", (props: CustomSurveyQuestionProps) => {
    return React.createElement(CustomSurveyQuestion, props);
  });

  ReactElementFactory.Instance.registerElement("survey-question", (props: CustomSurveyQuestionProps) => {
    return React.createElement(CustomSurveyQuestion, props);
  });
}