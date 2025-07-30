import React from "react";
import { ReactQuestionFactory, SurveyQuestionElementBase } from "survey-react-ui";
import { QuestionBooleanModel } from "survey-core";
import { Toggle } from "@ui/ford-ui-components/src/v2/toggle/Toggle";
import { useQuestionValidation, renderLabel, renderDescription, getOptionalText } from "./FDSShared";

export class FDSToggleRenderer extends SurveyQuestionElementBase {
    constructor(props: any) {
        super(props);
    }

    protected get question(): QuestionBooleanModel {
        return this.questionBase as QuestionBooleanModel;
    }

    protected canRender(): boolean {
        return super.canRender();
    }

    protected renderElement(): JSX.Element {
        const question = this.question;
        const { isInvalid, errorMessage } = useQuestionValidation(question);
        const optionalText = getOptionalText(question);
        
        // Handle labels that might contain JSX elements
        const labelContent = renderLabel(question.fullTitle);
        const label = typeof labelContent === 'string' ? labelContent : question.fullTitle;
        
        const descriptionContent = renderDescription(question.description);
        const description = typeof descriptionContent === 'string' ? descriptionContent : question.description;

        // Handle boolean values - SurveyJS boolean questions can be true, false, or undefined
        const isSelected = question.value === true;

        return (
            <div 
                className="fds-toggle-wrapper"
                data-testid={`fds-toggle-${question.name}`}
            >
                {/* Label */}
                {label && (
                    <div className="fds-toggle-label font-semibold mb-2">
                        {label}
                        {!question.isRequired && <span className="text-gray-500">{optionalText}</span>}
                    </div>
                )}
                
                {/* Description */}
                {description && (
                    <div className="fds-toggle-description text-gray-600 mb-3">
                        {description}
                    </div>
                )}
                
                {/* Toggle Component */}
                <Toggle
                    isSelected={isSelected}
                    isDisabled={question.isReadOnly}
                    onChange={(checked: boolean) => {
                        question.value = checked;
                    }}
                    onBlur={() => {
                        question.validate();
                    }}
                    data-testid={`fds-toggle-input-${question.name}`}
                    aria-label={question.fullTitle}
                >
                    {/* Optional toggle label text */}
                    {question.labelTrue || question.labelFalse ? (
                        isSelected ? (question.labelTrue || "Yes") : (question.labelFalse || "No")
                    ) : null}
                </Toggle>
                
                {/* Error Message */}
                {isInvalid && errorMessage && (
                    <div className="fds-toggle-error text-red-600 text-sm mt-2">
                        {errorMessage}
                    </div>
                )}
            </div>
        );
    }
}

// Register the toggle renderer
ReactQuestionFactory.Instance.registerQuestion(
    "boolean",
    (props) => {
        return React.createElement(FDSToggleRenderer, props);
    }
);