import React from "react";
import { ReactQuestionFactory, SurveyQuestionElementBase } from "survey-react-ui";
import { QuestionBooleanModel } from "survey-core";
import { Toggle } from "@ui/ford-ui-components";
import { FDSQuestionWrapper } from "./FDSShared/FDSQuestionWrapper";
import { useQuestionValidation } from "./FDSShared/utils";

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

        // Handle boolean values - SurveyJS boolean questions can be true, false, or undefined
        const isSelected = question.value === true;

        return (
            <FDSQuestionWrapper
                label={question.fullTitle}
                description={question.description}
                isRequired={question.isRequired}
                isInvalid={isInvalid}
                errorMessage={errorMessage}
                question={question}
            >
                <div data-testid={`fds-toggle-${question.name}`}>
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
                </div>
            </FDSQuestionWrapper>
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
