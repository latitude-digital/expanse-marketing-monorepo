import React from "react";
import { ReactQuestionFactory, SurveyQuestionElementBase } from "survey-react-ui";
import { QuestionCommentModel } from "survey-core";
import { TextArea } from "@ui/ford-ui-components";
import { useQuestionValidation, renderLabel, renderDescription, getOptionalText } from "./FDSShared";

export class FDSTextAreaRenderer extends SurveyQuestionElementBase {
    constructor(props: any) {
        super(props);
    }

    protected get question(): QuestionCommentModel {
        return this.questionBase as QuestionCommentModel;
    }

    protected canRender(): boolean {
        return super.canRender();
    }

    protected renderElement(): JSX.Element {
        const question = this.question;
        const { isInvalid, errorMessage } = useQuestionValidation(question);
        const optionalText = getOptionalText(question);
        
        // Check if title and description should be hidden
        const isTitleHidden = question.titleLocation === "hidden";

        return (
            <TextArea
                label={isTitleHidden ? undefined : renderLabel(question.fullTitle)}
                description={isTitleHidden ? undefined : renderDescription(question.description)}
                placeholder={question.placeholder || ""}
                value={question.value || ""}
                rows={question.rows || 4}
                maxLength={question.maxLength}
                isInvalid={isInvalid}
                errorMessage={errorMessage}
                isRequired={question.isRequired}
                requiredMessage={optionalText}
                isDisabled={question.isReadOnly}
                showCharacterCount={typeof question.maxLength === 'number' && question.maxLength > 0}
                onChange={(value: string) => {
                    question.value = value;
                }}
                onBlur={() => {
                    question.validate();
                }}
                data-testid={`fds-textarea-${question.name}`}
                aria-label={question.fullTitle}
            />
        );
    }
}

// Register the textarea renderer
ReactQuestionFactory.Instance.registerQuestion(
    "comment",
    (props) => {
        return React.createElement(FDSTextAreaRenderer, props);
    }
);
