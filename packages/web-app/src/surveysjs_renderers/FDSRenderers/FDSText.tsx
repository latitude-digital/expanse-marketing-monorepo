import React from "react";
import { ReactQuestionFactory, SurveyQuestionElementBase } from "survey-react-ui";
import { QuestionTextModel } from "survey-core";
// import { StyledTextField } from "@ui/ford-ui-components/src/v2/inputField/Input"; // Commented out for TypeScript migration testing
import "./FDSText.css";

export class FDSTextRenderer extends SurveyQuestionElementBase {
    constructor(props: any) {
        super(props);
    }

    protected get question(): QuestionTextModel {
        return this.questionBase as QuestionTextModel;
    }

    protected canRender(): boolean {
        return super.canRender();
    }

    protected renderElement(): JSX.Element {
        const question = this.question;
        
        // Get the question title and handle required/optional indication
        const title = question.fullTitle;
        const isRequired = question.isRequired;
        
        // Get error message if validation failed
        const errorMessage = question.errors.length > 0 ? question.errors[0].text : undefined;
        const isInvalid = question.errors.length > 0;
        
        // Get description from question description property
        const description = question.description;
        
        // Handle different input types
        const inputType = this.getInputType();
        
        return (
            <StyledTextField
                label={title}
                isRequired={isRequired}
                placeholder={question.placeholder || ""}
                value={question.value || ""}
                isInvalid={isInvalid}
                errorMessage={errorMessage}
                description={description}
                type={inputType}
                isDisabled={question.isReadOnly}
                onChange={(value: string) => {
                    question.value = value;
                }}
                onBlur={() => {
                    // Trigger validation on blur
                    question.validate();
                }}
                data-testid={`fds-text-${question.name}`}
            />
        );
    }

    private getInputType(): string {
        const question = this.question;
        
        // Map SurveyJS input types to HTML input types
        switch (question.inputType) {
            case "email":
                return "email";
            case "number":
                return "number";
            case "password":
                return "password";
            case "tel":
                return "tel";
            case "url":
                return "url";
            case "date":
                return "date";
            case "datetime-local":
                return "datetime-local";
            case "time":
                return "time";
            default:
                return "text";
        }
    }
}

// Override the default text question renderer with our Ford UI version
ReactQuestionFactory.Instance.registerQuestion(
    "text",
    (props) => {
        return React.createElement(FDSTextRenderer, props);
    }
);