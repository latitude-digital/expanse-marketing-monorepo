import React from "react";
import { ReactQuestionFactory, SurveyQuestionElementBase } from "survey-react-ui";
import { QuestionTextModel } from "survey-core";
import { StyledTextField } from "@ui/ford-ui-components/src/v2/inputField/Input";
import { renderLabel, renderDescription, getOptionalText } from "./FDSShared/utils";

interface ParsedAddress {
  formatted_address?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

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
        const inputType = this.getInputType();
        const optionalText = getOptionalText(question);
        
        // Get validation state from question
        const isInvalid = question.errors && question.errors.length > 0;
        const errorMessage = isInvalid ? question.errors[0]?.text : undefined;
        
        return (
            <StyledTextField
                label={renderLabel(question.fullTitle)}
                description={renderDescription(question.description)}
                isRequired={question.isRequired}
                requiredMessage={optionalText}
                placeholder={question.placeholder || ""}
                value={question.value || ""}
                isInvalid={isInvalid}
                errorMessage={errorMessage}
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

// Also register for email text input type
ReactQuestionFactory.Instance.registerQuestion(
    "emailtextinput",
    (props) => {
        return React.createElement(FDSTextRenderer, props);
    }
);