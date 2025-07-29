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

  componentDidMount() {
    const { element } = this.props;
    if (this.rootRef.current && element) {
      element.setWrapperElement(this.rootRef.current);
    }
  }

  componentWillUnmount() {
    const { element } = this.props;
    if (element) {
      element.setWrapperElement(undefined);
    }
  }

  componentDidUpdate(prevProps: CustomSurveyQuestionProps) {
    if (prevProps.element !== this.props.element) {
      if (prevProps.element) {
        prevProps.element.setWrapperElement(undefined);
      }
      if (this.props.element && this.rootRef.current) {
        this.props.element.setWrapperElement(this.rootRef.current);
      }
    }
  }

  render() {
    const { element, creator, survey, css } = this.props;
    
    if (!element || !creator) {
      return null;
    }

    // Check if we're in Survey Creator/Designer mode - if so, don't interfere
    // Let SurveyJS handle its own rendering for the designer interface
    const isDesignerMode = 
      (creator && (creator.isCreator || creator.isDesignMode || creator.readOnly === false)) ||
      (survey && (survey.isDesignMode || survey.mode === 'design')) ||
      // Check if we're in the SurveyJS Creator environment
      (typeof window !== 'undefined' && window.location.pathname.includes('/admin/'));

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